
// ============================================================================
// LOCAL STORAGE MANAGER
// Handles persistence of transactions and customers in browser localStorage
// ============================================================================
import { supabase } from './supabase';

const KEYS = {
    TRANSACTIONS: 'pharmacy_transactions',
    CUSTOMERS: 'pharmacy_customers',
    SETTINGS: 'pharmacy_settings'
};

export interface Transaction {
    id: string;
    bill_number: string;
    customer_name: string;
    customer_phone: string;
    items: any[];
    subtotal: number;
    discount: number;
    gst_amount: number;
    total_amount: number;
    payment_method: string;
    date: string;
    payment_status: string;
}

export const storage = {
    // TRANSACTIONS
    saveTransaction: async (transaction: Transaction) => {
        // 1. Save to LocalStorage (Immediate UI update & Offline backup)
        const history = storage.getTransactions();
        history.unshift(transaction); // Add to top
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(history));

        // Also update customer history if phone exists
        if (transaction.customer_phone) {
            storage.updateCustomer(transaction);
        }

        // 2. Save to Supabase (Cloud Persistence)
        try {
            const { error } = await supabase.from('transactions').insert({
                bill_number: transaction.bill_number,
                customer_name: transaction.customer_name,
                customer_phone: transaction.customer_phone,
                items: transaction.items,
                subtotal: transaction.subtotal,
                discount: transaction.discount,
                gst_amount: transaction.gst_amount,
                total_amount: transaction.total_amount,
                payment_method: transaction.payment_method,
                payment_status: transaction.payment_status,
                transaction_id: (transaction as any).upi_transaction_id || null
            });

            if (error) {
                console.error('Supabase Transaction Save Error:', error);
            } else {
                console.log('✅ Bill saved to Supabase Cloud!');
            }
        } catch (err) {
            console.error('Supabase Save Exception:', err);
        }
    },

    getTransactions: (): Transaction[] => {
        try {
            const data = localStorage.getItem(KEYS.TRANSACTIONS);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    // CUSTOMERS
    updateCustomer: (txn: Transaction) => {
        const customers = storage.getCustomers();
        let customer = customers.find(c => c.phone === txn.customer_phone);

        if (customer) {
            customer.last_visit = txn.date;
            customer.total_purchases += txn.total_amount;
            customer.visit_count += 1;
        } else {
            customers.push({
                phone: txn.customer_phone,
                name: txn.customer_name,
                total_purchases: txn.total_amount,
                visit_count: 1,
                last_visit: txn.date,
                joined_at: new Date().toISOString()
            });
        }

        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    },

    getCustomers: (): any[] => {
        try {
            const data = localStorage.getItem(KEYS.CUSTOMERS);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    // INIT WITH SAMPLE DATA (if empty)
    init: async () => {
        if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
            try {
                const response = await fetch('/data/transactions.json');
                const data = await response.json();
                if (data.transactions) {
                    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
                    console.log('✅ Local storage initialized with sample transactions');
                }
            } catch (err) {
                console.error('Failed to load sample transactions', err);
            }
        }
    }
};
