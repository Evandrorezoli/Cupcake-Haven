import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          // Hardcheck for the specific user email to ensure they have admin access if requested
          if (user.email === 'evandrorezoli@gmail.com' && profileData.role !== 'admin') {
            const updatedProfile = { ...profileData, role: 'admin' };
            await setDoc(docRef, updatedProfile);
            setProfile(updatedProfile);
          } else {
            setProfile(profileData);
          }
        } else {
          // Create default profile
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'evandrorezoli@gmail.com' ? 'admin' : 'customer',
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Firebase Auth Login Error:', error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert(
          'Domínio não autorizado pelo Firebase!\n\n' +
          'Para logar rodando localmente (localhost), acesse o Firebase Console > Authentication > Configurações > Domínios Autorizados e adicione "localhost" e "127.0.0.1".\n\n' +
          'Certifique-se também de acessar via http://localhost:3000 no navegador.'
        );
      } else if (error?.code === 'auth/popup-blocked') {
        alert('A janela pop-up de login foi bloqueada pelo navegador. Por favor, permita pop-ups para este site.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        console.warn('Login pop-up fechado pelo usuário.');
      } else {
        alert(`Erro ao fazer login com o Google: ${error?.message || error}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
