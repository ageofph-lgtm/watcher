import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Kanban, LogOut, Menu, X, Eye } from "lucide-react";
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
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ 
        background: 'radial-gradient(ellipse at center, #1a0b2e 0%, #0a0118 70%, #000000 100%)'
      }}>
        {/* Cosmic stars background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '10%', left: '20%', boxShadow: '0 0 10px 2px rgba(139, 92, 246, 0.6)' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '80%', animationDelay: '0.5s', boxShadow: '0 0 10px 2px rgba(236, 72, 153, 0.6)' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '70%', left: '30%', animationDelay: '1s', boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.6)' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '60%', left: '70%', animationDelay: '1.5s', boxShadow: '0 0 10px 2px rgba(16, 185, 129, 0.6)' }}></div>
          <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ top: '40%', left: '50%', animationDelay: '0.8s', boxShadow: '0 0 20px 4px rgba(139, 92, 246, 0.8)' }}></div>
        </div>

        <div className="relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 mx-auto" style={{ borderColor: '#8b5cf6' }}></div>
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 60px rgba(139, 92, 246, 0.6)' }}></div>
          </div>
          <p className="mt-6 text-xl font-bold tracking-widest text-purple-300" style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.8)' }}>
            A CARREGAR THE WATCHER...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileSelector onLogin={handleLogin} />;
  }

  const getPageTitle = () => {
    switch(currentPageName) {
      case 'Dashboard': return 'PAINEL DA OFICINA';
      default: return currentPageName?.toUpperCase() || 'THE WATCHER';
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
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'radial-gradient(ellipse at top, #1a0b2e 0%, #0a0118 50%, #000000 100%)'
    }}>
      {/* Cosmic animated background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute w-96 h-96 rounded-full" style={{ 
          top: '-10%', 
          right: '-5%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 8s ease-in-out infinite'
        }}></div>
        <div className="absolute w-96 h-96 rounded-full" style={{ 
          bottom: '-10%', 
          left: '-5%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 10s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
        <div className="absolute w-64 h-64 rounded-full" style={{ 
          top: '30%', 
          left: '40%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'pulse 12s ease-in-out infinite',
          animationDelay: '4s'
        }}></div>
      </div>

      {/* Floating stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.5)'
            }}
          />
        ))}
      </div>

      <style>
        {`
          @import url('https://fonts.cdnfonts.com/css/segoe-ui-4');
          
          :root {
            /* Cosmic Watcher Color Palette */
            --cosmic-purple: #8b5cf6;
            --cosmic-blue: #3b82f6;
            --cosmic-pink: #ec4899;
            --cosmic-cyan: #06b6d4;
            --cosmic-green: #10b981;
            --cosmic-dark: #0a0118;
            --cosmic-darker: #050010;
          }
          
          * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }

          /* Cosmic glow effects */
          .cosmic-glow-purple {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3);
          }

          .cosmic-glow-blue {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);
          }

          .cosmic-text-glow {
            text-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.5);
          }

          .cosmic-border-glow {
            border: 2px solid var(--cosmic-purple);
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.6), inset 0 0 15px rgba(139, 92, 246, 0.2);
          }

          /* Gradient backgrounds */
          .cosmic-bg-primary {
            background: linear-gradient(135deg, var(--cosmic-purple) 0%, var(--cosmic-blue) 100%);
          }

          .cosmic-bg-panel {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
            backdrop-filter: blur(10px);
          }
        `}
      </style>

      {/* Top Navigation Bar - Cosmic Themed */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ 
        background: 'rgba(10, 1, 24, 0.8)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)'
      }}>
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo and Title - The Watcher */}
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" style={{ 
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))' 
              }} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold cosmic-text-glow" style={{ color: '#a78bfa' }}>
                  THE WATCHER
                </h1>
                <p className="text-xs text-purple-300 opacity-75">Gestor de Oficina</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Desktop */}
              {user && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-lg" style={{ 
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
                }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
                  }}>
                    <span className="font-bold text-sm text-white">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm text-purple-200">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs truncate text-purple-400">
                      {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="transition-all p-1 rounded text-purple-300 hover:text-purple-100"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="md:hidden p-2 rounded-lg transition-all"
                style={{ 
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
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
          <div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'rgba(10, 1, 24, 0.8)' }} onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="fixed top-0 right-0 w-80 h-full shadow-2xl z-[110]" style={{ 
            background: 'linear-gradient(135deg, rgba(26, 11, 46, 0.98) 0%, rgba(10, 1, 24, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <Eye className="w-6 h-6 text-purple-400" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))' }} />
                  <h2 className="text-lg font-bold text-purple-300">THE WATCHER</h2>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 transition-colors rounded text-purple-300 hover:bg-purple-900/20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Section */}
              {user && (
                <div className="p-4 rounded-lg border mb-6" style={{ 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
                }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)'
                    }}>
                      <span className="text-white font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-purple-200">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-purple-400">
                        {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 font-semibold text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                    }}
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

      {/* Main Content */}
      <main className={`pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 pb-6 sm:pb-8 transition-opacity duration-300 relative z-10 ${
        isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
      }`}>
        {React.cloneElement(children, { userPermissions: permissions, currentUser: user })}
      </main>
    </div>
  );
}