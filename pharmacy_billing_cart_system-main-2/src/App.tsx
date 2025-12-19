import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PharmacyBilling } from './components/PharmacyBilling';
import { StockEntry } from './components/StockEntry';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<PharmacyBilling />} />
                <Route path="/stock-entry" element={<StockEntry />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
