import { useState } from 'react';
import { FLAVORS, FROSTINGS, TOPPINGS } from '../constants';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { Check, Star, Heart } from 'lucide-react';

export default function Customizer() {
  const { addItem } = useCart();
  const { user, login } = useAuth();
  const [savingFav, setSavingFav] = useState(false);
  const [selections, setSelections] = useState({
    baseFlavor: FLAVORS[0],
    frosting: FROSTINGS[0],
    topping: TOPPINGS[0],
    quantity: 1
  });

  const basePrice = 8.50;
  const totalPrice = basePrice * selections.quantity;

  const handleAddToCart = () => {
    addItem({
      id: `custom-${Date.now()}`,
      name: `Cupcake Personalizado (${selections.baseFlavor.name})`,
      price: basePrice,
      quantity: selections.quantity,
      imageUrl: '/red_velvet.jpg',
      isCustom: true,
      details: {
        baseFlavor: selections.baseFlavor.name,
        frosting: selections.frosting.name,
        topping: selections.topping.name
      }
    });
    alert('Cupcake personalizado adicionado ao carrinho!');
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      const proceed = window.confirm('Você precisa estar logado para salvar nos favoritos. Deseja entrar agora?');
      if (proceed) {
        await login();
      }
      return;
    }

    setSavingFav(true);
    try {
      await addDoc(collection(db, 'favorite_customizations'), {
        userId: user.uid,
        name: `${selections.baseFlavor.name} com ${selections.frosting.name}`,
        details: {
          baseFlavor: selections.baseFlavor.name,
          frosting: selections.frosting.name,
          topping: selections.topping.name
        },
        imageUrl: '/red_velvet.jpg',
        createdAt: new Date().toISOString()
      });
      alert('Cupcake personalizado salvo nos seus favoritos com sucesso! ✨');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'favorite_customizations');
    } finally {
      setSavingFav(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Preview Area - Show second on mobile, first on desktop */}
        <div className="lg:sticky lg:top-24 order-1 lg:order-2">
          <div className="bg-white rounded-[40px] lg:rounded-[60px] p-6 lg:p-8 shadow-xl border border-gray-100 overflow-hidden text-center">
            <h2 className="text-2xl lg:text-3xl font-serif font-bold mb-6 lg:mb-8">Seu Cupcake Único</h2>
            
            <div className="relative w-48 h-48 lg:w-64 lg:h-64 mx-auto mb-8 lg:mb-12">
               {/* Simplified visual represention */}
               <motion.div 
                 className="absolute inset-0 rounded-full bg-gray-50 flex items-center justify-center"
                 animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                 transition={{ duration: 4, repeat: Infinity }}
               >
                 <div className="relative">
                    {/* Topping */}
                    <motion.div 
                        key={selections.topping.id}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute -top-6 lg:-top-8 left-1/2 -translate-x-1/2 z-30"
                    >
                        <Star className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    
                    {/* Frosting */}
                    <div 
                      className="w-32 h-20 lg:w-40 lg:h-24 rounded-t-full z-20 relative border-4 border-white shadow-md"
                      style={{ backgroundColor: selections.frosting.color }}
                    />
                    {/* Base */}
                    <div 
                      className="w-40 h-28 lg:w-48 lg:h-32 rounded-b-[30px] lg:rounded-b-[40px] -mt-4 z-10 border-4 border-white shadow-lg"
                      style={{ backgroundColor: selections.baseFlavor.color }}
                    />
                 </div>
               </motion.div>
            </div>

            <div className="space-y-4 text-left p-4 lg:p-6 bg-gray-50 rounded-3xl text-sm lg:text-base">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500 italic">Massa:</span>
                    <span className="font-medium">{selections.baseFlavor.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500 italic">Cobertura:</span>
                    <span className="font-medium">{selections.frosting.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 italic">Topo:</span>
                    <span className="font-medium">{selections.topping.name}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div className="space-y-12 order-2 lg:order-1">
          <div>
            <h1 className="text-5xl font-serif font-bold mb-4">Crie Sua Doçura</h1>
            <p className="text-lg text-gray-600">Combine massa, cobertura e toppings para criar a experiência perfeita.</p>
          </div>

          <section>
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 italic">Passo 1: Escolha a Massa</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FLAVORS.map(flavor => (
                <button
                  key={flavor.id}
                  onClick={() => setSelections(s => ({ ...s, baseFlavor: flavor }))}
                  className={`p-4 rounded-3xl border-2 transition-all flex items-center space-x-3 ${
                    selections.baseFlavor.id === flavor.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: flavor.color }} />
                  <span className="text-sm font-medium">{flavor.name}</span>
                  {selections.baseFlavor.id === flavor.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 italic">Passo 2: A Cobertura</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FROSTINGS.map(frosting => (
                <button
                  key={frosting.id}
                  onClick={() => setSelections(s => ({ ...s, frosting: frosting }))}
                  className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between ${
                    selections.frosting.id === frosting.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: frosting.color }} />
                    <span className="text-sm font-medium">{frosting.name}</span>
                  </div>
                  {selections.frosting.id === frosting.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 italic">Passo 3: O Toque Final</h3>
            <div className="flex flex-wrap gap-2">
              {TOPPINGS.map(topping => (
                <button
                  key={topping.id}
                  onClick={() => setSelections(s => ({ ...s, topping: topping }))}
                  className={`px-6 py-3 rounded-full border-2 transition-all text-sm font-medium ${
                    selections.topping.id === topping.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {topping.name}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1 italic">Total previsto</p>
              <p className="text-4xl font-serif font-bold text-primary">R$ {totalPrice.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={handleSaveFavorite}
                disabled={savingFav}
                title="Salvar nos Favoritos"
                className="p-5 border-2 border-red-200 text-red-500 rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
              <button 
                onClick={handleAddToCart}
                className="flex-1 sm:flex-none px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all transform active:scale-95 shadow-lg shadow-gray-900/10"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
