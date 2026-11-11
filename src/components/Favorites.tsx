import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import { Heart, ShoppingCart, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { user, login } = useAuth();
  const { addItem } = useCart();
  const [catalogFavorites, setCatalogFavorites] = useState<any[]>([]);
  const [customFavorites, setCustomFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCatalogFavorites([]);
      setCustomFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Catalog items favorited
    const pathCatalog = `favorites/${user.uid}/items`;
    const unsubCatalog = onSnapshot(collection(db, pathCatalog), (snapshot) => {
      const favs = snapshot.docs.map(d => ({ id: d.id, ...d.data(), type: 'catalog' }));
      setCatalogFavorites(favs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathCatalog);
      setLoading(false);
    });

    // 2. Custom cupcake configurations
    const qCustom = query(
      collection(db, 'favorite_customizations'),
      where('userId', '==', user.uid)
    );
    const unsubCustom = onSnapshot(qCustom, (snapshot) => {
      const customs = snapshot.docs.map(d => ({ id: d.id, ...d.data(), type: 'custom' }));
      setCustomFavorites(customs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'favorite_customizations');
      setLoading(false);
    });

    return () => {
      unsubCatalog();
      unsubCustom();
    };
  }, [user]);

  const handleDelete = async (item: any) => {
    if (!user) return;
    try {
      if (item.type === 'custom') {
        await deleteDoc(doc(db, 'favorite_customizations', item.id));
      } else {
        await deleteDoc(doc(db, `favorites/${user.uid}/items`, item.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, item.id);
    }
  };

  const handleAddToCart = (item: any) => {
    if (item.type === 'custom') {
      addItem({
        id: `custom-${Date.now()}`,
        name: item.name || 'Cupcake Personalizado',
        price: item.price || 8.50,
        quantity: 1,
        imageUrl: item.imageUrl || '/red_velvet.jpg',
        isCustom: true,
        details: item.details
      });
    } else {
      addItem({ ...item, quantity: 1 });
    }
  };

  const allFavorites = [...customFavorites, ...catalogFavorites];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md mx-auto bg-white p-12 rounded-[50px] shadow-sm border border-gray-100">
          <Heart className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">Seus Favoritos</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Faça login para salvar suas receitas e cupcakes prediletos e pedir novamente com 1 clique!
          </p>
          <button 
            onClick={login}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center text-gray-400 italic">
        Buscando seus doces favoritos...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <header className="mb-12">
        <div className="flex items-center space-x-2 text-primary mb-2">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Sua Coleção Pessoal</span>
        </div>
        <h1 className="text-5xl font-serif font-bold text-gray-900">Meus Favoritos</h1>
        <p className="text-gray-500 italic mt-2">Seus cupcakes prediletos salvos para pedir quando bater a vontade.</p>
      </header>

      {allFavorites.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-[60px] border-2 border-dashed border-gray-200">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Nenhum favorito salvo ainda</h2>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto italic">
            Navegue pelo nosso catálogo e clique no coração para guardar seus sabores favoritos aqui.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/catalog" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all">
              Explorar Catálogo
            </Link>
            <Link to="/customize" className="bg-white border-2 border-primary text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary/5 transition-all">
              Personalizar Cupcake
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence>
            {allFavorites.map((fav) => {
              const imageSrc = fav.imageUrl?.includes('1614707267537') ? '/red_velvet.jpg' : (fav.imageUrl || '/red_velvet.jpg');
              return (
                <motion.div 
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
                    <img 
                      src={imageSrc} 
                      alt={fav.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/red_velvet.jpg';
                      }}
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <button 
                        onClick={() => handleDelete(fav)}
                        title="Remover dos favoritos"
                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 shadow-md hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {fav.type === 'custom' && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-accent text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-md">
                          Personalizado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight">
                        {fav.name}
                      </h3>
                      {fav.type === 'custom' && fav.details ? (
                        <p className="text-xs text-accent italic mt-1">
                          {fav.details.baseFlavor} + {fav.details.frosting} ({fav.details.topping})
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                          {fav.category || 'Clássico'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-xl font-serif font-bold text-primary">
                        R$ {Number(fav.price || 8.50).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleAddToCart(fav)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-2xl font-bold text-xs flex items-center space-x-1.5 hover:bg-primary hover:text-white transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Pedir De Novo</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
