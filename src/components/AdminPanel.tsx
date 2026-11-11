import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash, Edit, LayoutDashboard, ShoppingBag, Megaphone } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'notices'>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'info',
    active: true
  });
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
    const data = querySnapshot.docs.map(docSnap => {
      const item = { id: docSnap.id, ...docSnap.data() } as any;
      if (item.imageUrl?.includes('1614707267537') || (item.name?.toLowerCase().includes('red velvet') && (!item.imageUrl || item.imageUrl.includes('photo-1614707267537')))) {
        item.imageUrl = '/red_velvet.jpg';
        updateDoc(doc(db, 'products', docSnap.id), { imageUrl: '/red_velvet.jpg' }).catch(() => {});
      }
      return item;
    });
    setProducts(data);
    setLoading(false);
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'notices'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'notices') fetchNotices();
  }, [activeTab]);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    try {
      await addDoc(collection(db, 'notices'), {
        ...newNotice,
        createdAt: serverTimestamp()
      });
      setNewNotice({ title: '', content: '', type: 'info', active: true });
      fetchNotices();
      alert('Aviso publicado com sucesso!');
    } catch (error) {
      console.error("Error adding notice:", error);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm('Excluir este aviso?')) {
      try {
        await deleteDoc(doc(db, 'notices', id));
        fetchNotices();
      } catch (error) {
        console.error("Error deleting notice:", error);
      }
    }
  };

  const handleToggleNotice = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'notices', id), { active });
      fetchNotices();
    } catch (error) {
      console.error("Error updating notice:", error);
    }
  };

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
      { name: 'Red Velvet Lux', price: 9.50, imageUrl: '/red_velvet.jpg', category: 'Clássicos', active: true, stock: 100 },
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
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'notices' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Avisos</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <AdminDashboard />
      ) : activeTab === 'products' ? (
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
                  placeholder="https://... ou /red_velvet.jpg"
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
                  <option value="Clássicos">Clássicos</option>
                  <option value="Sazonais">Sazonais</option>
                  <option value="Veganos">Veganos</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 mt-4"
              >
                <Plus className="w-5 h-5" />
                <span>Cadastrar Cupcake</span>
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
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
                        <img 
                          src={product.imageUrl?.includes('1614707267537') ? '/red_velvet.jpg' : (product.imageUrl || '/red_velvet.jpg')} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/red_velvet.jpg';
                          }} 
                        />
                        <div>
                           <p className="font-serif font-bold">{product.name}</p>
                           <p className={`text-[10px] uppercase font-bold ${product.active ? 'text-green-500' : 'text-red-400'}`}>
                              {product.active ? 'Ativo' : 'Inativo'}
                           </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-medium">R$ {Number(product.price).toFixed(2)}</td>
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
      ) : (
        /* Notices Management Tab */
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-xl font-serif font-bold mb-6">Novo Comunicado / Aviso</h3>
              <form onSubmit={handleAddNotice} className="space-y-4 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1 ml-1">Título do Aviso</label>
                  <input 
                    type="text" 
                    value={newNotice.title}
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    placeholder="Ex: Novo sabor no cardápio!"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 ml-1">Tipo de Mensagem</label>
                  <select 
                    value={newNotice.type}
                    onChange={e => setNewNotice({...newNotice, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none appearance-none"
                  >
                    <option value="info">Informativo (Azul)</option>
                    <option value="success">Comemoração / Sucesso (Verde)</option>
                    <option value="warning">Atenção / Horário especial (Amarelo)</option>
                    <option value="error">Urgente / Alerta (Vermelho)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 ml-1">Conteúdo</label>
                  <textarea 
                    value={newNotice.content}
                    onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                    placeholder="Escreva a mensagem que aparecerá no topo da tela de avaliações..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-primary outline-none min-h-[120px] resize-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 mt-4"
                >
                  <Plus className="w-5 h-5" />
                  <span>Publicar Comunicado</span>
                </button>
              </form>
            </div>
          </div>

          {/* Notices List */}
          <div className="lg:col-span-2 space-y-4">
            {notices.map(notice => (
              <div key={notice.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-start justify-between shadow-xs">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl ${
                    notice.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                    notice.type === 'error' ? 'bg-red-50 text-red-600' :
                    notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{notice.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
                    <div className="flex items-center space-x-3 mt-3">
                      <button 
                        onClick={() => handleToggleNotice(notice.id, !notice.active)}
                        className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full transition-colors ${
                          notice.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {notice.active ? 'Ativo na Loja' : 'Pausado'}
                      </button>
                      <span className="text-[10px] text-gray-400">
                        {notice.createdAt?.toDate ? notice.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteNotice(notice.id)}
                  title="Excluir comunicado"
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {loading && <div className="text-center py-12 text-gray-400 italic">Carregando comunicados...</div>}
            {!loading && notices.length === 0 && (
              <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum comunicado cadastrado.</p>
                <p className="text-xs text-gray-400 mt-1 italic">Use o formulário ao lado para postar mensagens no topo da página de avaliações.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
