
"""
Pharmacy Product Data Generator
Generates 50,000+ realistic Indian pharmacy products for Supabase
"""

import random
import json
from datetime import datetime, timedelta
import os

# ============================================================================
# PRODUCT DATA TEMPLATES
# ============================================================================

MEDICINES = {
    'FEVER': [
        ('Paracetamol', ['500mg', '650mg'], ['Cipla', 'Sun Pharma', 'Dr Reddy'], False),
        ('Dolo', ['500mg', '650mg'], ['Micro Labs'], False),
        ('Crocin', ['500mg', '650mg'], ['GSK'], False),
        ('Calpol', ['250mg', '500mg'], ['GSK'], False),
    ],
    'ANTIBIOTIC': [
        ('Amoxicillin', ['250mg', '500mg'], ['Cipla', 'Ranbaxy'], True),
        ('Azithromycin', ['250mg', '500mg'], ['Sun Pharma', 'Cipla'], True),
        ('Ciprofloxacin', ['250mg', '500mg'], ['Ranbaxy', 'Cipla'], True),
    ],
    'PAIN': [
        ('Ibuprofen', ['200mg', '400mg'], ['Abbott', 'Cipla'], False),
        ('Diclofenac', ['50mg', '100mg'], ['Novartis', 'Sun Pharma'], False),
        ('Combiflam', ['400mg'], ['Sanofi'], False),
    ],
    'COLD': [
        ('Cetirizine', ['5mg', '10mg'], ['Cipla', 'Dr Reddy'], False),
        ('Sinarest', ['Tab'], ['Centaur'], False),
        ('Vicks Vaporub', ['25ml', '50ml'], ['P&G'], False),
    ],
    'DIGESTIVE': [
        ('Omeprazole', ['20mg', '40mg'], ['Cadila', 'Ranbaxy'], False),
        ('Eno', ['5g sachet', '100g bottle'], ['GSK'], False),
        ('Digene', ['Tab'], ['Abbott'], False),
    ]
}

OTC_ITEMS = [
    ('Thermometer Digital', '1 piece', 'Omron', 150, 300, 'MEDICAL_DEVICE'),
    ('BP Monitor', '1 piece', 'Dr Trust', 800, 2000, 'MEDICAL_DEVICE'),
    ('Bandage Elastic', '1 roll', '3M', 30, 80, 'FIRST_AID'),
    ('Cotton Wool', '100g', 'Romsons', 40, 90, 'FIRST_AID'),
    ('Glucometer', '1 piece', 'Accu-Chek', 600, 1500, 'MEDICAL_DEVICE'),
    ('Inhaler Spacer', '1 piece', 'Cipla', 200, 500, 'MEDICAL_DEVICE'),
]

PERSONAL_CARE = [
    ('Whisper Ultra', '7 pads', 'P&G', 60, 120, 'SANITARY_PADS'),
    ('Stayfree Secure', '10 pads', 'J&J', 80, 150, 'SANITARY_PADS'),
    ('Dettol Soap', '75g', 'Reckitt', 35, 60, 'SOAP'),
    ('Dove Soap', '100g', 'HUL', 50, 90, 'SOAP'),
    ('Ponds Cold Cream', '50ml', 'HUL', 80, 150, 'SKIN_CARE'),
    ('Nivea Body Lotion', '200ml', 'Beiersdorf', 150, 300, 'SKIN_CARE'),
]

BABY_PRODUCTS = [
    ('Pampers Diapers S', '20 pieces', 'P&G', 300, 600, 'DIAPERS'),
    ('Huggies Diapers M', '30 pieces', 'Kimberly Clark', 400, 800, 'DIAPERS'),
    ('Johnson Baby Powder', '200g', 'J&J', 120, 250, 'BABY_CARE'),
    ('Cerelac Wheat', '300g', 'Nestle', 180, 350, 'BABY_FOOD'),
    ('Farex Baby Food', '300g', 'Heinz', 200, 400, 'BABY_FOOD'),
]

# ============================================================================
# GENERATOR FUNCTIONS
# ============================================================================

def generate_barcode():
    """Generate realistic Indian barcode (EAN-13)"""
    return f"890{random.randint(1000000000, 9999999999)}"

