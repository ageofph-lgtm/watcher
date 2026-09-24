import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench, Eye, EyeOff } from "lucide-react";

const ADMIN_PASSWORD = "1618";

const TECHNICIAN_PASSWORDS = {
  'raphael': '2989',
  'nuno': '3006',
  'rogerio': '3024',
  'yano': '3015'
};

const PROFILES = [
  { id: 'admin', name: 'Administrador', description: 'Acesso completo ao sistema', icon: Shield },
  { id: 'tecnico', name: 'Técnico', description: 'Gerir apenas suas próprias máquinas', icon: Wrench },
];

const TECHNICIAN_LIST = [
  { id: 'raphael', name: 'Raphael' },
  { id: 'nuno', name: 'Nuno' },
  { id: 'rogerio', name: 'Rogério' },
  { id: 'yano', name: 'Yano' }
];

const INPUT = "w-full px-4 py-3 rounded-lg bg-slate-900/70 border border-slate-600 text-slate-100 text-center tracking-[0.3em] font-mono text-lg outline-none focus:border-amber-500/60 transition";

export default function ProfileSelector({ onLogin }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!selectedProfile) { setErrorMessage("Por favor, selecione um perfil"); return; }
    if (selectedProfile === 'tecnico' && !selectedTechnician) { setErrorMessage("Por favor, selecione um técnico"); return; }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (selectedProfile === 'admin') {
        if (!password) { setErrorMessage("Por favor, insira a senha de administrador"); setIsLoading(false); return; }
        if (password !== ADMIN_PASSWORD) { setErrorMessage(`Senha incorreta! (Digitou: "${password}")`); setIsLoading(false); return; }
      }

      if (selectedProfile === 'tecnico') {
        if (!password) { setErrorMessage("Por favor, insira sua senha"); setIsLoading(false); return; }
        const correctPassword = TECHNICIAN_PASSWORDS[selectedTechnician];
        if (password !== correctPassword) { setErrorMessage(`Senha incorreta! (Digitou: "${password}")`); setIsLoading(false); return; }
      }

      const updateData = {
        perfil: selectedProfile,
        ultimo_acesso: new Date().toISOString(),
        ativo: true
      };

      if (selectedProfile === 'tecnico') {
        updateData.nome_tecnico = selectedTechnician;
      } else {
        updateData.nome_tecnico = null;
      }

      await base44.auth.updateMe(updateData);
      const user = await base44.auth.me();
      onLogin(user);
    } catch (error) {
      console.error("Erro no login:", error);
      setErrorMessage(`Erro ao fazer login: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <span className="brand-chip mb-4">WATCHER</span>
        <h1 className="page-title text-slate-100 mb-1">Oficina</h1>
        <p className="text-xs text-slate-400 tracking-widest mb-8 font-mono">SISTEMA DE GESTÃO</p>

        <div className="glass border border-slate-700 rounded-xl p-6 w-full">
          <h2 className="page-title text-slate-100 text-center mb-6">IDENTIFICAÇÃO</h2>

          {/* Profile selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedProfile === profile.id;
              return (
                <button key={profile.id} onClick={() => { setSelectedProfile(profile.id); setSelectedTechnician(null); setPassword(''); setErrorMessage(''); }}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition ${isSelected ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-700/50'}`}>
                  <Icon className="w-6 h-6" />
                  <span className="font-bold text-xs tracking-wide">{profile.name.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Technician selection */}
          {selectedProfile === 'tecnico' && (
            <div className="mb-5">
              <label className="text-xs text-slate-400 tracking-widest mb-2 block uppercase">Selecionar Técnico</label>
              <div className="grid grid-cols-2 gap-2">
                {TECHNICIAN_LIST.map((tech) => {
                  const isSelected = selectedTechnician === tech.id;
                  return (
                    <button key={tech.id} onClick={() => { setSelectedTechnician(tech.id); setPassword(''); setErrorMessage(''); }}
                      className={`py-2.5 px-3 rounded-lg text-sm font-semibold tracking-wide transition ${isSelected ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400' : 'bg-slate-800/40 border border-slate-700 text-slate-400 hover:bg-slate-700/50'}`}>
                      {tech.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Password */}
          {(selectedProfile === 'admin' || selectedTechnician) && (
            <div className="mb-5">
              <label className="text-xs text-slate-400 tracking-widest mb-2 block uppercase">Código de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••"
                  className={`${INPUT} ${errorMessage ? 'border-red-500/60' : ''} pr-10`}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-xs text-center font-mono">⚠ {errorMessage}</div>
          )}

          {/* Login */}
          <button onClick={handleLogin} disabled={isLoading || !selectedProfile}
            className="w-full py-3 rounded-lg bg-amber-500 text-slate-900 font-bold tracking-widest text-sm transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/90">
            {isLoading ? 'VERIFICANDO...' : 'ACESSAR SISTEMA'}
          </button>

          <p className="text-[10px] text-center mt-4 tracking-widest text-slate-500 font-mono">WATCHER v2.0 — SYNTROPHY SYSTEMS</p>
        </div>
      </div>
    </div>
  );
}