import { useAuth } from '../lib/AuthContext';
import { Package, User as UserIcon, MapPin, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, profile } = useAuth();

  if (!user) {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-500 italic">Por favor, faça login para ver seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[60px] shadow-xl border border-gray-100 overflow-hidden mb-12">
        <div className="h-32 bg-primary/10 relative" />
        <div className="px-8 pb-12 -mt-12 text-center flex flex-col items-center">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-8 border-white shadow-lg mb-4"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-serif font-bold text-gray-900">{user.displayName}</h1>
          <p className="text-gray-500 italic">{user.email}</p>
          <div className="mt-4 px-4 py-1 bg-accent/10 text-accent rounded-full text-[10px] uppercase font-bold tracking-widest">
            {profile?.role === 'admin' ? 'Administrador' : 'Explorador de Sabores'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link to="/orders" className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-serif font-bold text-xl">Meus Pedidos</h3>
                <p className="text-sm text-gray-400 lowercase italic">histórico de compras</p>
             </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/favorites" className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-serif font-bold text-xl">Favoritos</h3>
                <p className="text-sm text-gray-400 lowercase italic">cupcakes salvos</p>
             </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/addresses" className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 bg-orange-50 text-orange-400 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-serif font-bold text-xl">Endereços</h3>
                <p className="text-sm text-gray-400 lowercase italic">endereços de entrega</p>
             </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-primary transition-colors" />
        </Link>

        <div className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between opacity-50 cursor-not-allowed">
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-serif font-bold text-xl">Minha Conta</h3>
                <p className="text-sm text-gray-400 lowercase italic">em breve</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
