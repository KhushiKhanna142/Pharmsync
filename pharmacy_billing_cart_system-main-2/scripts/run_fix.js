import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();
        console.log('🔌 Connected to database');

        const sqlPath = path.join(__dirname, '../supabase/add_pack_size.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing add_pack_size.sql...');
        await client.query(sql);
        console.log('✅ Custom SQL executed successfully');

    } catch (err) {
        console.error('❌ Execution failed:', err);
    } finally {
        await client.end();
    }
}

main();
