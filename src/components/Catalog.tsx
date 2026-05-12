import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../lib/CartContext';
import { Plus, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function Catalog() {
  const [products, setProducts] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Nossa Coleção</h2>
          <p className="text-gray-600 max-w-md">Descubra sabores irresistíveis criados com amor e precisão artesanal.</p>
        </div>
        <div className="flex gap-2">
            {['Todos', 'Clássicos', 'Sazonais', 'Veganos'].map((cat) => (
                <button 
                  key={cat} 
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm hover:border-primary hover:text-primary transition-all"
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gray-100 mb-4 cursor-pointer">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => addItem({ ...product, quantity: 1 })}
                className="absolute bottom-4 right-4 bg-white p-3 rounded-2xl shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-start px-1">
              <div>
                <h3 className="font-serif text-xl font-bold mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 uppercase tracking-widest">{product.category}</p>
              </div>
              <p className="font-medium text-lg text-primary">R$ {product.price.toFixed(2)}</p>
            </div>
          </motion.div>
        ))}

        {products.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum cupcake disponível no momento.</p>
                <p className="text-sm text-gray-400 mt-1">Que tal tentar personalizar o seu próprio?</p>
            </div>
        )}
      </div>
    </div>
  );
}
