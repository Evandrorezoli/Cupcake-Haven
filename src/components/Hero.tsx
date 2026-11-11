import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[200px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-20 h-20 mb-8 rounded-3xl overflow-hidden shadow-lg shadow-primary/10 border border-gray-100 bg-white p-2 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Cupcake Haven" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
          <span className="meta-label text-accent mb-4 block font-medium tracking-widest uppercase text-xs">Cupcakes Artesanais</span>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-900 leading-[0.9] mb-6">
            Pequenos <br />
            Momentos <br />
            <span className="text-primary italic font-light">de Doçura.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
            Feitos à mão com os melhores ingredientes. Personalize seu cupcake ou escolha entre nossos clássicos favoritos.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/catalog" 
              className="px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-lg shadow-primary/20"
            >
              Ver Cardápio
            </Link>
            <Link 
              to="/customize" 
              className="px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all"
            >
              Customizar Meu Cupcake
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <img 
            src="https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800" 
            alt="Delicious Cupcakes" 
            className="rounded-[60px] shadow-2xl w-full aspect-[4/5] object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Badge */}
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hidden md:block">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-accent text-xl">✨</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Qualidade Premium</p>
                <p className="font-serif text-lg leading-tight">Ingredientes <br /> Orgânicos</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
