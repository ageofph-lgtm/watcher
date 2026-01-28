import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Kanban, LogOut, Menu, X, Download } from "lucide-react";
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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const permissions = usePermissions(user?.perfil, user?.nome_tecnico);

  // Constants for layout dimensions - REDUZIDO
  const pwaBannerHeight = 48; // px (reduzido de 56)
  const navHeightBase = 80; // h-20 (80px) - reduzido de 128
  const navHeightSm = 96; // sm:h-24 (96px) - reduzido de 144
  const navExtraPadding = 12; // reduzido de 16

  // PWA Installation Logic
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.error('Falha ao registrar Service Worker:', error);
        });
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      // Check if PWA is already installed or if it's an iOS standalone app
      if (!(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone)) {
        setDeferredPrompt(e);
        // Show banner automatically after 2 seconds
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 2000);
      } else {
        setDeferredPrompt(null); // Ensure it's null if already installed
        setShowInstallBanner(false);
      }
    };

    const handleAppInstalled = () => {
      console.log('PWA foi instalado com sucesso!');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Empty dependency array, runs once on mount.

  // Effect to update CSS custom properties for main padding and nav top
  useEffect(() => {
    const isBannerVisibleAndActionable = showInstallBanner && deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches;
    const currentPwaBannerHeight = isBannerVisibleAndActionable ? pwaBannerHeight : 0;
    
    document.documentElement.style.setProperty('--pwa-banner-height-var', `${currentPwaBannerHeight}px`);

    // Calculate total padding-top needed for main content
    document.documentElement.style.setProperty('--main-total-padding-top-base', 
      `${navHeightBase + navExtraPadding + currentPwaBannerHeight}px`);
    document.documentElement.style.setProperty('--main-total-padding-top-sm', 
      `${navHeightSm + navExtraPadding + currentPwaBannerHeight}px`);

  }, [showInstallBanner, deferredPrompt]);


  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);

    // Clear the prompt and hide banner
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      // CRITICAL: User must have a perfil selected to be considered authenticated
      if (userData && userData.perfil && userData.ativo !== false) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // User is logged in but has no perfil or is inactive - show profile selector
        setIsAuthenticated(false);
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

  // CRITICAL: Show ProfileSelector if not authenticated OR if user has no perfil
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
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <style>
        {`
          @import url('https://fonts.cdnfonts.com/css/segoe-ui-4');
          
          :root {
            --main-bg: #ffffff;
            --card-bg: white;
            --primary-black: #000000;
            --border-gray: #e5e7eb;
            --pwa-banner-height-var: 0px; 
            --main-total-padding-top-base: ${navHeightBase + navExtraPadding}px; 
            --main-total-padding-top-sm: ${navHeightSm + navExtraPadding}px;
          }

          * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          }

          .clip-corner {
            clip-path: polygon(
              12px 0, 
              100% 0, 
              100% calc(100% - 12px), 
              calc(100% - 12px) 100%, 
              0 100%, 
              0 12px
            );
          }

          .clip-corner-top {
            clip-path: polygon(
              12px 0, 
              calc(100% - 12px) 0,
              100% 12px,
              100% 100%,
              0 100%,
              0 12px
            );
          }

          .clip-corner-all {
            clip-path: polygon(
              12px 0,
              calc(100% - 12px) 0,
              100% 12px,
              100% calc(100% - 12px),
              calc(100% - 12px) 100%,
              12px 100%,
              0 calc(100% - 12px),
              0 12px
            );
          }

          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .install-banner {
            animation: slideDown 0.5s ease-out;
          }

          main {
            padding-top: var(--main-total-padding-top-base);
            transition: padding-top 0.3s ease-in-out; 
          }

          @media (min-width: 640px) {
            main {
              padding-top: var(--main-total-padding-top-sm);
            }
          }

          .hex-cluster {
            position: fixed;
            pointer-events: none;
            z-index: 1;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }

          .hex-nav-cluster {
            position: absolute;
            pointer-events: none;
            z-index: 1;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }
        `}
      </style>

      {/* Small Hexagon Pattern - Vinyl Style - Maiores e novas disposições */}
      <svg className="hex-cluster" viewBox="0 0 90 70" style={{ top: '140px', left: '8%', width: '65px', height: '55px' }}>
        <defs>
          <linearGradient id="vinylGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#000000', stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: '#0a0a0a', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1a1a1a', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Cluster orgânico de 4 */}
        <polygon points="20,8 35,16.66 35,34 20,42.64 5,34 5,16.66" fill="url(#vinylGrad1)" opacity="0.9"/>
        <polygon points="50,8 65,16.66 65,34 50,42.64 35,34 35,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="35,34 50,42.66 50,60 35,68.64 20,60 20,42.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="65,34 80,42.66 80,60 65,68.64 50,60 50,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 3 - Top Right */}
      <svg className="hex-cluster" viewBox="0 0 70 60" style={{ top: '160px', right: '8%', width: '55px', height: '50px' }}>
        <polygon points="20,8 35,16.66 35,34 20,42.64 5,34 5,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="50,8 65,16.66 65,34 50,42.64 35,34 35,16.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="35,34 50,42.66 50,60 35,68.64 20,60 20,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 4 em favo - Middle Left */}
      <svg className="hex-cluster" viewBox="0 0 80 80" style={{ top: '35%', left: '5%', width: '60px', height: '60px' }}>
        <polygon points="25,8 40,16.66 40,34 25,42.64 10,34 10,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="55,8 70,16.66 70,34 55,42.64 40,34 40,16.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="10,34 25,42.66 25,60 10,68.64 -5,60 -5,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
        <polygon points="40,34 55,42.66 55,60 40,68.64 25,60 25,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 3 disperso - Middle Center */}
      <svg className="hex-cluster" viewBox="0 0 60 70" style={{ top: '45%', left: '48%', width: '50px', height: '55px' }}>
        <polygon points="30,8 45,16.66 45,34 30,42.64 15,34 15,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="10,34 25,42.66 25,60 10,68.64 -5,60 -5,42.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="50,34 65,42.66 65,60 50,68.64 35,60 35,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 4 - Middle Right */}
      <svg className="hex-cluster" viewBox="0 0 80 80" style={{ top: '40%', right: '6%', width: '60px', height: '60px' }}>
        <polygon points="25,8 40,16.66 40,34 25,42.64 10,34 10,16.66" fill="url(#vinylGrad1)" opacity="0.94"/>
        <polygon points="55,8 70,16.66 70,34 55,42.64 40,34 40,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="10,34 25,42.66 25,60 10,68.64 -5,60 -5,42.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="40,34 55,42.66 55,60 40,68.64 25,60 25,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 3 - Bottom Left */}
      <svg className="hex-cluster" viewBox="0 0 70 60" style={{ bottom: '180px', left: '12%', width: '55px', height: '50px' }}>
        <polygon points="20,8 35,16.66 35,34 20,42.64 5,34 5,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="50,8 65,16.66 65,34 50,42.64 35,34 35,16.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="35,34 50,42.66 50,60 35,68.64 20,60 20,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
      </svg>

      {/* Cluster de 4 - Bottom Right */}
      <svg className="hex-cluster" viewBox="0 0 80 80" style={{ bottom: '170px', right: '10%', width: '60px', height: '60px' }}>
        <polygon points="25,8 40,16.66 40,34 25,42.64 10,34 10,16.66" fill="url(#vinylGrad1)" opacity="0.92"/>
        <polygon points="55,8 70,16.66 70,34 55,42.64 40,34 40,16.66" fill="url(#vinylGrad1)" opacity="0.88"/>
        <polygon points="10,34 25,42.66 25,60 10,68.64 -5,60 -5,42.66" fill="url(#vinylGrad1)" opacity="0.9"/>
        <polygon points="40,34 55,42.66 55,60 40,68.64 25,60 25,42.66" fill="url(#vinylGrad1)" opacity="0.92"/>
      </svg>

            {/* Cluster de 3 - Scattered 1 */}
            <svg className="hex-cluster" viewBox="0 0 70 60" style={{ top: '25%', left: '30%', width: '48px', height: '45px' }}>
              <polygon points="20,5 35,13.66 35,31 20,39.64 5,31 5,13.66" fill="url(#vinylGrad1)" opacity="0.9"/>
              <polygon points="45,18 60,26.66 60,44 45,52.64 30,44 30,26.66" fill="url(#vinylGrad1)" opacity="0.86"/>
              <polygon points="5,35 20,43.66 20,61 5,69.64 -10,61 -10,43.66" fill="url(#vinylGrad1)" opacity="0.86"/>
            </svg>

            {/* Par - Scattered 2 */}
            <svg className="hex-cluster" viewBox="0 0 60 50" style={{ top: '65%', left: '72%', width: '42px', height: '38px' }}>
              <polygon points="15,5 30,13.66 30,31 15,39.64 0,31 0,13.66" fill="url(#vinylGrad1)" opacity="0.9"/>
              <polygon points="40,5 55,13.66 55,31 40,39.64 25,31 25,13.66" fill="url(#vinylGrad1)" opacity="0.86"/>
            </svg>

            {/* Cluster de 4 - Scattered 3 */}
            <svg className="hex-cluster" viewBox="0 0 80 80" style={{ bottom: '32%', left: '40%', width: '52px', height: '52px' }}>
              <polygon points="20,5 35,13.66 35,31 20,39.64 5,31 5,13.66" fill="url(#vinylGrad1)" opacity="0.88"/>
              <polygon points="45,5 60,13.66 60,31 45,39.64 30,31 30,13.66" fill="url(#vinylGrad1)" opacity="0.92"/>
              <polygon points="20,37 35,45.66 35,63 20,71.64 5,63 5,45.66" fill="url(#vinylGrad1)" opacity="0.92"/>
              <polygon points="45,37 60,45.66 60,63 45,71.64 30,63 30,45.66" fill="url(#vinylGrad1)" opacity="0.88"/>
            </svg>

            {/* Cluster de 3 - Scattered 4 */}
            <svg className="hex-cluster" viewBox="0 0 70 60" style={{ top: '18%', left: '62%', width: '48px', height: '45px' }}>
              <polygon points="20,5 35,13.66 35,31 20,39.64 5,31 5,13.66" fill="url(#vinylGrad1)" opacity="0.9"/>
              <polygon points="45,18 60,26.66 60,44 45,52.64 30,44 30,26.66" fill="url(#vinylGrad1)" opacity="0.86"/>
              <polygon points="10,35 25,43.66 25,61 10,69.64 -5,61 -5,43.66" fill="url(#vinylGrad1)" opacity="0.86"/>
            </svg>

            {/* Par - Scattered 5 */}
            <svg className="hex-cluster" viewBox="0 0 60 50" style={{ top: '72%', left: '18%', width: '42px', height: '38px' }}>
              <polygon points="15,5 30,13.66 30,31 15,39.64 0,31 0,13.66" fill="url(#vinylGrad1)" opacity="0.88"/>
              <polygon points="40,5 55,13.66 55,31 40,39.64 25,31 25,13.66" fill="url(#vinylGrad1)" opacity="0.92"/>
            </svg>

            {/* Cluster de 3 - Scattered 6 */}
            <svg className="hex-cluster" viewBox="0 0 70 60" style={{ bottom: '38%', right: '22%', width: '48px', height: '45px' }}>
              <polygon points="20,5 35,13.66 35,31 20,39.64 5,31 5,13.66" fill="url(#vinylGrad1)" opacity="0.92"/>
              <polygon points="45,18 60,26.66 60,44 45,52.64 30,44 30,26.66" fill="url(#vinylGrad1)" opacity="0.88"/>
              <polygon points="10,35 25,43.66 25,61 10,69.64 -5,61 -5,43.66" fill="url(#vinylGrad1)" opacity="0.88"/>
            </svg>

      {/* PWA Install Banner */}
      {showInstallBanner && deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches && (
        <div className="fixed top-0 left-0 right-0 z-[200] install-banner" style={{
          height: `${pwaBannerHeight}px`,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)'
        }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-3 flex-1">
              <Download className="w-6 h-6 text-white animate-bounce" />
              <div className="flex-1">
                <p className="text-white font-bold text-sm sm:text-base">
                  Instale The Watcher no seu dispositivo
                </p>
                <p className="text-white/80 text-xs hidden sm:block">
                  Acesso mais rápido e experiência completa de aplicativo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar - NEW WHITE DESIGN */}
      <nav 
        className="fixed left-0 right-0 z-50 border-b transition-all duration-300 ease-in-out relative overflow-hidden" 
        style={{ 
          top: (showInstallBanner && deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) 
               ? `--pwa-banner-height-var` 
               : '0px',
          background: 'white',
          borderColor: '#e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Nav Hexagon Cluster - Estilo Fundação Futuro - Responsivo */}
        <svg className="hex-nav-cluster hidden sm:block" viewBox="0 0 100 60" style={{ top: '8px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '45px' }}>
          <defs>
            <linearGradient id="vinylGradNav" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#000000', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#0a0a0a', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1a1a1a', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Padrão orgânico tipo favo */}
          <polygon points="25,8 37,14.66 37,28 25,34.64 13,28 13,14.66" fill="url(#vinylGradNav)" opacity="0.92"/>
          <polygon points="50,8 62,14.66 62,28 50,34.64 38,28 38,14.66" fill="url(#vinylGradNav)" opacity="0.94"/>
          <polygon points="75,8 87,14.66 87,28 75,34.64 63,28 63,14.66" fill="url(#vinylGradNav)" opacity="0.92"/>
          <polygon points="37,28 49,34.66 49,48 37,54.64 25,48 25,34.66" fill="url(#vinylGradNav)" opacity="0.9"/>
          <polygon points="62,28 74,34.66 74,48 62,54.64 50,48 50,34.66" fill="url(#vinylGradNav)" opacity="0.9"/>
        </svg>

        {/* Versão Mobile - Menor e compacto */}
        <svg className="hex-nav-cluster block sm:hidden" viewBox="0 0 70 40" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)', width: '45px', height: '28px' }}>
          {/* Cluster compacto de 3 hexágonos */}
          <polygon points="15,5 25,11 25,23 15,29 5,23 5,11" fill="url(#vinylGradNav)" opacity="0.92"/>
          <polygon points="35,5 45,11 45,23 35,29 25,23 25,11" fill="url(#vinylGradNav)" opacity="0.94"/>
          <polygon points="55,5 65,11 65,23 55,29 45,23 45,11" fill="url(#vinylGradNav)" opacity="0.92"/>
        </svg>
        <div className="max-w-full mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Container - NEW MINIMALIST */}
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/b510ac39b_image.png" 
                alt="Watcher Logo" 
                className="h-14 w-14 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-black">WATCHER</h1>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      {user.perfil === 'admin' ? 'ADMINISTRADOR' : 'TÉCNICO'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center">
                    <span className="font-bold text-sm text-white">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}

              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'rgba(10, 1, 24, 0.8)' }} onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="fixed top-0 right-0 w-80 h-full shadow-2xl z-[110] bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold text-black">MENU</h2>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 transition-colors rounded hover:bg-gray-100"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              {/* Mobile User Section */}
              {user && (
                <div className="p-4 rounded-lg border mb-6 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-black flex items-center justify-center">
                      <span className="text-white font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-black">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 font-semibold bg-black text-white hover:bg-gray-800"
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
      <main className={`px-3 sm:px-4 lg:px-8 pb-6 sm:pb-8 transition-opacity duration-300 relative ${
        isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
      }`} style={{ background: '#ffffff' }}>
        <div className="relative z-10">
          {React.cloneElement(children, { userPermissions: permissions, currentUser: user })}
        </div>
      </main>
    </div>
  );
}