
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DB_CONNECTION_STRING;

if (!connectionString) {
    console.error('❌ DB_CONNECTION_STRING is missing in .env');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runSqlFile(filePath) {
    console.log(`📖 Reading ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`🚀 Executing ${path.basename(filePath)}...`);
    // Split by semicolon? No, usually pg client can handle multiple statements or we should split if needed.
    // schema.sql contains functions/triggers (BEGIN/END), so splitting by semicolon is dangerous.
    // Let's try executing as one block.

    try {
        await client.query(sql);
        console.log(`✅ ${path.basename(filePath)} executed successfully`);
    } catch (err) {
        console.error(`❌ Error executing ${path.basename(filePath)}:`, err.message);
        throw err;
    }
}

async function main() {
    try {
        await client.connect();
        console.log('🔌 Connected to database');

        // 1. Run Schema
        const schemaPath = path.join(__dirname, '../supabase/schema.sql');
        if (fs.existsSync(schemaPath)) {
            await runSqlFile(schemaPath);
        } else {
            console.warn('⚠️ schema.sql not found');
        }

        // 2. Run Seed
        const seedPath = path.join(__dirname, '../supabase/seed.sql');
        if (fs.existsSync(seedPath)) {
            console.log('🌱 Seeding database (this may take a while)...');
            await runSqlFile(seedPath);
        } else {
            console.warn('⚠️ seed.sql not found');
        }

        console.log('✨ Database setup complete!');
    } catch (err) {
        console.error('❌ Database setup failed:', err);
    } finally {
        await client.end();
    }
}

main();
