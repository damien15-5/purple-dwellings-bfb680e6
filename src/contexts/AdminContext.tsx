import React, { createContext, useContext, useState, useEffect } from 'react';

interface Admin {
  username: string;
  role: 'super_admin' | 'sub_admin';
  createdBy?: string;
}

interface AdminContextType {
  admin: Admin | null;
  login: (username: string, password: string, secondPassword: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const storedAdmin = sessionStorage.getItem('xavorian_admin');
    if (storedAdmin) {
      const adminData = JSON.parse(storedAdmin);
      setAdmin(adminData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string, secondPassword: string): Promise<boolean> => {
    // Super Admin credentials
    if (
      username === 'damien15_5' &&
      password === 'xavorian' &&
      secondPassword === 'EzeaniChika'
    ) {
      const superAdmin: Admin = {
        username: 'damien15_5',
        role: 'super_admin',
      };
      setAdmin(superAdmin);
      setIsAuthenticated(true);
      sessionStorage.setItem('xavorian_admin', JSON.stringify(superAdmin));
      return true;
    }

    // TODO: Check sub-admin credentials from database
    // For now, we'll handle sub-admins after super admin creates them
    
    return false;
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('xavorian_admin');
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, isAuthenticated }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
