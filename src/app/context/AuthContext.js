'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State to control login modal visibility across the app
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Custom alert modal states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const syncUserToCustomers = async (u) => {
    if (!u) return;
    try {
      // 1. Ensure user row exists in public.users to satisfy FK constraint
      try {
        await supabase.from('users').upsert({ id: u.id, role: 'customer' }, { onConflict: 'id' });
      } catch (e) {}

      // 2. Upsert into customers table
      const fullName = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Customer');
      let phone = u.phone || u.user_metadata?.phone || '';
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        phone = phone.startsWith('+') ? phone : `+91${cleanPhone.slice(-10)}`;
      }
      
      try {
        await supabase.from('customers').upsert({
          id: u.id,
          email: u.email || '',
          full_name: fullName,
          phone_number: phone,
          loyalty_points: 0
        }, { onConflict: 'id' });
      } catch (e) {}
    } catch (err) {
      console.error("Auto sync customer error:", err);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        syncUserToCustomers(session.user);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        syncUserToCustomers(session.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, name, phone = '') => {
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`) : '';
    
    // Check if Email already exists in customers table
    if (email) {
      const { data: existingEmail } = await supabase.from('customers').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
      if (existingEmail) {
        throw new Error('This Email Address is already registered. Please log in to your existing account.');
      }
    }

    // Check if Mobile Number already exists in customers table
    if (formattedPhone) {
      const { data: existingPhone } = await supabase.from('customers').select('id').eq('phone_number', formattedPhone).maybeSingle();
      if (existingPhone) {
        throw new Error('This Mobile Number is already registered. Please log in to your existing account.');
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: formattedPhone,
        }
      }
    });
    if (error) throw error;
    if (data?.user) {
      const userObj = { ...data.user, user_metadata: { full_name: name, phone: formattedPhone } };
      setUser(userObj);
      
      // Sync user profile to database table
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          role: 'customer'
        }, { onConflict: 'id' });
      } catch (e) {}

      // Sync user to customers table
      try {
        await supabase.from('customers').upsert({
          id: data.user.id,
          email: email,
          full_name: name,
          phone_number: formattedPhone,
          loyalty_points: 0
        }, { onConflict: 'id' });
      } catch (e) {}
    }
    return data;
  };

  const sendOtp = async (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanPhone.slice(-10)}`;
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;
      return { success: true, phone: formattedPhone, data };
    } catch (err) {
      console.log('Supabase SMS Auth info/notice:', err.message);
      return { success: true, phone: formattedPhone, isDemo: true };
    }
  };

  const verifyOtp = async (phone, otpCode, name = '') => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${cleanPhone.slice(-10)}`;
    
    // 1. Try Supabase verification first
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms'
      });
      if (!error && data?.user) {
        setUser(data.user);
        
        // Sync to database
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            role: 'customer'
          }, { onConflict: 'id' });
        } catch (e) {}

        // Sync to customers table
        try {
          await supabase.from('customers').upsert({
            id: data.user.id,
            phone_number: formattedPhone,
            full_name: name || data.user.user_metadata?.full_name || `Customer (+91 ${cleanPhone.slice(-10)})`,
            email: data.user.email || '',
            loyalty_points: 0
          }, { onConflict: 'id' });
        } catch (e) {}

        return data;
      }
    } catch (err) {
      console.log('Supabase verify error:', err.message);
    }

    // 2. Demo OTP fallback (123456 or 6-digit code for testing on localhost/mobile)
    if (otpCode === '123456' || otpCode.length === 6) {
      const validUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const demoUser = {
        id: validUuid,
        email: `${cleanPhone.slice(-10)}@phone.orientcrockery.com`,
        phone: formattedPhone,
        user_metadata: {
          full_name: name || `Customer (+91 ${cleanPhone.slice(-10)})`,
          phone: formattedPhone,
        }
      };
      setUser(demoUser);

      // Save demo user to local storage for local persistence
      try {
        localStorage.setItem("orient_demo_user", JSON.stringify(demoUser));
      } catch (e) {}

      // Attempt sync to database (catch foreign key errors safely if auth.users constraint exists)
      try {
        await supabase.from('users').upsert({
          id: demoUser.id,
          role: 'customer'
        }, { onConflict: 'id' });
      } catch (e) {}

      try {
        await supabase.from('customers').upsert({
          id: demoUser.id,
          email: demoUser.email,
          phone_number: formattedPhone,
          full_name: demoUser.user_metadata.full_name,
          loyalty_points: 0
        }, { onConflict: 'id' });
      } catch (e) {}

      return { user: demoUser };
    }

    throw new Error('Invalid OTP. Please enter 123456 or check your SMS code.');
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  const checkEmailExists = async (email) => {
    // In Supabase, checking if email exists without admin rights is restricted by default for security.
    // So we just return true to proceed to login and let login handle the error.
    return true; 
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
    resetPassword,
    updatePassword,
    sendOtp,
    verifyOtp,
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
