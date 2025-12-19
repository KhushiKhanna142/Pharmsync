-- ============================================================================
-- PHARMACY BILLING SYSTEM - SUPABASE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PRODUCTS TABLE (Medicines + Pharmacy Items)
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(50) NOT NULL, -- 'MEDICINE', 'OTC', 'PERSONAL_CARE', 'BABY_PRODUCTS'
  subcategory VARCHAR(50), -- 'FEVER', 'ANTIBIOTIC', 'PAIN_RELIEF', etc.
  manufacturer VARCHAR(255),
  pack_size VARCHAR(50), -- '10 tablets', '100ml syrup', '1 piece'
  dosage VARCHAR(50), -- '500mg', '10mg', null for non-medicines
  mrp DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2), -- For profit calculation
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  prescription_required BOOLEAN DEFAULT false,
  gst_percentage DECIMAL(5, 2) DEFAULT 12.00,
  hsn_code VARCHAR(20), -- For GST billing
  is_active BOOLEAN DEFAULT true,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subcategory ON products(subcategory);

-- ============================================================================
-- 2. CUSTOMERS TABLE (For SMS Receipts)
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  total_purchases DECIMAL(12, 2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================================================
-- 3. TRANSACTIONS TABLE (Bills)
-- ============================================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_phone VARCHAR(15),
  customer_name VARCHAR(255),
  pharmacist_id VARCHAR(50), -- Can link to auth.users later
  pharmacist_name VARCHAR(255),
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment details
  payment_method VARCHAR(20) NOT NULL, -- 'CASH', 'UPI', 'CARD'
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'
  upi_transaction_id VARCHAR(100), -- From UPI payment
  
  -- SMS receipt
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_bill_number ON transactions(bill_number);
CREATE INDEX idx_transactions_customer_phone ON transactions(customer_phone);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- 4. TRANSACTION ITEMS TABLE (Line Items)
-- ============================================================================
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Product snapshot (in case product details change later)
  product_name VARCHAR(255) NOT NULL,
  product_barcode VARCHAR(20),
  pack_size VARCHAR(50),
  
  -- Pricing
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  gst_percentage DECIMAL(5, 2) DEFAULT 12.00,
  line_total DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);

-- ============================================================================
-- 5. PAYMENT LOGS TABLE (Track all payment attempts)
-- ============================================================================
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id),
  payment_method VARCHAR(20),
  amount DECIMAL(10, 2),
  status VARCHAR(20), -- 'INITIATED', 'SUCCESS', 'FAILED'
  upi_transaction_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bill_number = 'PHM' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('bill_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE bill_sequence START 1;

CREATE TRIGGER auto_generate_bill_number
BEFORE INSERT ON transactions
FOR EACH ROW
WHEN (NEW.bill_number IS NULL)
EXECUTE FUNCTION generate_bill_number();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (Optional - for multi-tenant)
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (change in production)
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON transaction_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
