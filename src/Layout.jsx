
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Kanban, LogOut, Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import ProfileSelector from "./components/auth/ProfileSelector";

const navigationItems = [
  {
    title: "Painel",
    url: createPageUrl("Dashboard"),
    icon: Kanban
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const permissions = usePermissions(user?.perfil, user?.nome_tecnico);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData && userData.perfil) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log("User not authenticated:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await base44.auth.updateMe({
        perfil: null,
        nome_tecnico: null,
        ultimo_acesso: new Date().toISOString(),
        ativo: false
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  useEffect(() => {
    if(isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600">A carregar...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileSelector onLogin={handleLogin} />;
  }

  const getPageTitle = () => {
    switch(currentPageName) {
      case 'Dashboard': return 'PAINEL DA OFICINA';
      default: return currentPageName?.toUpperCase() || 'ATLAS';
    }
  };

  const getUserDisplayName = () => {
    if (user.perfil === 'admin') {
      return 'Administrador';
    }
    if (user.perfil === 'tecnico' && user.nome_tecnico) {
      return user.nome_tecnico.charAt(0).toUpperCase() + user.nome_tecnico.slice(1);
    }
    return user.full_name || 'Utilizador';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <style>
        {`
          @import url('https://fonts.cdnfonts.com/css/segoe-ui-4');
          
          * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
        `}
      </style>

      {/* Top Navigation Bar - Responsive */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
                  alt="ATLAS"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-base sm:text-xl font-bold text-gray-800 tracking-wider">ATLAS</h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Desktop */}
              {user && (
                <div className="hidden md:flex items-center space-x-3 bg-gray-900 text-white px-4 py-2 rounded-lg">
                  <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-sm">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-300 truncate">
                      {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-700"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-[110]">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
                    alt="ATLAS"
                    className="w-8 h-8 object-contain"
                  />
                  <h2 className="text-xl font-bold text-gray-900">ATLAS</h2>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Section */}
              {user && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-200 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-gray-300">
                        {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Title Section - Responsive */}
      <div className={`pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
      }`}>
        <div className="bg-gray-800 text-white py-2 sm:py-4 px-4 sm:px-8 rounded-lg inline-block">
          <h1 className="text-base sm:text-xl lg:text-2xl font-bold tracking-wide">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Main Content - Responsive Padding */}
      <main className={`px-3 sm:px-4 lg:px-8 pb-6 sm:pb-8 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
      }`}>
        {React.cloneElement(children, { userPermissions: permissions, currentUser: user })}
      </main>
    </div>
  );
}
