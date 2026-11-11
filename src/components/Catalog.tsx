import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { Plus, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { user, login } = useAuth();

  useEffect(() => {
    const path = 'products';
    const q = query(collection(db, path), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => {
        const item = { id: docSnap.id, ...docSnap.data() } as any;
        // Auto-fix broken unsplash link for Red Velvet Lux
        if (item.imageUrl?.includes('1614707267537') || (item.name?.toLowerCase().includes('red velvet') && (!item.imageUrl || item.imageUrl.includes('photo-1614707267537')))) {
          item.imageUrl = '/red_velvet.jpg';
        }
        return item;
      });
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to user favorites in real-time
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    const path = `favorites/${user.uid}/items`;
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const favIds = new Set(snapshot.docs.map(d => d.id));
      setFavorites(favIds);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [user]);

  const toggleFavorite = async (product: any) => {
    if (!user) {
      const proceed = window.confirm('Faça login para salvar seus cupcakes favoritos! Deseja entrar agora?');
      if (proceed) {
        await login();
      }
      return;
    }

    const path = `favorites/${user.uid}/items/${product.id}`;
    try {
      if (favorites.has(product.id)) {
        await deleteDoc(doc(db, `favorites/${user.uid}/items`, product.id));
      } else {
        const productData = {
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl?.includes('1614707267537') ? '/red_velvet.jpg' : (product.imageUrl || '/red_velvet.jpg'),
          category: product.category || 'Clássicos',
          addedAt: new Date().toISOString()
        };
        await setDoc(doc(db, `favorites/${user.uid}/items`, product.id), productData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    const defaultProducts = [
      { 
        name: 'Red Velvet Lux', 
        price: 12.90, 
        imageUrl: '/red_velvet.jpg', 
        category: 'Clássicos', 
        active: true, 
        stock: 100,
        description: 'Massa aveludada de cacau com um leve toque de baunilha e cobertura cremosa de cream cheese.'
      },
      { 
        name: 'Limão Siciliano', 
        price: 11.50, 
        imageUrl: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&q=80&w=400', 
        category: 'Sazonais', 
        active: true, 
        stock: 50,
        description: 'Refrescante massa de limão siciliano com topo de merengue maçaricado.'
      },
      { 
        name: 'Chocolate Intenso 70%', 
        price: 13.50, 
        imageUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=400', 
        category: 'Clássicos', 
        active: true, 
        stock: 80,
        description: 'Massa de cacau black com ganache de chocolate 70% e confeitos belgas.'
      },
      { 
        name: 'Blueberry Zen (Vegano)', 
        price: 14.00, 
        imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=400', 
        category: 'Veganos', 
        active: true, 
        stock: 30,
        description: 'Opção 100% vegana com mirtilos frescos e cobertura suave de coco.'
      }
    ];

    try {
      const { addDoc } = await import('firebase/firestore');
      for (const p of defaultProducts) {
        await addDoc(collection(db, 'products'), p);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-accent mb-2 block">Cardápio Fresco</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Nossa Coleção</h2>
          <p className="text-gray-600 max-w-md">Descubra sabores irresistíveis criados com amor e precisão artesanal.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['Todos', 'Clássicos', 'Sazonais', 'Veganos'].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center italic text-gray-400">Carregando cardápio...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => {
            const isFav = favorites.has(product.id);
            const imageSrc = product.imageUrl?.includes('1614707267537') 
              ? '/red_velvet.jpg' 
              : (product.imageUrl || '/red_velvet.jpg');

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-[36px] p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-gray-100 mb-4 cursor-pointer">
                  <img 
                    src={imageSrc} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/red_velvet.jpg';
                    }}
                  />

                  {/* Favorite Heart Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product);
                      }}
                      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      className={`p-3 rounded-2xl shadow-md transition-all transform active:scale-90 ${
                        isFav 
                          ? 'bg-red-500 text-white shadow-red-500/30' 
                          : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Add to Cart Quick Button */}
                  <button 
                    type="button"
                    onClick={() => addItem({ ...product, quantity: 1, imageUrl: imageSrc })}
                    title="Adicionar ao carrinho"
                    className="absolute bottom-3 right-3 bg-white p-3 rounded-2xl shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-2 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-gray-900 leading-snug">{product.name}</h3>
                      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <p className="font-serif font-bold text-xl text-primary">R$ {Number(product.price).toFixed(2)}</p>
                    <button
                      type="button"
                      onClick={() => addItem({ ...product, quantity: 1, imageUrl: imageSrc })}
                      className="text-xs font-bold text-primary hover:text-primary/70 transition-colors uppercase tracking-wider"
                    >
                      + Pedir
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cupcake encontrado nesta categoria.</p>
              {products.length === 0 && (
                <button 
                  onClick={handleSeed}
                  className="mt-4 px-6 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  Carregar Produtos Demo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
