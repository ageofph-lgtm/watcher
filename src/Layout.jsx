import React, { useState, useEffect } from "react";
import { LogOut, Download, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ProfileSelector from "./components/auth/ProfileSelector";
import ThemeSwitcher from "./components/watcher/ThemeSwitcher";

export const LayoutUserContext = React.createContext(null);

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const saved = localStorage.getItem('watcher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.perfil) {
          setUser(parsed); setIsAuthenticated(true);
          setIsLoadingUser(false); return;
        }
      }
      const u = await base44.auth.me();
      if (u?.perfil) { setUser(u); setIsAuthenticated(true); }
      else setIsAuthenticated(false);
    } catch { setIsAuthenticated(false); }
    finally { setIsLoadingUser(false); }
  };

  const handleLogin = (u) => {
    setUser(u); setIsAuthenticated(true);
    localStorage.setItem('watcher_profile', JSON.stringify(u));
  };

  const handleLogout = async () => {
    try { await base44.auth.updateMe({ perfil: null, nome_tecnico: null, ativo: false }); } catch {}
    localStorage.removeItem('watcher_profile');
    setUser(null); setIsAuthenticated(false);
  };

  const displayName = () => {
    if (user?.perfil === 'admin') return 'ADMIN';
    if (user?.nome_tecnico) return user.nome_tecnico.toUpperCase();
    return 'USER';
  };

  // ── PWA ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    const onPrompt = (e) => {
      e.preventDefault();
      if (!window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
        setDeferredPrompt(e);
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    };
    const onInstalled = () => { setShowInstallBanner(false); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null); setShowInstallBanner(false);
  };

  // ── Cópia em texto simples ─────────────────────────────────────────────
  useEffect(() => {
    const onCopy = (e) => {
      const sel = window.getSelection()?.toString();
      if (sel && e.clipboardData) {
        e.clipboardData.setData('text/plain', sel);
        e.preventDefault();
      }
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, []);

  // ── Splash de arranque (ATLAS) ─────────────────────────────────────────
  if (isLoadingUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[rgb(var(--bg))]">
      <span className="brand-chip">WATCHER</span>
      <p className="page-title text-slate-200">Oficina</p>
      <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <ProfileSelector onLogin={handleLogin} />;

  const isBannerActive = showInstallBanner && !!deferredPrompt &&
    !window.matchMedia('(display-mode: standalone)').matches;

  return (
    <LayoutUserContext.Provider value={{ user, setUser, handleLogout, handleLogin }}>
      <div className="min-h-screen flex flex-col">

        {/* Banner de instalação PWA */}
        {isBannerActive && (
          <div className="fixed top-3 left-3 z-[95] max-w-xs">
            <div className="glass-2 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-3 text-sm">
              <Download size={15} className="text-amber-500" />
              <span className="text-slate-200 flex-1">Instalar o Watcher</span>
              <button onClick={handleInstallClick} className="bg-amber-500 text-slate-900 rounded px-3 py-1 text-xs font-bold">
                Instalar
              </button>
              <button onClick={() => setShowInstallBanner(false)} title="Fechar" className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Cluster discreto — user + tema + sair — sempre visível por cima do Hero */}
        <div className="fixed top-3 right-3 z-[95] flex items-center gap-2 glass-2 rounded-full px-3 py-1.5 border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
          <span className="hidden sm:inline text-sm text-slate-200">{displayName()}</span>
          <ThemeSwitcher compact />
          <button onClick={handleLogout} title="Sair / Trocar perfil" className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-700/50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <main className="flex-1 min-h-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </LayoutUserContext.Provider>
  );
}