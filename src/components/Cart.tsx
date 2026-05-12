import { useCart } from '../lib/CartContext';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useState, useEffect } from 'react';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'addresses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const addrData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAddresses(addrData);
      
      // Select default address if none selected
      if (addrData.length > 0 && !selectedAddress) {
        const defaultAddr = addrData.find(a => a.isDefault) || addrData[0];
        setSelectedAddress(defaultAddr);
      }
    });

    return unsubscribe;
  }, [user]);

  const handleCheckout = async () => {
    if (!user) {
      if (window.confirm('Você precisa estar logado para finalizar a compra. Logar agora?')) {
        await login();
      }
      return;
    }

    if (!selectedAddress) {
      alert('Por favor, selecione um endereço de entrega.');
      return;
    }

    setIsCheckingOut(true);
    const path = 'orders';
    try {
      const order = {
        userId: user.uid,
        items: items.map(i => ({
            productId: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            details: i.details || null
        })),
        total,
        address: {
          street: selectedAddress.street,
          number: selectedAddress.number,
          complement: selectedAddress.complement || '',
          neighborhood: selectedAddress.neighborhood,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode
        },
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, path), order);
      clearCart();
      alert('Pedido realizado com sucesso!');
      navigate('/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-8 lowercase italic">que tal adicionar algumas doçuras para alegrar o seu dia?</p>
        <Link 
          to="/catalog" 
          className="inline-block px-12 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all"
        >
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-serif font-bold mb-12">Meu Carrinho</h1>
      
      <div className="grid lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-6 p-6 bg-white rounded-[40px] shadow-sm border border-gray-100">
              <img 
                src={item.imageUrl} 
                className="w-32 h-40 rounded-3xl object-cover" 
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-1 tracking-tight">{item.name}</h3>
                    {item.isCustom && (
                        <p className="text-xs text-accent italic">Personalizado: {item.details?.baseFlavor} + {item.details?.frosting}</p>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)} 
                    className="p-2 -mr-2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="Remover item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-primary">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xl font-serif font-bold text-primary">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[60px] shadow-xl border border-gray-100 sticky top-24">
            <h3 className="text-2xl font-serif font-bold mb-8">Resumo do Pedido</h3>
            
            {user && (
              <div className="mb-8 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> Endereço de Entrega
                  </span>
                  <Link to="/addresses" className="text-[10px] font-bold text-primary hover:underline">Alterar</Link>
                </div>
                
                {addresses.length > 0 ? (
                  <div>
                    <p className="text-sm font-bold truncate">{selectedAddress?.street}, {selectedAddress?.number}</p>
                    <p className="text-[11px] text-gray-400 italic truncate">
                      {selectedAddress?.neighborhood}, {selectedAddress?.city}
                    </p>
                  </div>
                ) : (
                  <Link to="/addresses" className="flex items-center justify-between text-primary group">
                    <span className="text-sm font-bold">Cadastrar Endereço</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500 lowercase italic">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 lowercase italic">
                <span>Entrega</span>
                <span className="text-green-500">Grátis</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between items-end pt-4">
                <span className="font-serif text-xl font-bold">Total</span>
                <span className="text-3xl font-serif font-bold text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full py-5 rounded-3xl font-bold text-xl flex items-center justify-center space-x-3 transition-all transform active:scale-95 ${
                isCheckingOut ? 'bg-gray-200 text-gray-400' : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              <span>{isCheckingOut ? 'Processando...' : 'Finalizar Compra'}</span>
              {!isCheckingOut && <ArrowRight className="w-6 h-6" />}
            </button>

            <p className="mt-6 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Pagamento 100% Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
