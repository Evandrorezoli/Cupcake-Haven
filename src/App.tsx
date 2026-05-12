/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalog from './components/Catalog';
import Customizer from './components/Customizer';
import AdminPanel from './components/AdminPanel';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import Profile from './components/Profile';
import Addresses from './components/Addresses';

function HomePage() {
  return (
    <>
      <Hero />
      <Catalog />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <main className="pt-16 pb-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/customize" element={<Customizer />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/addresses" element={<Addresses />} />
              </Routes>
            </main>
            
            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-2xl font-serif font-bold text-primary mb-4">Cupcake Haven</p>
                <p className="text-sm text-gray-400 lowercase italic">doce artesanal feito com amor.</p>
                <div className="mt-8 pt-8 border-t border-gray-50 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                  &copy; {new Date().getFullYear()} Cupcake Haven. Todos os direitos reservados.
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

