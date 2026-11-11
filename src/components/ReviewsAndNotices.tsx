import { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  serverTimestamp, 
  where,
  limit,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  MessageSquare, 
  Megaphone, 
  Send, 
  Trash2, 
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  User,
  Edit3,
  PlusCircle,
  X
} from 'lucide-react';

export default function ReviewsAndNotices() {
  const { user, profile, login } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const isAdminUser = profile?.role === 'admin' || user?.email === 'evandrorezoli@gmail.com';

  useEffect(() => {
    // 1. Sync Reviews
    const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const revs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setReviews(revs);
      
      if (user) {
        const found = revs.find(r => r.userId === user.uid);
        setUserReview(found || null);
      } else {
        setUserReview(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'reviews');
      setLoading(false);
    });

    // 2. Sync Active Notices
    const qNotices = query(collection(db, 'notices'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setNotices(notes);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'notices');
    });

    return () => {
      unsubReviews();
      unsubNotices();
    };
  }, [user]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleStartEdit = () => {
    if (userReview) {
      setNewReview({
        rating: Number(userReview.rating) || 5,
        comment: userReview.comment || ''
      });
      setIsEditing(true);
      scrollToForm();
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewReview({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      alert('Por favor, escreva um breve comentário para sua avaliação.');
      return;
    }

    if (!user) {
      await login();
      return;
    }

    setSubmitting(true);
    const path = 'reviews';
    try {
      if (isEditing && userReview) {
        await updateDoc(doc(db, 'reviews', userReview.id), {
          rating: Number(newReview.rating),
          comment: newReview.comment.trim()
        });
        setIsEditing(false);
      } else {
        await addDoc(collection(db, path), {
          userId: user.uid,
          userName: user.displayName || 'Cliente Cupcake Haven',
          userPhoto: user.photoURL || '',
          rating: Number(newReview.rating),
          comment: newReview.comment.trim(),
          createdAt: serverTimestamp()
        });
      }
      setNewReview({ rating: 5, comment: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'reviews', targetId));
      setReviews(prev => prev.filter(r => r.id !== targetId));
      if (userReview?.id === targetId) {
        setUserReview(null);
        setIsEditing(false);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting review:', err);
      handleFirestoreError(err, OperationType.DELETE, `reviews/${targetId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getNoticeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      case 'success': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default: return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  if (loading) return <div className="py-32 text-center italic text-gray-400">Carregando depoimentos e avisos...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 sm:px-6 lg:px-8 relative">
      {/* Custom Confirmation Modal for Deleting Review */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center relative"
            >
              <button 
                onClick={() => setDeleteTarget(null)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Excluir Avaliação?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Tem certeza de que deseja remover esta avaliação do mural da loja? Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcements / Notices Section */}
      <AnimatePresence>
        {notices.length > 0 && (
          <div className="mb-14 space-y-4">
            {notices.map((notice) => {
              const Icon = getNoticeIcon(notice.type);
              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-6 rounded-[32px] border flex items-start space-x-4 shadow-sm ${getNoticeColor(notice.type)}`}
                >
                  <div className="p-3 bg-white/70 rounded-2xl shadow-xs">
                    <Icon className="w-6 h-6 shrink-0" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg leading-snug">{notice.title}</h3>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/60">
                        Aviso da Loja
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mt-1.5 leading-relaxed">{notice.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <header className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-primary mb-2">
            <Megaphone className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Voz dos Clientes</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-gray-900">Avaliações & Avisos</h1>
          <p className="text-gray-500 italic mt-2">Veja os comunicados recentes e o que nossos clientes dizem sobre nossos cupcakes.</p>
        </div>

        <button 
          onClick={scrollToForm}
          className="self-start md:self-auto px-6 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm flex items-center space-x-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Escrever Avaliação</span>
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Summary and Add/Edit Review Form */}
        <div ref={formRef} className="lg:col-span-1 space-y-8">
          {/* Summary Card */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Média de Satisfação</h3>
            <div className="flex items-center justify-center space-x-4 mb-2">
              <span className="text-6xl font-serif font-bold text-gray-900">{averageRating}</span>
              <div className="text-left">
                <div className="flex text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(averageRating)) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 italic">{reviews.length} avaliações registradas</p>
              </div>
            </div>
          </div>

          {/* User's existing review banner (if already reviewed and not currently editing) */}
          {userReview && !isEditing ? (
            <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" /> Sua Avaliação
                </span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < userReview.rating ? 'fill-current' : ''}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-emerald-950 italic mb-4">"{userReview.comment}"</p>
              <div className="flex items-center space-x-2 pt-2 border-t border-emerald-200/50">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: userReview.id })}
                  className="px-4 py-2 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100/50 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ) : (
            /* Review Form Card - ALWAYS VISIBLE */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] border-2 border-primary/20 shadow-lg shadow-primary/5 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold text-gray-900">
                  {isEditing ? 'Editar sua Avaliação' : 'Criar Nova Avaliação'}
                </h3>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {!user && (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200/60 rounded-2xl text-xs text-amber-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Você pode escolher sua nota e escrever abaixo. Ao clicar em enviar, conectaremos sua conta.</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Quantas estrelas?</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                          newReview.rating >= star ? 'text-amber-400 bg-amber-50 shadow-xs' : 'text-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${newReview.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Seu Comentário</label>
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Conte o que achou dos sabores, entrega ou atendimento..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white min-h-[120px] resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : isEditing ? 'Salvar Alterações' : 'Publicar Avaliação'}</span>
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Right Column: Reviews Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3 text-primary" />
              Mural da Comunidade
            </h2>
            <span className="text-xs text-gray-400 font-medium">{reviews.length} depoimentos</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {reviews.map((review) => {
                const canManage = Boolean(user && (user.uid === review.userId || isAdminUser));

                return (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 relative group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900 leading-snug">{review.userName}</h4>
                            {user?.uid === review.userId && (
                              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="flex text-amber-400 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < (Number(review.rating) || 5) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center space-x-1">
                          {user?.uid === review.userId && (
                            <button 
                              type="button"
                              onClick={handleStartEdit}
                              title="Editar avaliação"
                              className="p-2 text-gray-400 hover:text-primary rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => setDeleteTarget({ id: review.id, name: review.userName })}
                            title="Excluir avaliação"
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic">"{review.comment}"</p>
                    <p className="mt-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {reviews.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Ainda não há avaliações cadastradas.</p>
                <p className="text-xs text-gray-400 mt-1 italic">Use o formulário ao lado e seja o primeiro a contar como foi sua experiência!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
