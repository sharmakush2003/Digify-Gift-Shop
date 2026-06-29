'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  fetchSignInMethodsForEmail,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State to control login modal visibility across the app
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Custom alert modal states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
      // Update local state to reflect the new display name immediately
      setUser({ ...userCredential.user, displayName: name });
    }
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const checkEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Error checking email:", error);
      // Fallback: If email enumeration protection is enabled, it might throw or return empty.
      // We'll return true to proceed to login and let login handle the invalid-credential error.
      return true; 
    }
  };

  const requireLogin = (customMessage) => {
    if (!user) {
      setAlertMessage(customMessage || "Please login to continue");
      setShowAlert(true);
      return false;
    }
    return true;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    checkEmailExists,
    showLoginModal,
    setShowLoginModal,
    showAlert,
    setShowAlert,
    alertMessage,
    setAlertMessage,
    requireLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
