import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LogOut, Menu, X, Download, Sun, Moon, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/hooks/usePermissions";
import ProfileSelector from "./components/auth/ProfileSelector";

const LOGO_URL = "https://media.base44.com/images/public/69c166ad19149fb0c07883cb/18bcaeee6_Gemini_Generated_Image_nunysxnunysxnuny.png";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('watcher-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const permissions = usePermissions(user?.perfil, user?.nome_tecnico);

  const pwaBannerHeight = 48;
  const navHeight = 64;

  // ── Theme ──────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('watcher-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('watcher-theme', 'light');
    }
  }, [isDark]);

  // ── PWA ────────────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
    const handlePrompt = (e) => {
      e.preventDefault();
      if (!(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone)) {
        setDeferredPrompt(e);
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    };
    const handleInstalled = () => { setShowInstallBanner(false); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    const isBannerVisible = showInstallBanner && deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches;
    const bannerH = isBannerVisible ? pwaBannerHeight : 0;
    document.documentElement.style.setProperty('--pwa-banner-height-var', `${bannerH}px`);
    document.documentElement.style.setProperty('--nav-total-height', `${navHeight + bannerH}px`);
  }, [showInstallBanner, deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // ── Auth ───────────────────────────────────────────────
  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData && userData.perfil && userData.ativo !== false) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleLogin = (userData) => { setUser(userData); setIsAuthenticated(true); };

  const handleLogout = async () => {
    try {
      await base44.auth.updateMe({ perfil: null, nome_tecnico: null, ultimo_acesso: new Date().toISOString(), ativo: false });
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  const getUserDisplayName = () => {
    if (user?.perfil === 'admin') return 'Administrador';
    if (user?.perfil === 'tecnico' && user?.nome_tecnico)
      return user.nome_tecnico.charAt(0).toUpperCase() + user.nome_tecnico.slice(1);
    return user?.full_name || 'Utilizador';
  };

  // ── Loading screen ──────────────────────────────────────
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tech-grid" style={{ background: isDark ? '#0D0D14' : '#F2F3F7' }}>
        <div className="relative flex flex-col items-center gap-6">
          <img src={LOGO_URL} alt="Watcher" className="w-24 h-24 object-contain animate-cyber-pulse" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: '#FF2D78', borderRightColor: '#4D9FFF' }} />
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px rgba(255,45,120,0.4)' }} />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-xl tracking-widest glow-text-pink" style={{ color: '#FF2D78' }}>
              WATCHER
            </p>
            <p className="font-mono text-xs tracking-widest mt-1" style={{ color: isDark ? '#6B7090' : '#8B8FA8' }}>
              [UNIT-PINK-01] INITIALIZING...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileSelector onLogin={handleLogin} />;
  }

  const isBannerActive = showInstallBanner && deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className={`min-h-screen tech-grid ${isDark ? 'dark' : ''}`} style={{ background: isDark ? '#0D0D14' : '#F2F3F7' }}>

      {/* ── PWA Install Banner ─────────────────────────── */}
      {isBannerActive && (
        <div className="fixed top-0 left-0 right-0 z-[200] install-banner"
          style={{ height: `${pwaBannerHeight}px`, background: 'linear-gradient(135deg, #FF2D78, #9B5CF6)', boxShadow: '0 4px 20px rgba(255,45,120,0.5)' }}>
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-white animate-bounce" />
              <p className="text-white font-display font-semibold text-sm tracking-wide">Instalar WATCHER no dispositivo</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="px-4 py-1.5 bg-white text-cyber-pink rounded font-display font-bold text-sm hover:bg-pink-50 transition-colors clip-cyber-sm">
                INSTALAR
              </button>
              <button onClick={() => setShowInstallBanner(false)} className="p-1.5 text-white hover:bg-white/20 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Navigation ─────────────────────────────── */}
      <nav className="fixed left-0 right-0 z-50 transition-all duration-300"
        style={{
          top: isBannerActive ? `${pwaBannerHeight}px` : '0px',
          background: isDark
            ? 'linear-gradient(180deg, rgba(13,13,20,0.98) 0%, rgba(17,17,24,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(242,243,247,0.95) 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: isDark ? '1px solid #1E1E2E' : '1px solid #D8DAE8',
          boxShadow: isDark
            ? '0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(255,45,120,0.15)'
            : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,45,120,0.1)',
        }}>

        {/* Cyber top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #FF2D78 30%, #4D9FFF 70%, transparent 100%)' }} />

        <div className="max-w-full mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center" style={{ height: `${navHeight}px` }}>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={LOGO_URL} alt="Watcher" className="h-12 w-12 object-contain" />
                <div className="absolute inset-0 rounded-full animate-cyber-pulse pointer-events-none opacity-40"
                  style={{ boxShadow: '0 0 15px rgba(255,45,120,0.6)' }} />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl tracking-widest leading-none"
                  style={{ color: isDark ? '#FFFFFF' : '#0D0E1A' }}>
                  WATCHER
                </h1>
                <p className="font-mono text-[9px] tracking-widest leading-none mt-0.5" style={{ color: '#FF2D78' }}>
                  [UNIT-PINK-01]
                </p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">

              {/* Theme toggle */}
              <button onClick={() => setIsDark(!isDark)}
                className="p-2 rounded transition-all hover:scale-110"
                style={{
                  background: isDark ? 'rgba(255,45,120,0.1)' : 'rgba(77,159,255,0.1)',
                  border: isDark ? '1px solid rgba(255,45,120,0.3)' : '1px solid rgba(77,159,255,0.3)',
                }}>
                {isDark
                  ? <Sun className="w-4 h-4" style={{ color: '#FFB800' }} />
                  : <Moon className="w-4 h-4" style={{ color: '#4D9FFF' }} />}
              </button>

              {/* User badge — desktop */}
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded"
                  style={{
                    background: isDark ? 'rgba(255,45,120,0.08)' : 'rgba(255,45,120,0.06)',
                    border: isDark ? '1px solid rgba(255,45,120,0.2)' : '1px solid rgba(255,45,120,0.15)',
                  }}>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" style={{ color: '#FF2D78' }} />
                    <span className="font-mono text-xs tracking-wider" style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                      {user.perfil === 'admin' ? 'ADM' : 'TEC'}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                  </div>
                  <div className="w-8 h-8 clip-cyber-sm flex items-center justify-center font-display font-bold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #FF2D78, #9B5CF6)' }}>
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span className="font-display font-semibold text-sm tracking-wide" style={{ color: isDark ? '#E8E9F5' : '#0D0E1A' }}>
                    {getUserDisplayName()}
                  </span>
                  <button onClick={handleLogout} className="p-1.5 hover:bg-white/10 rounded transition-colors ml-1">
                    <LogOut className="w-4 h-4" style={{ color: isDark ? '#6B7090' : '#8B8FA8' }} />
                  </button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded transition-all"
                style={{
                  background: isDark ? 'rgba(255,45,120,0.1)' : 'rgba(255,45,120,0.08)',
                  border: '1px solid rgba(255,45,120,0.25)',
                }}>
                <Menu className="w-5 h-5" style={{ color: '#FF2D78' }} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="fixed inset-0" style={{ background: 'rgba(13,13,20,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 w-72 h-full shadow-2xl overflow-y-auto"
            style={{ background: isDark ? '#111118' : '#FFFFFF', borderLeft: '1px solid rgba(255,45,120,0.2)' }}>

            {/* Top accent */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #FF2D78, #4D9FFF)' }} />

            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <img src={LOGO_URL} alt="Watcher" className="w-8 h-8 object-contain" />
                  <span className="font-display font-bold tracking-widest" style={{ color: isDark ? '#FFFFFF' : '#0D0E1A' }}>MENU</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded transition-colors hover:bg-pink-500/10">
                  <X className="w-5 h-5" style={{ color: '#FF2D78' }} />
                </button>
              </div>

              {user && (
                <div className="p-4 rounded mb-6"
                  style={{ background: isDark ? 'rgba(255,45,120,0.08)' : 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,45,120,0.2)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 clip-cyber-sm flex items-center justify-center font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF2D78, #9B5CF6)' }}>
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-display font-bold tracking-wide" style={{ color: isDark ? '#FFFFFF' : '#0D0E1A' }}>
                        {getUserDisplayName()}
                      </p>
                      <p className="font-mono text-xs" style={{ color: '#FF2D78' }}>
                        {user.perfil === 'admin' ? '[ADMIN]' : '[TÉCNICO]'}
                      </p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                  </div>
                  <button onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded font-display font-bold tracking-wider text-sm text-white transition-all clip-cyber-sm"
                    style={{ background: 'linear-gradient(135deg, #FF2D78, #cc1f5e)' }}>
                    TERMINAR SESSÃO
                  </button>
                </div>
              )}

              {/* Theme toggle mobile */}
              <button onClick={() => setIsDark(!isDark)}
                className="w-full flex items-center gap-3 p-3 rounded mb-3 transition-all"
                style={{ background: isDark ? 'rgba(255,184,0,0.08)' : 'rgba(77,159,255,0.08)', border: isDark ? '1px solid rgba(255,184,0,0.2)' : '1px solid rgba(77,159,255,0.2)' }}>
                {isDark ? <Sun className="w-4 h-4" style={{ color: '#FFB800' }} /> : <Moon className="w-4 h-4" style={{ color: '#4D9FFF' }} />}
                <span className="font-display font-semibold tracking-wide text-sm" style={{ color: isDark ? '#FFB800' : '#4D9FFF' }}>
                  {isDark ? 'MODO CLARO' : 'MODO ESCURO'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────── */}
      <main className="px-3 sm:px-4 lg:px-6 pb-8 transition-opacity duration-300"
        style={{
          paddingTop: `${navHeight + (isBannerActive ? pwaBannerHeight : 0) + 16}px`,
          opacity: isMobileMenuOpen ? 0 : 1,
          pointerEvents: isMobileMenuOpen ? 'none' : 'auto',
        }}>
        <div className="relative z-10">
          {React.cloneElement(children, { isDark, currentUser: user, userPermissions: permissions })}
        </div>
      </main>
    </div>
  );
}