def generate_expiry_date():
    """Generate expiry 1-3 years from now"""
    days = random.randint(365, 1095)
    return (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')

def generate_medicines(count=30000):
    """Generate medicine products"""
    products = []
    
    for _ in range(count):
        category = random.choice(list(MEDICINES.keys()))
        medicine_data = random.choice(MEDICINES[category])
        name, dosages, manufacturers, rx_required = medicine_data
        
        dosage = random.choice(dosages)
        manufacturer = random.choice(manufacturers)
        pack_size = random.choice(['10 tablets', '15 tablets', '20 tablets', '100ml syrup'])
        
        # Calculate MRP based on dosage strength
        base_price = random.randint(10, 100)
        if 'syrup' in pack_size:
            base_price *= 1.5
        
        mrp = round(base_price * random.uniform(1.0, 1.5), 2)
        cost_price = round(mrp * random.uniform(0.6, 0.8), 2)
        
        products.append({
            'barcode': generate_barcode(),
            'name': f"{name} {dosage}",
            'generic_name': name,
            'category': 'MEDICINE',
            'subcategory': category,
            'manufacturer': manufacturer,
            'pack_size': pack_size,
            'dosage': dosage,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(50, 500),
            'prescription_required': rx_required,
            'gst_percentage': 12.0,
            'expiry_date': generate_expiry_date()
        })
    
    return products

def generate_otc_items(count=10000):
    """Generate OTC items"""
    products = []
    
    for _ in range(count):
        item_template = random.choice(OTC_ITEMS)
        name, pack_size, manufacturer, min_price, max_price, subcat = item_template
        
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.65, 0.85), 2)
        
        products.append({
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'OTC',
            'subcategory': subcat,
            'manufacturer': manufacturer,
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(20, 200),
            'prescription_required': False,
            'gst_percentage': 18.0,
            'expiry_date': None
        })
    
    return products

def generate_personal_care(count=7500):
    """Generate personal care items"""
    products = []
    
    for _ in range(count):
        item_template = random.choice(PERSONAL_CARE)
        name, pack_size, manufacturer, min_price, max_price, subcat = item_template
        
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.70, 0.85), 2)
        
        products.append({
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'PERSONAL_CARE',
            'subcategory': subcat,
            'manufacturer': manufacturer,
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(50, 300),
            'prescription_required': False,
            'gst_percentage': 18.0,
            'expiry_date': None
        })
    
    return products

def generate_baby_products(count=2500):
    """Generate baby products"""
    products = []
    
    for _ in range(count):
        item_template = random.choice(BABY_PRODUCTS)
        name, pack_size, manufacturer, min_price, max_price, subcat = item_template
        
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.70, 0.85), 2)
        
        products.append({
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'BABY_PRODUCTS',
            'subcategory': subcat,
            'manufacturer': manufacturer,
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(30, 200),
            'prescription_required': False,
            'gst_percentage': 12.0,
            'expiry_date': generate_expiry_date() if 'Food' in name else None
        })
    
    return products

# ============================================================================
# SQL GENERATION
# ============================================================================

def generate_sql_insert(products, batch_size=1000):
    """Generate SQL INSERT statements"""
    sql_batches = []
    
    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        
        values = []
        for p in batch:
            # Handle potential None values safely
            generic_name = f"'{p['generic_name']}'" if p.get('generic_name') else 'NULL'
            dosage = f"'{p['dosage']}'" if p.get('dosage') else 'NULL'
            expiry_date = f"'{p['expiry_date']}'" if p.get('expiry_date') else 'NULL'
            
            # Escape single quotes in name
            name = p['name'].replace("'", "''")
            
            val = f"('{p['barcode']}', '{name}', {generic_name}, '{p['category']}', '{p['subcategory']}', '{p['manufacturer']}', '{p['pack_size']}', {dosage}, {p['mrp']}, {p['cost_price']}, {p['stock_quantity']}, {p['prescription_required']}, {p['gst_percentage']}, {expiry_date})"
            values.append(val)
        
        sql = "INSERT INTO products (barcode, name, generic_name, category, subcategory, manufacturer, pack_size, dosage, mrp, cost_price, stock_quantity, prescription_required, gst_percentage, expiry_date) VALUES\n" + ",\n".join(values) + ";"
        sql_batches.append(sql)
    
    return sql_batches

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("🔄 Generating 50,000+ pharmacy products...")
    
    all_products = []
    all_products.extend(generate_medicines(30000))
    all_products.extend(generate_otc_items(10000))
    all_products.extend(generate_personal_care(7500))
    all_products.extend(generate_baby_products(2500))
    
    print(f"✅ Generated {len(all_products)} products")
    
    print("🔄 Creating SQL file...")
    # Change: writing to supabase/seed.sql directly
    sql_batches = generate_sql_insert(all_products)
    
    # Ensure directory exists
    os.makedirs('supabase', exist_ok=True)
    
    with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
        f.write("-- ============================================================================\\n")
        f.write("-- PHARMACY PRODUCTS SEED DATA (50,000+ items)\\n")
        f.write("-- Generated: " + datetime.now().isoformat() + "\\n")
        f.write("-- ============================================================================\\n\\n")
        
        for batch in sql_batches:
            f.write(batch)
            f.write("\\n")
    
    print(f"✅ Created supabase/seed.sql with {len(sql_batches)} batches")
    
    # Also save as JSON for reference
    with open('products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products[:100], f, indent=2)  # First 100 for preview
    
    print("✅ Done! Files created:")
    print("   📄 supabase/seed.sql (for Supabase)")
    print("   📄 products.json (preview)")

if __name__ == "__main__":
    main()
