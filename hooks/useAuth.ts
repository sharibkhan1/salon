"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: userData } 
    }));
  };

  const logout = () => {
    updateUser(null);
  };

  const login = (userData: User) => {
    updateUser(userData);
  };

  useEffect(() => {
    // Initial load - check localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);

    // Listen for auth state changes from other components
    const handleAuthStateChange = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };
}
