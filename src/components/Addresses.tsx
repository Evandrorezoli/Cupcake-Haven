import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { MapPin, Plus, Trash2, Home, Building2, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'addresses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAddresses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/addresses`);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const path = `users/${user.uid}/addresses`;
    try {
      // If this is the first address or set as default, update others
      if (formData.isDefault || addresses.length === 0) {
        // Implementation for setting only one default could go here
        // For now, just add the new address
      }

      await addDoc(collection(db, 'users', user.uid, 'addresses'), {
        ...formData,
        isDefault: addresses.length === 0 ? true : formData.isDefault
      });

      setShowAddForm(false);
      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false
      });
      alert('Endereço adicionado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !window.confirm('Excluir este endereço?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', addressId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/addresses/${addressId}`);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
       // Reset all to false first (ideally use a batch)
       for (const addr of addresses) {
         if (addr.isDefault) {
           await updateDoc(doc(db, 'users', user.uid, 'addresses', addr.id), { isDefault: false });
         }
       }
       // Set new default
       await updateDoc(doc(db, 'users', user.uid, 'addresses', addressId), { isDefault: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/addresses/${addressId}`);
    }
  };

  if (!user) return <div className="py-32 text-center text-gray-400">Entre para gerenciar seus endereços.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Meus Endereços</h1>
          <p className="text-gray-500 italic lowercase">gerencie seus locais de entrega</p>
        </div>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 rounded-[32px] font-bold hover:bg-black transition-all shadow-xl hover:translate-y-[-2px]"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Endereço</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 mb-12"
          >
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold">Novo Endereço</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <form onSubmit={handleAddAddress} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Rua / Logradouro</label>
                    <input 
                      required
                      type="text" 
                      value={formData.street} 
                      onChange={e => setFormData({...formData, street: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Número</label>
                    <input 
                      required
                      type="text" 
                      value={formData.number} 
                      onChange={e => setFormData({...formData, number: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Complemento (opcional)</label>
                    <input 
                      type="text" 
                      value={formData.complement} 
                      onChange={e => setFormData({...formData, complement: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Bairro</label>
                    <input 
                      required
                      type="text" 
                      value={formData.neighborhood} 
                      onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">CEP</label>
                    <input 
                      required
                      type="text" 
                      value={formData.zipCode} 
                      onChange={e => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Cidade</label>
                    <input 
                      required
                      type="text" 
                      value={formData.city} 
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">UF</label>
                    <input 
                      required
                      type="text" 
                      maxLength={2}
                      value={formData.state} 
                      onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setFormData({...formData, isDefault: !formData.isDefault})}>
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isDefault ? 'bg-primary border-primary' : 'border-gray-200'}`}>
                      {formData.isDefault && <CheckCircle className="w-4 h-4 text-white" />}
                   </div>
                   <span className="text-sm text-gray-500 font-medium">Definir como endereço padrão</span>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-3 bg-primary text-white font-bold rounded-2xl py-4 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                   >
                     {isSubmitting ? 'Salvando...' : 'Salvar Endereço'}
                   </button>
                </div>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center italic text-gray-400">Carregando seus endereços...</div>
        ) : addresses.length === 0 ? (
          <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[40px] p-20 text-center">
             <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
             <p className="text-gray-400 italic">Você ainda não cadastrou nenhum endereço.</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div 
              key={address.id} 
              className={`bg-white p-8 rounded-[40px] border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                address.isDefault ? 'border-primary shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${address.isDefault ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400'}`}>
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-serif font-bold text-xl">{address.street}, {address.number}</h3>
                      {address.isDefault && (
                        <span className="bg-primary/10 text-primary text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">Padrão</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 italic">
                      {address.complement && `${address.complement} - `}
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-[10px] text-gray-300 font-mono tracking-widest mt-1">CEP: {address.zipCode}</p>
                  </div>
              </div>
              
              <div className="flex items-center space-x-2 w-full md:w-auto">
                {!address.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(address.id)}
                    className="flex-1 md:flex-none text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white hover:bg-primary px-4 py-2 rounded-xl transition-all"
                  >
                    Tornar Padrão
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteAddress(address.id)}
                  className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
