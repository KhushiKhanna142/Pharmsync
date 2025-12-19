import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Printer, Download, AlertCircle, TrendingDown, CreditCard, ShoppingCart, User, Phone } from 'lucide-react';
import { productSearch, Product } from '../lib/product-search';
import { storage } from '../lib/storage';
import { PaymentGateway } from '../lib/payment-gateway';
import { SMSService } from '../lib/sms-service';

interface CartItem extends Product {
    quantity: number;
}

export const PharmacyBilling = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [discount, setDiscount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
    const [lowStockAlert, setLowStockAlert] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Initialize
    useEffect(() => {
        productSearch.init();
        storage.init();
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        // Fetch initial "browse" list (empty query)
        const results = await productSearch.search('');
        setProducts(results);
        setLoading(false);
    };

    // Check for low stock items
    useEffect(() => {
        const lowStock = cart.filter(item => item.stock_quantity < 10);
        setLowStockAlert(lowStock);
    }, [cart]);

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const discountAmount = (subtotal * discount) / 100;
    // GST 12% included in MRP for display derivation
    const gstAmount = (subtotal - discountAmount) * 0.12;
    const total = subtotal - discountAmount;

    // Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchTerm.length === 0) {
                loadInitialData();
                return;
            }

            setLoading(true);
            const results = await productSearch.search(searchTerm);
            setProducts(results);
            setLoading(false);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = (query: string) => {
        setSearchTerm(query);
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                alert(`Only ${product.stock_quantity} units available`);
                return;
            }
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setSearchTerm('');
        setProducts([]);
    };

    const updateQuantity = (id: string, newQty: number) => {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        if (newQty > item.stock_quantity) {
            alert(`Only ${item.stock_quantity} units available`);
            return;
        }
        if (newQty <= 0) { removeFromCart(id); return; }
        setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    };

    const updatePackSize = (id: string, newPackSize: number) => {
        if (newPackSize < 1) return;
        setCart(cart.map(item => {
            if (item.id === id) {
                // Determine base price to recalculate from
                // If we have cost_price (from DB), use it.
                // If not, we have to rely on current mrp * current pack_size to reverse engineer? 
                // No, product-search.ts ensures cost_price is passed if available.
                // If mocked, we can't really do accurate math, so we skip.

                let newUnitMrp = item.mrp;
                if (item.cost_price) {
                    newUnitMrp = item.cost_price / newPackSize;
                }

                return {
                    ...item,
                    pack_size: newPackSize,
                    mrp: parseFloat(newUnitMrp.toFixed(2))
                };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

    const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setPrescriptionFile(e.target.files[0]);
    };

    // UPI QR PAYMENT HANDLER
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeData, setQrCodeData] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Import this properly at the top
    // import { generatePaymentQR, verifyPayment } from '../lib/payment';

    const handleUPIPayment = async () => {
        if (!customerPhone || customerPhone.length !== 10) {
            alert('Please enter valid 10-digit phone number');
            return;
        }

        setProcessingPayment(true);
        const billNo = `PHM${Date.now()}`;

        try {
            // Generate QR
            const qrUrl = await import('../lib/payment').then(mod => mod.generatePaymentQR({
                amount: total,
                transactionNote: `Bill ${billNo}`,
                transactionRef: billNo
            }));

            setQrCodeData(qrUrl);
            setShowQRCode(true);
            setProcessingPayment(false);

            // Simulation: In real world, we would poll an API here
        } catch (err) {
            console.error(err);
            alert('Failed to generate QR Code');
            setProcessingPayment(false);
        }
    };

    const confirmPayment = async () => {
        // Operator manually confirms payment received on phone
        const billNo = `PHM${Date.now()}`;
        const txn = {
            id: `TXN${Date.now()}`,
            bill_number: billNo,
            customer_phone: customerPhone,
            customer_name: customerName,
            items: cart,
            subtotal,
            discount,
            gst_amount: gstAmount,
            total_amount: total,
            payment_method: 'UPI_QR',
            date: new Date().toISOString(),
            payment_status: 'COMPLETED',
            upi_transaction_id: `UPI${Date.now()}`
        };

        storage.saveTransaction(txn);

        // Send SMS
        await SMSService.sendReceipt(customerPhone, {
            billNumber: txn.bill_number,
            customerName: customerName,
            items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.mrp })),
            total: total,
            paymentMethod: 'UPI QR',
            date: new Date().toLocaleDateString()
        });

        setShowQRCode(false);
        setPaymentSuccess(true);

        // Reset Cart after short delay
        setTimeout(() => {
            setPaymentSuccess(false);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setDiscount(0);
        }, 3000);
    };

    const handleCashPayment = async () => {
        if (!customerPhone || customerPhone.length !== 10) {
            alert('Please enter valid 10-digit phone number');
            return;
        }

        if (!window.confirm(`Confirm CASH payment of ₹${total.toFixed(2)}?`)) return;

        setProcessingPayment(true);
        const billNo = `PHM${Date.now()}`;

        const txn = {
            id: `TXN${Date.now()}`,
            bill_number: billNo,
            customer_phone: customerPhone,
            customer_name: customerName,
            items: cart,
            subtotal,
            discount,
            gst_amount: gstAmount,
            total_amount: total,
            payment_method: 'CASH',
            date: new Date().toISOString(),
            payment_status: 'COMPLETED',
            upi_transaction_id: 'N/A'
        };

        storage.saveTransaction(txn);

        await SMSService.sendReceipt(customerPhone, {
            billNumber: txn.bill_number,
            customerName: customerName,
            items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.mrp })),
            total: total,
            paymentMethod: 'CASH',
            date: new Date().toLocaleDateString()
        });

        setProcessingPayment(false);
        setPaymentSuccess(true);

        setTimeout(() => {
            setPaymentSuccess(false);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setDiscount(0);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 shadow-lg mb-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">MedPlus Pharmacy</h1>
                        <p className="text-blue-100 opacity-90">Professional Billing System v2.0</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <Link to="/stock-entry" className="inline-block mb-2 px-4 py-1 bg-white/10 hover:bg-white/20 rounded text-sm font-medium transition-colors border border-white/20">
                            Manage Stock
                        </Link>
                        <div className="font-medium text-lg">{new Date().toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 justify-end text-sm">
                            <span className="bg-green-500/20 text-green-100 px-2 py-0.5 rounded border border-green-500/50 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                Supabase Live
                            </span>
                            <span className="text-blue-200">Operator: Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                                <User className="w-5 h-5 text-blue-600" /> Customer Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Phone Number (Required)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Customer Name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Product Search */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[400px]">
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            {/* Results */}
                            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                                {products.map(product => (
                                    <div key={product.id} onClick={() => addToCart(product)} className="flex justify-between p-4 border rounded-lg hover:bg-blue-50 cursor-pointer">
                                        <div>
                                            <div className="font-semibold">{product.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Batch: {product.batch_id || 'N/A'} | Exp: {product.expiry_date || 'N/A'} | Stock: {product.stock_quantity}
                                            </div>
                                        </div>
                                        <div className="font-bold">₹{product.mrp}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cart */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-blue-600" /> Cart ({cart.length})
                            </h2>
                            {cart.length === 0 ? <p className="text-gray-400 text-center py-4">Cart is empty</p> : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-lg text-blue-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500 mb-2">
                                                        Batch: {item.batch_id || 'N/A'} | Exp: {item.expiry_date || 'N/A'}
                                                    </div>

                                                    {/* Pack Size / Unit Config */}
                                                    <div className="flex gap-4 items-center mt-2 bg-white p-2 rounded border w-fit">
                                                        <div>
                                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Pack Size</label>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-400">1 /</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.pack_size}
                                                                    onChange={(e) => updatePackSize(item.id, parseInt(e.target.value) || 1)}
                                                                    className="w-12 text-sm border-b-2 border-blue-200 focus:border-blue-500 outline-none text-center font-bold"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
                                                        <div>
                                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Unit Price</label>
                                                            <div className="font-bold text-gray-800">₹{item.mrp.toFixed(2)}</div>
                                                        </div>
                                                        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
                                                        <div>
                                                            <label className="block text-[10px] uppercase text-gray-500 font-bold">Cost (Pack)</label>
                                                            {item.cost_price ? <div className="text-sm">₹{item.cost_price}</div> : <div className="text-xs text-gray-400 italic">Mock</div>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pl-1">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100">-</button>
                                                    <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700">+</button>
                                                    <span className="text-sm text-gray-500 ml-1">Units</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Total</div>
                                                    <div className="text-xl font-bold text-gray-800">₹{(item.mrp * item.quantity).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg sticky top-6">
                            <h2 className="text-xl font-bold mb-6 pb-4 border-b">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>

                                {/* Discount Input */}
                                <div className="flex gap-2 items-center">
                                    <span className="text-gray-600 text-sm">Disc %</span>
                                    <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                                </div>

                                <div className="flex justify-between text-gray-600"><span>GST (Included)</span><span>₹{gstAmount.toFixed(2)}</span></div>
                                <div className="border-t pt-4 flex justify-between items-baseline">
                                    <span className="text-lg font-semibold">Total Payable</span>
                                    <span className="text-3xl font-bold text-blue-700">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCashPayment}
                                    disabled={cart.length === 0 || !customerPhone || processingPayment}
                                    className="bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 shadow-md flex justify-center items-center gap-2"
                                >
                                    💵 Cash
                                </button>
                                <button
                                    onClick={handleUPIPayment}
                                    disabled={cart.length === 0 || !customerPhone || processingPayment}
                                    className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 shadow-md flex justify-center items-center gap-2"
                                >
                                    📱 UPI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UPI QR Modal */}
            {showQRCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold mb-2">Scan to Pay</h3>
                        <p className="text-gray-500 mb-6">Ask customer to scan with any UPI App</p>

                        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner inline-block mb-6">
                            <img src={qrCodeData} alt="UPI QR" className="w-64 h-64" />
                        </div>

                        <div className="text-3xl font-bold text-blue-800 mb-8">₹{total.toFixed(2)}</div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowQRCode(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPayment}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
                            >
                                Received Cash/UPI
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Overlay */}
            {paymentSuccess && (
                <div className="fixed inset-0 bg-green-600/90 flex items-center justify-center z-50 text-white">
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-white text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-green-100 text-xl">Receipt Sent via SMS</p>
                    </div>
                </div>
            )}
        </div>
    );
}
