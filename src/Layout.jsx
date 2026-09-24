import React, { useState, useEffect } from "react";
import { LogOut, Download, X, LayoutGrid, Truck, BarChart3 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import ProfileSelector from "./components/auth/ProfileSelector";
import ThemeSwitcher from "./components/watcher/ThemeSwitcher";

export const LayoutUserContext = React.createContext(null);

const NAV_ITEMS = [
  { name: "Dashboard",  label: "Dashboard",  path: createPageUrl("Dashboard"),  icon: LayoutGrid, alsoMatch: ["/", "/Dashboard"] },
  { name: "Frota",      label: "Frota",      path: createPageUrl("Frota"),      icon: Truck,      alsoMatch: ["/Frota"] },
  { name: "Relatorios", label: "Relatórios", path: createPageUrl("Relatorios"), icon: BarChart3,  alsoMatch: ["/Relatorios"] },
];

const NavList = ({ items, isActive }) => (
  <>
    {items.map(item => {
      const Icon = item.icon;
      const active = isActive(item);
      return (
        <a
          key={item.name}
          href={item.path}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
            active
              ? "text-amber-400 bg-amber-500/10"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/40"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{item.label}</span>
        </a>
      );
    })}
  </>
);

export default function Layout({ children }) {
  const location = useLocation();
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

  const isActive = (item) => {
    const p = location.pathname;
    return p === item.path || item.alsoMatch.includes(p);
  };

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
          <div className="mx-3 mt-3">
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

        {/* Topbar */}
        <header className="glass atlas-nav border-b border-slate-700 px-4 py-2 flex items-center gap-3 relative z-50">
          <span className="brand-chip">WATCHER</span>
          <nav className="hidden lg:flex items-center gap-1">
            <NavList items={NAV_ITEMS} isActive={isActive} />
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
            <span className="hidden sm:inline text-sm text-slate-300">{displayName()}</span>
            <ThemeSwitcher compact />
            <button onClick={handleLogout} title="Sair / Trocar perfil" className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Navegação mobile */}
        <nav className="glass-2 no-scrollbar flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-slate-700 lg:hidden">
          <NavList items={NAV_ITEMS} isActive={isActive} />
          <ThemeSwitcher compact />
        </nav>

        {/* Conteúdo */}
        <main className="flex-1 min-h-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </LayoutUserContext.Provider>
  );
}