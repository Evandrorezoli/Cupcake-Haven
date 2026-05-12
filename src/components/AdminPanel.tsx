import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash, Edit, LayoutDashboard, ShoppingBag } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products'>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    imageUrl: '',
    category: 'Clássicos',
    active: true,
    stock: 50
  });

  const fetchProducts = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'products'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), newProduct);
      setNewProduct({ name: '', price: 0, imageUrl: '', category: 'Clássicos', active: true, stock: 50 });
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este produto?')) {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    }
  };

  const handleUpdateActive = async (id: string, active: boolean) => {
    await updateDoc(doc(db, 'products', id), { active });
    fetchProducts();
  };

  const handleSeedData = async () => {
    const defaultProducts = [
      { name: 'Red Velvet Lux', price: 9.50, imageUrl: 'https://images.unsplash.com/photo-1614707267537-b85af00c4b81?auto=format&fit=crop&q=80&w=400', category: 'Clássicos', active: true, stock: 100 },
      { name: 'Limão Siciliano', price: 8.90, imageUrl: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&q=80&w=400', category: 'Sazonais', active: true, stock: 50 },
      { name: 'Chocolate Intenso', price: 10.50, imageUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=400', category: 'Clássicos', active: true, stock: 80 },
      { name: 'Blueberry Zen (V)', price: 11.00, imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=400', category: 'Veganos', active: true, stock: 30 },
    ];

    try {
      for (const p of defaultProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      fetchProducts();
      alert('Dados iniciais criados com sucesso!');
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-500 italic">Central de comando da Cupcake Haven</p>
        </div>
        
        <div className="flex bg-gray-50 p-1.5 rounded-[24px]">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'dashboard' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Relatórios</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'products' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <AdminDashboard />
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif font-bold">Novo Cupcake</h3>
                <button 
                  onClick={handleSeedData}
                  className="text-[10px] font-bold text-primary uppercase underline hover:no-underline"
                >
                  Demo
                </button>
              </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-500 mb-1 ml-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 ml-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 ml-1">URL da Imagem</label>
                <input 
                  type="text" 
                  value={newProduct.imageUrl}
                  onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1 ml-1">Categoria</label>
                <select 
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none appearance-none"
                >
                  <option>Clássicos</option>
                  <option>Sazonais</option>
                  <option>Veganos</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-colors mt-4"
              >
                <Plus className="w-5 h-5" />
                <span>Cadastrar Produto</span>
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-serif text-sm italic text-gray-500 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 font-serif text-sm italic text-gray-500 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 font-serif text-sm italic text-gray-500 uppercase tracking-widest">Preço</th>
                  <th className="px-6 py-4 font-serif text-sm italic text-gray-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={product.imageUrl} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div>
                           <p className="font-serif font-bold">{product.name}</p>
                           <p className={`text-[10px] uppercase font-bold ${product.active ? 'text-green-500' : 'text-red-400'}`}>
                              {product.active ? 'Ativo' : 'Inativo'}
                           </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-medium">R$ {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleUpdateActive(product.id, !product.active)}
                          className={`p-2 rounded-xl border ${product.active ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600 border-green-200'}`}
                        >
                           <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-xl bg-red-50 text-red-400 border border-red-100 hover:bg-red-500 hover:text-white transition-colors"
                        >
                           <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="p-12 text-center text-gray-400 italic">Carregando catálogo...</div>}
            {!loading && products.length === 0 && <div className="p-12 text-center text-gray-400 italic">Nenhum produto cadastrado.</div>}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
