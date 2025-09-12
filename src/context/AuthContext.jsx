import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Context oluşturma
const AuthContext = createContext();

// Admin email configuration - SIMPLIFIED
const ADMIN_EMAILS = [
  'admin@prizmascience.com',
  'batur@prizmascience.com',
  'info@prizmascience.com'
];

// Enhanced AuthProvider with simplified admin system
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified admin check - just check email
  const checkIfAdmin = (user) => {
    if (!user || !user.email) {
      setUserRole('user');
      setIsAdmin(false);
      return;
    }

    const isAdminEmail = ADMIN_EMAILS.includes(user.email);
    console.log(`Email: ${user.email}, Is Admin: ${isAdminEmail}`);
    
    if (isAdminEmail) {
      setUserRole('admin');
      setIsAdmin(true);
    } else {
      setUserRole('user');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email || 'No user');
      setCurrentUser(user);
      checkIfAdmin(user);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  // Permission checking functions - FIXED
  const canAccessAdmin = () => {
    return isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
  };

  const canManageProducts = () => {
    return isAdmin;
  };

  const canManageOrders = () => {
    return isAdmin;
  };

  const canManageUsers = () => {
    return isAdmin;
  };

  const value = {
    // User data
    currentUser,
    userRole,
    isAdmin,
    
    // Auth state
    loading,
    error,
    isAuthenticated: !!currentUser,
    
    // Permission checks
    canAccessAdmin,
    canManageProducts,
    canManageOrders,
    canManageUsers
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easier context usage
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}