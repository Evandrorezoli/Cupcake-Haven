import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Heart } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, profile, login, logout } = useAuth();
  const { items } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Cupcake Haven" 
              className="w-9 h-9 object-contain rounded-xl shadow-xs" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-2xl font-serif font-bold text-primary">Cupcake Haven</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/catalog" className="text-sm font-medium hover:text-primary transition-colors">Catálogo</Link>
            <Link to="/customize" className="text-sm font-medium hover:text-primary transition-colors">Personalizar</Link>
            <Link to="/reviews" className="text-sm font-medium hover:text-primary transition-colors">Avaliações</Link>
            <Link to="/favorites" className="text-sm font-medium hover:text-primary transition-colors flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>Favoritos</span>
            </Link>
            {(profile?.role === 'admin' || user?.email === 'evandrorezoli@gmail.com') && (
              <Link to="/admin" className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-xs font-bold text-accent uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                Painel Admin
              </Link>
            )}
            
            <div className="flex items-center space-x-4 border-l pl-8 border-gray-200">
              <Link to="/cart" className="relative group">
                <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <LogOut className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={login}
                  className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             <Link to="/cart" className="relative group">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link to="/catalog" onClick={() => setIsOpen(false)} className="block text-lg font-serif">Catálogo</Link>
              <Link to="/customize" onClick={() => setIsOpen(false)} className="block text-lg font-serif">Personalizar</Link>
              <Link to="/reviews" onClick={() => setIsOpen(false)} className="block text-lg font-serif">Avaliações & Avisos</Link>
              <Link to="/favorites" onClick={() => setIsOpen(false)} className="block text-lg font-serif text-red-500">Meus Favoritos</Link>
              {(profile?.role === 'admin' || user?.email === 'evandrorezoli@gmail.com') && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block p-4 bg-accent/5 border border-accent/10 rounded-2xl text-lg font-serif text-accent flex items-center justify-between">
                  <span>Painel Admin</span>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                </Link>
              )}
              <hr />
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-lg font-serif">Meu Perfil</Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="block text-lg font-serif text-red-500">Sair</button>
                </>
              ) : (
                <button onClick={() => { login(); setIsOpen(false); }} className="w-full bg-primary text-white py-3 rounded-xl font-medium">Entrar com Google</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
