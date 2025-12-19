
"""
Pharmacy Synthetic Data Generator
Generates 50,000+ realistic pharmacy products for local JSON storage
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
import string
import sys

# Ensure data directory exists
OUTPUT_DIR = Path("data")
TOTAL_PRODUCTS = 50000

# ============================================================================
# MEDICINE DATA TEMPLATES
# ============================================================================

MEDICINES = {
    'FEVER': [
        ('Paracetamol', ['500mg', '650mg', '1000mg'], 10, 80),
        ('Dolo', ['500mg', '650mg'], 25, 65),
        ('Crocin', ['500mg', '650mg'], 20, 60),
        ('Calpol', ['250mg', '500mg'], 15, 50),
        ('Tylenol', ['500mg', '650mg'], 30, 85),
    ],
    'ANTIBIOTIC': [
        ('Amoxicillin', ['250mg', '500mg'], 50, 250),
        ('Azithromycin', ['250mg', '500mg'], 80, 280),
        ('Ciprofloxacin', ['250mg', '500mg', '750mg'], 60, 220),
        ('Augmentin', ['375mg', '625mg'], 90, 300),
        ('Cefixime', ['100mg', '200mg'], 70, 240),
    ],
    'PAIN_RELIEF': [
        ('Ibuprofen', ['200mg', '400mg', '600mg'], 15, 100),
        ('Diclofenac', ['50mg', '100mg'], 20, 90),
        ('Combiflam', ['400mg'], 25, 75),
        ('Brufen', ['400mg', '600mg'], 30, 95),
        ('Voveran', ['50mg', '100mg'], 35, 110),
    ],
    'COLD_COUGH': [
        ('Cetirizine', ['5mg', '10mg'], 20, 70),
        ('Sinarest', ['Tab'], 25, 65),
        ('Vicks Vaporub', ['25ml', '50ml', '100ml'], 40, 150),
        ('Benadryl Cough Syrup', ['100ml', '150ml'], 80, 200),
        ('Alex Cough Syrup', ['100ml'], 70, 180),
    ],
    'DIGESTIVE': [
        ('Omeprazole', ['20mg', '40mg'], 15, 80),
        ('Pan-D', ['40mg'], 45, 120),
        ('Eno', ['5g sachet', '100g bottle'], 5, 150),
        ('Digene', ['Tab', 'Gel'], 10, 90),
        ('Pantoprazole', ['40mg'], 25, 95),
    ],
    'DIABETES': [
        ('Metformin', ['500mg', '850mg', '1000mg'], 30, 180),
        ('Glimepiride', ['1mg', '2mg', '4mg'], 40, 200),
        ('Insulin Lantus', ['10ml vial'], 800, 1500),
        ('Glucometer Strips', ['25 strips', '50 strips'], 400, 900),
    ],
    'BP_HEART': [
        ('Amlodipine', ['5mg', '10mg'], 20, 90),
        ('Atenolol', ['25mg', '50mg'], 15, 75),
        ('Telmisartan', ['40mg', '80mg'], 50, 180),
        ('Aspirin', ['75mg', '150mg'], 5, 45),
    ],
    'VITAMINS': [
        ('Becosules', ['Tab', 'Cap'], 25, 80),
        ('Vitamin D3', ['1000IU', '2000IU', '60000IU'], 30, 250),
        ('Calcium Tablets', ['500mg'], 40, 150),
        ('Vitamin C', ['500mg', '1000mg'], 20, 100),
    ],
    'SKIN': [
        ('Betnovate Cream', ['15g', '30g'], 50, 180),
        ('Clotrimazole Cream', ['15g', '30g'], 30, 120),
        ('Candid Powder', ['50g', '100g'], 60, 200),
    ]
}

OTC_ITEMS = {
    'MEDICAL_DEVICES': [
        ('Digital Thermometer', ['1 piece'], 100, 400),
        ('BP Monitor', ['1 piece'], 600, 2500),
        ('Glucometer', ['1 piece'], 500, 1800),
        ('Pulse Oximeter', ['1 piece'], 400, 1500),
        ('Nebulizer', ['1 piece'], 1200, 3000),
        ('Weighing Scale Digital', ['1 piece'], 400, 1200),
    ],
    'FIRST_AID': [
        ('Cotton Wool', ['50g', '100g', '200g'], 20, 90),
        ('Bandage Elastic', ['1 roll', '3 rolls'], 15, 80),
        ('Gauze', ['10 pieces'], 25, 100),
        ('Dettol Antiseptic', ['100ml', '250ml', '500ml'], 50, 200),
        ('Band-Aid', ['10 strips', '20 strips'], 30, 120),
        ('Surgical Gloves', ['1 pair', '50 pairs'], 10, 400),
        ('Face Mask', ['10 pieces', '50 pieces'], 40, 350),
    ],
    'HEALTH_SUPPLEMENTS': [
        ('Protein Powder', ['250g', '500g', '1kg'], 400, 2000),
        ('Omega-3 Capsules', ['30 caps', '60 caps'], 200, 800),
        ('Multivitamin', ['30 tabs', '60 tabs'], 150, 600),
    ],
    'SURGICAL_ITEMS': [
        ('Syringe 5ml', ['1 piece', '10 pieces'], 5, 100),
        ('IV Set', ['1 piece'], 25, 80),
        ('Catheter', ['1 piece'], 50, 200),
    ]
}

PERSONAL_CARE = {
    'SANITARY_PADS': [
        ('Whisper Ultra Clean', ['7 pads', '15 pads', '30 pads'], 40, 250),
        ('Stayfree Secure', ['7 pads', '10 pads', '20 pads'], 45, 220),
        ('Sofy Antibacteria', ['10 pads', '20 pads'], 50, 240),
    ],
    'DIAPERS': [
        ('Pampers', ['S 20pc', 'M 30pc', 'L 40pc', 'XL 50pc'], 200, 1200),
        ('Huggies', ['S 20pc', 'M 30pc', 'L 40pc'], 220, 1300),
        ('MamyPoko Pants', ['M 30pc', 'L 40pc'], 250, 1400),
    ],
    'SOAPS_HYGIENE': [
        ('Dettol Soap', ['75g', '125g'], 30, 90),
        ('Dove Soap', ['75g', '100g'], 40, 110),
        ('Lifebuoy Soap', ['75g', '125g'], 25, 80),
        ('Savlon Handwash', ['200ml', '500ml'], 45, 180),
    ],
    'SKIN_CARE': [
        ('Nivea Body Lotion', ['200ml', '400ml'], 100, 350),
        ('Vaseline Petroleum Jelly', ['50ml', '100ml'], 40, 150),
        ('Ponds Cold Cream', ['50ml', '100ml'], 60, 200),
    ]
}

BABY_PRODUCTS = {
    'BABY_FOOD': [
        ('Cerelac Wheat', ['300g', '500g'], 150, 400),
        ('Farex Baby Food', ['300g'], 180, 420),
        ('Lactogen', ['400g', '1kg'], 350, 1200),
    ],
    'BABY_CARE': [
        ('Johnson Baby Powder', ['100g', '200g', '400g'], 80, 300),
        ('Johnson Baby Oil', ['100ml', '200ml'], 100, 280),
        ('Johnson Baby Shampoo', ['200ml', '500ml'], 120, 350),
    ],
    'FEEDING': [
        ('Baby Bottle', ['125ml', '250ml'], 100, 400),
        ('Bottle Nipple', ['1 piece', '2 pieces'], 30, 120),
        ('Bottle Sterilizer', ['1 piece'], 500, 1500),
    ]
}

MANUFACTURERS = {
    'MEDICINE': ['Cipla', 'Sun Pharma', 'Dr Reddy', 'Lupin', 'Micro Labs', 'Ranbaxy', 'Abbott', 'GSK', 'Cadila', 'Alkem'],
    'OTC': ['Omron', 'Dr Trust', '3M', 'Romsons', 'Accu-Chek', 'Beurer'],
    'PERSONAL_CARE': ['P&G', 'HUL', 'J&J', 'Kimberly Clark', 'Reckitt', 'Beiersdorf'],
    'BABY': ['Nestle', 'J&J', 'Philips Avent', 'Chicco']
}

# ============================================================================
# GENERATOR FUNCTIONS
# ============================================================================

def generate_barcode() -> str:
    """Generate unique Indian barcode (EAN-13)"""
    return f"890{random.randint(1000000000, 9999999999)}"

def generate_product_id(index: int) -> str:
    """Generate unique product ID"""
    return f"PROD_{str(index).zfill(6)}"

def generate_expiry_date() -> str:
    """Generate expiry 6 months to 3 years from now"""
    days = random.randint(180, 1095)
    return (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')

def generate_medicines(start_id: int, count: int) -> List[Dict]:
    """Generate medicine products"""
    products = []
    subcategories = list(MEDICINES.keys())
    
    for i in range(count):
        subcat = random.choice(subcategories)
        medicine_data = random.choice(MEDICINES[subcat])
        name_base, dosages, min_price, max_price = medicine_data
        
        dosage = random.choice(dosages)
        pack_size = random.choice(['10 tablets', '15 tablets', '20 tablets', '30 tablets', '100ml syrup', '150ml syrup'])
        
        # Adjust price based on pack size
        mrp = round(random.uniform(min_price, max_price), 2)
        if 'syrup' in pack_size.lower():
            mrp = round(mrp * 1.5, 2)
        
        cost_price = round(mrp * random.uniform(0.65, 0.80), 2)
        
        products.append({
            'id': generate_product_id(start_id + i),
            'barcode': generate_barcode(),
            'name': f"{name_base} {dosage}",
            'generic_name': name_base,
            'category': 'MEDICINE',
            'subcategory': subcat,
            'manufacturer': random.choice(MANUFACTURERS['MEDICINE']),
            'pack_size': pack_size,
            'dosage': dosage,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(0, 500),
            'prescription_required': subcat in ['ANTIBIOTIC', 'DIABETES', 'BP_HEART'],
            'gst_percentage': 12.0,
            'hsn_code': f"3004{random.randint(1000, 9999)}",
            'expiry_date': generate_expiry_date(),
            'description': f"Used for treating {subcat.lower().replace('_', ' ')}"
        })
    
    return products

def generate_otc_items(start_id: int, count: int) -> List[Dict]:
    """Generate OTC items"""
    products = []
    subcategories = list(OTC_ITEMS.keys())
    
    for i in range(count):
        subcat = random.choice(subcategories)
        item_data = random.choice(OTC_ITEMS[subcat])
        name, pack_sizes, min_price, max_price = item_data
        
        pack_size = random.choice(pack_sizes)
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.70, 0.85), 2)
        
        products.append({
            'id': generate_product_id(start_id + i),
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'OTC',
            'subcategory': subcat,
            'manufacturer': random.choice(MANUFACTURERS['OTC']),
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(10, 300),
            'prescription_required': False,
            'gst_percentage': 18.0,
            'hsn_code': f"9018{random.randint(1000, 9999)}",
            'expiry_date': None,
            'description': f"Medical device for healthcare"
        })
    
    return products

def generate_personal_care(start_id: int, count: int) -> List[Dict]:
    """Generate personal care items"""
    products = []
    subcategories = list(PERSONAL_CARE.keys())
    
    for i in range(count):
        subcat = random.choice(subcategories)
        item_data = random.choice(PERSONAL_CARE[subcat])
        name, pack_sizes, min_price, max_price = item_data
        
        pack_size = random.choice(pack_sizes)
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.70, 0.85), 2)
        
        products.append({
            'id': generate_product_id(start_id + i),
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'PERSONAL_CARE',
            'subcategory': subcat,
            'manufacturer': random.choice(MANUFACTURERS['PERSONAL_CARE']),
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(30, 400),
            'prescription_required': False,
            'gst_percentage': 18.0,
            'hsn_code': f"3304{random.randint(1000, 9999)}",
            'expiry_date': None,
            'description': f"Personal care product"
        })
    
    return products

def generate_baby_products(start_id: int, count: int) -> List[Dict]:
    """Generate baby products"""
    products = []
    subcategories = list(BABY_PRODUCTS.keys())
    
    for i in range(count):
        subcat = random.choice(subcategories)
        item_data = random.choice(BABY_PRODUCTS[subcat])
        name, pack_sizes, min_price, max_price = item_data
        
        pack_size = random.choice(pack_sizes)
        mrp = round(random.uniform(min_price, max_price), 2)
        cost_price = round(mrp * random.uniform(0.70, 0.85), 2)
        
        products.append({
            'id': generate_product_id(start_id + i),
            'barcode': generate_barcode(),
            'name': name,
            'generic_name': None,
            'category': 'BABY_PRODUCTS',
            'subcategory': subcat,
            'manufacturer': random.choice(MANUFACTURERS['BABY']),
            'pack_size': pack_size,
            'dosage': None,
            'mrp': mrp,
            'cost_price': cost_price,
            'stock_quantity': random.randint(20, 250),
            'prescription_required': False,
            'gst_percentage': 12.0,
            'hsn_code': f"1901{random.randint(1000, 9999)}",
            'expiry_date': generate_expiry_date() if 'Food' in name or 'Lactogen' in name else None,
            'description': f"Baby care product"
        })
    
    return products

def generate_sample_transactions() -> List[Dict]:
    """Generate 100 sample past transactions"""
    transactions = []
    indian_names = ['Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Sneha Sharma', 'Vikram Reddy', 
                    'Anjali Verma', 'Rohan Joshi', 'Kavita Nair', 'Suresh Gupta', 'Meera Desai']
    
    for i in range(100):
        num_items = random.randint(2, 8)
        items = []
        subtotal = 0
        
        for _ in range(num_items):
            item_mrp = round(random.uniform(15, 500), 2)
            qty = random.randint(1, 3)
            line_total = item_mrp * qty
            subtotal += line_total
            
            items.append({
                'name': f"Product {random.randint(1, 1000)}",
                'quantity': qty,
                'price': item_mrp,
                'total': line_total
            })
        
        discount = round(subtotal * random.uniform(0, 0.1), 2)
        gst = round((subtotal - discount) * 0.12, 2)
        total = round(subtotal - discount + gst, 2)
        
        transactions.append({
            'id': f"TXN_{str(i+1).zfill(6)}",
            'bill_number': f"PHM{datetime.now().strftime('%Y%m%d')}{str(i+1).zfill(4)}",
            'customer_name': random.choice(indian_names),
            'customer_phone': f"98{random.randint(10000000, 99999999)}",
            'items': items,
            'subtotal': subtotal,
            'discount': discount,
            'gst_amount': gst,
            'total_amount': total,
            'payment_method': random.choice(['CASH', 'CASH', 'CASH', 'UPI', 'UPI']),
            'date': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        })
    
    return transactions

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("="*70)
    print("PHARMACY SYNTHETIC DATA GENERATOR")
    print("="*70)
    print(f"\nGenerating {TOTAL_PRODUCTS:,} products...")
    print()
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Generate products
    all_products = []
    
    print("📦 Generating Medicines (30,000)...")
    all_products.extend(generate_medicines(1, 30000))
    
    print("📦 Generating OTC Items (10,000)...")
    all_products.extend(generate_otc_items(30001, 10000))
    
    print("📦 Generating Personal Care (7,500)...")
    all_products.extend(generate_personal_care(40001, 7500))
    
    print("📦 Generating Baby Products (2,500)...")
    all_products.extend(generate_baby_products(47501, 2500))
    
    print(f"\n✅ Generated {len(all_products):,} products")
    
    # Save products.json
    print("\n💾 Saving products.json...")
    products_data = {
        'products': all_products,
        'metadata': {
            'total_products': len(all_products),
            'generated_at': datetime.now().isoformat(),
            'version': '1.0'
        }
    }
    
    with open(OUTPUT_DIR / 'products.json', 'w', encoding='utf-8') as f:
        json.dump(products_data, f, indent=2, ensure_ascii=False)
    
    
    # Generate sample transactions
    print("\n📊 Generating sample transactions (100)...")
    transactions = generate_sample_transactions()
    
    with open(OUTPUT_DIR / 'transactions.json', 'w', encoding='utf-8') as f:
        json.dump({'transactions': transactions}, f, indent=2, ensure_ascii=False)
    
    print("✅ Saved transactions.json")
    
    # Create search index (for fast lookup)
    print("\n🔍 Creating search index...")
    index = {
        'by_name': {},
        'by_barcode': {},
        'by_category': {}
    }
    
    for product in all_products:
        # Name index (lowercase for case-insensitive search)
        name_key = product['name'].lower()
        if name_key not in index['by_name']:
            index['by_name'][name_key] = []
        index['by_name'][name_key].append(product['id'])
        
        # Barcode index
        index['by_barcode'][product['barcode']] = product['id']
        
        # Category index
        cat_key = product['category']
        if cat_key not in index['by_category']:
            index['by_category'][cat_key] = []
        index['by_category'][cat_key].append(product['id'])
    
    with open(OUTPUT_DIR / 'search_index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=0) # Compact JSON
        
    print("✅ Created search_index.json")
    print(f"\n🎉 DATA GENERATION COMPLETE! Files saved in '{OUTPUT_DIR}' folder.")

if __name__ == "__main__":
    main()
