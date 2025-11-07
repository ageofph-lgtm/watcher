
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
}];


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
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8eef2 0%, #d4dde5 50%, #e8eef2 100%)' }}>
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4" style={{ borderColor: '#00d4ff' }}></div>
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)' }}></div>
        </div>
        <p className="mt-6 text-xl font-bold tracking-wider" style={{ color: '#0066ff', textShadow: '0 0 20px rgba(0, 102, 255, 0.6)' }}>
          A CARREGAR SYNAPSE...
        </p>
      </div>);

  }

  if (!isAuthenticated) {
    return <ProfileSelector onLogin={handleLogin} />;
  }

  const getPageTitle = () => {
    switch (currentPageName) {
      case 'Dashboard':return 'PAINEL DA OFICINA';
      default:return currentPageName?.toUpperCase() || 'SYNAPSE';
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef2 50%, #f0f4f8 100%)' }}>
      <style>
        {`
          @import url('https://fonts.cdnfonts.com/css/segoe-ui-4');
          
          :root {
            /* Quarteto Fantástico Color Palette */
            --ff-blue-primary: #0066ff;
            --ff-blue-electric: #00d4ff;
            --ff-orange-accent: #ff6b35;
            --ff-red-accent: #ff4444;
            --ff-silver-light: #e8eef2;
            --ff-white: #ffffff;
            --ff-gray-dark: #1a1a2e;
            --ff-gray-medium: #2d3142;
            --ff-black: #0a0a0f;
            --ff-light-bg: #f0f4f8;
          }
          
          * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          /* Retro-futuristic glow effects */
          .ff-glow-blue {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 102, 255, 0.3);
          }

          .ff-glow-orange {
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 68, 68, 0.3);
          }

          .ff-text-glow-blue {
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 102, 255, 0.5);
          }

          .ff-border-glow {
            border: 2px solid var(--ff-blue-electric);
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.6), inset 0 0 10px rgba(0, 212, 255, 0.2);
          }

          /* Gradient backgrounds */
          .ff-bg-primary {
            background: linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%);
          }

          .ff-bg-panel {
            background: linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%);
            backdrop-filter: blur(10px);
          }
        `}
      </style>

      {/* Top Navigation Bar - FF4 Themed */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{
        background: '#e8eef2',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="bg-[#ffffff] flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo Centralizado - MAIOR */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/db635285b_Semttulo.png"
                alt="SYNAPSE"
                className="h-12 sm:h-16 object-contain" />

            </div>

            {/* Spacer Left */}
            <div className="flex-1"></div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Desktop */}
              {user &&
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-lg" style={{
                background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
              }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                  background: 'var(--ff-orange-accent)',
                  boxShadow: '0 0 10px rgba(255, 107, 53, 0.6)'
                }}>
                    <span className="text-white font-bold text-sm">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-sm">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                    </p>
                  </div>
                  <button
                  onClick={handleLogout}
                  className="transition-all p-1 rounded hover:bg-white/20"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}>

                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              }

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg transition-all"
                style={{
                  background: 'rgba(0, 212, 255, 0.1)',
                  color: 'var(--ff-blue-electric)',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>

                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen &&
      <div className="fixed inset-0 z-[100] md:hidden">
          <div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'rgba(0, 0, 0, 0.3)' }} onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="fixed top-0 right-0 w-80 h-full shadow-2xl z-[110]" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #e8eef2 100%)',
          borderLeft: '1px solid rgba(0, 212, 255, 0.3)'
        }}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                  <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/db635285b_Semttulo.png"
                  alt="SYNAPSE"
                  className="h-8 object-contain" />

                </div>
                <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 transition-colors rounded hover:bg-gray-100"
                style={{ color: 'var(--ff-blue-primary)' }}>

                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile User Section */}
              {user &&
            <div className="p-4 rounded-lg border mb-6" style={{
              background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
              borderColor: 'rgba(0, 212, 255, 0.5)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
            }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                  background: 'var(--ff-orange-accent)',
                  boxShadow: '0 0 10px rgba(255, 107, 53, 0.6)'
                }}>
                      <span className="text-white font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                      </p>
                    </div>
                  </div>
                  <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 font-semibold"
                style={{
                  background: 'var(--ff-orange-accent)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
                }}>

                    <LogOut className="w-4 h-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
            }
            </div>
          </div>
        </div>
      }

      {/* Main Content */}
      <main className={`pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 pb-6 sm:pb-8 transition-opacity duration-300 ${
      isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`
      }>
        {React.cloneElement(children, { userPermissions: permissions, currentUser: user })}
      </main>
    </div>);

}