import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Package, Clock, CheckCircle, Truck, XCircle, CreditCard, Trash2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_MAP: any = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-amber-500 bg-amber-50' },
  confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-500 bg-blue-50' },
  shipped: { label: 'Em Trânsito', icon: Truck, color: 'text-purple-500 bg-purple-50' },
  delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-500 bg-red-50' },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPaymentFor, setShowPaymentFor] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleConfirmPayment = async () => {
    if (!showPaymentFor) return;
    
    setProcessingId(showPaymentFor.id);
    try {
      await updateDoc(doc(db, 'orders', showPaymentFor.id), {
        status: 'confirmed'
      });
      alert('Pagamento confirmado com sucesso! Seu pedido entrará em produção.');
      setShowPaymentFor(null);
      setPaymentMethod(null);
    } catch (error: any) {
      alert(`Erro ao confirmar pagamento: ${error.message || 'Erro desconhecido'}`);
      handleFirestoreError(error, OperationType.UPDATE, `orders/${showPaymentFor.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setConfirmDeleteId(null);
    } catch (error: any) {
      alert(`Erro ao cancelar pedido: ${error.message || 'Erro desconhecido'}`);
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="py-32 text-center italic text-gray-400">Carregando seus pedidos...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-serif font-bold mb-12">Meus Pedidos</h1>
      
      <div className="space-y-8">
        {orders.map((order) => {
          const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
          const StatusIcon = status.icon;

          return (
            <div key={order.id} className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row justify-between md:items-center border-b border-gray-50 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Cód: #{order.id.slice(0, 8)}</p>
                  <p className="font-serif text-xl">
                    Realizado em {order.createdAt?.toDate 
                      ? order.createdAt.toDate().toLocaleDateString('pt-BR') 
                      : new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {order.status === 'pending' && (
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1">
                      {confirmDeleteId === order.id ? (
                        <div className="flex items-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase"
                          >
                            Não
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                            disabled={processingId === order.id}
                            className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-red-600 disabled:opacity-50"
                          >
                            {processingId === order.id ? '...' : 'Sim, Cancelar'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(order.id); }}
                            className="p-3 text-red-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                            title="Cancelar Pedido"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPaymentFor(order); }}
                            className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Pagar Agora</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl flex items-center space-x-2 ${status.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-bold text-sm">{status.label}</span>
                  </div>
                </div>
              </div>
              
              {/* ... order items ... */}
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-primary">{item.quantity}x</span>
                        <span>{item.name}</span>
                        {item.details && <span className="text-[10px] italic text-gray-400">({item.details.baseFlavor})</span>}
                      </div>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.address && (
                  <div className="mb-8 p-6 bg-gray-50/50 rounded-3xl border border-gray-50">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> Entrega em
                    </p>
                    <p className="text-sm font-medium">
                      {order.address.street}, {order.address.number}
                      {order.address.complement && ` - ${order.address.complement}`}
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      {order.address.neighborhood}, {order.address.city} - {order.address.state}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                   <Link to="/catalog" className="text-sm font-medium text-primary hover:underline">Comprar Novamente</Link>
                   <div className="text-right">
                      <p className="text-xs text-gray-400 italic">Total do Pedido</p>
                      <p className="text-2xl font-serif font-bold">R$ {order.total.toFixed(2)}</p>
                   </div>
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 italic">Você ainda não realizou nenhum pedido.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPaymentFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPaymentFor(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
             <h2 className="text-3xl font-serif font-bold mb-2">Finalizar Pagamento</h2>
             <p className="text-gray-400 italic mb-8 lowercase">Total a pagar: R$ {showPaymentFor.total.toFixed(2)}</p>

             <div className="space-y-4 mb-10">
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${
                    paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 font-bold">PIX</div>
                    <div className="text-left">
                       <p className="font-bold">PIX Copia e Cola</p>
                       <p className="text-xs text-gray-400">Liberação imediata</p>
                    </div>
                  </div>
                  {paymentMethod === 'pix' && <CheckCircle className="w-6 h-6 text-primary" />}
                </button>

                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><CreditCard /></div>
                    <div className="text-left">
                       <p className="font-bold">Cartão de Crédito</p>
                       <p className="text-xs text-gray-400">Até 3x sem juros</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <CheckCircle className="w-6 h-6 text-primary" />}
                </button>
             </div>

             {paymentMethod === 'pix' && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-6 bg-gray-50 rounded-3xl text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Código PIX:</p>
                  <code className="text-xs break-all block mb-4 p-3 bg-white rounded-xl border border-gray-100">
                    00020126360014br.gov.bcb.pix0114000cupcakehaven
                  </code>
                  <button className="text-xs text-primary font-bold">Copiar Código</button>
               </motion.div>
             )}

             <div className="flex gap-4">
               <button 
                 onClick={() => setShowPaymentFor(null)}
                 className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleConfirmPayment}
                 disabled={!paymentMethod || processingId === showPaymentFor.id}
                 className="flex-1 bg-gray-900 text-white font-bold rounded-2xl py-4 disabled:opacity-20 hover:bg-black transition-all"
               >
                 {processingId === showPaymentFor.id ? 'Processando...' : 'Confirmar'}
               </button>
             </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
