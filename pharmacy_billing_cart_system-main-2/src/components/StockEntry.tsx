import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, ArrowLeft, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { productSearch, Product } from '../lib/product-search';

export const StockEntry = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [addQuantity, setAddQuantity] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Debounced Search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchTerm.length === 0) {
                setProducts([]);
                return;
            }
            setLoading(true);
            const results = await productSearch.search(searchTerm);
            setProducts(results);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSelect = (product: Product) => {
        setSelectedProduct(product);
        setAddQuantity('');
        setMessage(null);
        setProducts([]);
        setSearchTerm('');
    };

    const handleUpdateStock = async () => {
        if (!selectedProduct || !addQuantity || Number(addQuantity) <= 0) return;

        setLoading(true);
        try {
            // 1. Get latest quantity to be safe (optional but good practice)
            const { data: currentItem, error: fetchError } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('id', selectedProduct.id)
                .single();

            if (fetchError) throw fetchError;

            const newTotal = (currentItem.quantity || 0) + Number(addQuantity);

            // 2. Update
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: newTotal })
                .eq('id', selectedProduct.id);

            if (updateError) throw updateError;

            setMessage({ type: 'success', text: `Successfully added ${addQuantity} units. New Total: ${newTotal}` });
            setSelectedProduct(null);
            setAddQuantity('');

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update stock: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white p-6 shadow-lg mb-8">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Stock Entry</h1>
                            <p className="text-emerald-100 opacity-90">Inventory Management</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

                    {/* Search Section */}
                    {!selectedProduct ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-emerald-600" /> Search Product to Add Stock
                            </h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Type medicine name (e.g. Dolo)..."
                                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-emerald-500"
                                    autoFocus
                                />
                                {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">Loading...</div>}
                            </div>

                            {/* Results */}
                            {products.length > 0 && (
                                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {products.map(p => (
                                        <div key={p.id} className="p-4 hover:bg-emerald-50 flex justify-between items-center cursor-pointer" onClick={() => handleSelect(p)}>
                                            <div>
                                                <div className="font-bold text-gray-800">{p.name}</div>
                                                <div className="text-sm text-gray-500">Current Stock: {p.stock_quantity} | Batch: {p.batch_id}</div>
                                            </div>
                                            <button className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium">Select</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-200">
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                                    <p className="text-gray-500">Current Stock: <span className="font-bold text-gray-800">{selectedProduct.stock_quantity}</span></p>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">Change Product</button>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Quantity to Add</label>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        value={addQuantity}
                                        onChange={(e) => setAddQuantity(Number(e.target.value))}
                                        placeholder="Enter volume"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-xl focus:ring-2 focus:ring-emerald-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUpdateStock}
                                        disabled={loading || !addQuantity || Number(addQuantity) <= 0}
                                        className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? 'Updating...' : <><Plus className="w-5 h-5" /> Add Stock</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message Notification */}
                    {message && (
                        <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.type === 'success' ? <Package className="w-5 h-5" /> : <div className="w-5 h-5 font-bold">!</div>}
                            {message.text}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
