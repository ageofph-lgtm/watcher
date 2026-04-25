import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench, Lock, Eye, EyeOff } from "lucide-react";

const ADMIN_PASSWORD = "1618";

const TECHNICIAN_PASSWORDS = {
  'raphael': '2989',
  'nuno': '3006',
  'rogerio': '3024',
  'yano': '3015'
};

const PROFILES = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    icon: Shield,
    color: '#8b5cf6'
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    description: 'Gerir apenas suas próprias máquinas',
    icon: Wrench,
    color: '#ec4899'
  }
];

const TECHNICIANS = [
  { id: 'raphael', name: 'Raphael' },
  { id: 'nuno', name: 'Nuno' },
  { id: 'rogerio', name: 'Rogério' },
  { id: 'yano', name: 'Yano' }
];

export default function ProfileSelector({ onLogin }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!selectedProfile) {
      setErrorMessage("Por favor, selecione um perfil");
      return;
    }
    if (selectedProfile === 'tecnico' && !selectedTechnician) {
      setErrorMessage("Por favor, selecione um técnico");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('=== INÍCIO DO LOGIN ===');
      console.log('Perfil selecionado:', selectedProfile);
      console.log('Técnico selecionado:', selectedTechnician);
      console.log('Senha digitada:', password);
      
      // Verificar senha ANTES de atualizar
      if (selectedProfile === 'admin') {
        if (!password) {
          setErrorMessage("Por favor, insira a senha de administrador");
          setIsLoading(false);
          return;
        }
        
        console.log('Verificando senha de admin...');
        console.log('Senha esperada:', ADMIN_PASSWORD);
        console.log('Senha recebida:', password);
        console.log('Senhas são iguais?', password === ADMIN_PASSWORD);
        
        if (password !== ADMIN_PASSWORD) {
          setErrorMessage(`Senha incorreta! (Digitou: "${password}")`);
          setIsLoading(false);
          return;
        }
        console.log('✓ Senha de admin correta');
      }
      
      if (selectedProfile === 'tecnico') {
        if (!password) {
          setErrorMessage("Por favor, insira sua senha");
          setIsLoading(false);
          return;
        }
        
        const correctPassword = TECHNICIAN_PASSWORDS[selectedTechnician];
        console.log('Verificando senha de técnico...');
        console.log('Senha esperada:', correctPassword);
        console.log('Senha recebida:', password);
        console.log('Senhas são iguais?', password === correctPassword);
        
        if (password !== correctPassword) {
          setErrorMessage(`Senha incorreta! (Digitou: "${password}")`);
          setIsLoading(false);
          return;
        }
        console.log('✓ Senha de técnico correta');
      }

      // Senha correta - atualizar dados do usuário
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

      console.log('Atualizando usuário com dados:', updateData);
      await base44.auth.updateMe(updateData);
      console.log('✓ Usuário atualizado com sucesso');
      
      console.log('Buscando dados atualizados do usuário...');
      const user = await base44.auth.me();
      console.log('✓ Dados do usuário recebidos:', user);
      
      console.log('Chamando onLogin...');
      onLogin(user);
      console.log('=== LOGIN CONCLUÍDO ===');
      
    } catch (error) {
      console.error("❌ ERRO NO LOGIN:", error);
      console.error("Detalhes do erro:", error.message);
      console.error("Stack:", error.stack);
      setErrorMessage(`Erro ao fazer login: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 tech-grid" 
      style={{ background: 'linear-gradient(160deg, #0D0D14 0%, #0a0a18 50%, #0D0D14 100%)' }}>
      
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF2D78, transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #4D9FFF, transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-4">
            <img src="https://media.base44.com/images/public/69c166ad19149fb0c07883cb/18bcaeee6_Gemini_Generated_Image_nunysxnunysxnuny.png" alt="Watcher" className="w-28 h-28 object-contain mx-auto animate-cyber-pulse" />
          </div>
          <h1 className="font-display font-bold text-4xl tracking-widest mb-1" style={{ color: '#FFFFFF' }}>
            WATCHER
          </h1>
          <p className="font-mono text-xs tracking-widest" style={{ color: '#FF2D78' }}>
            [UNIT-PINK-01] — SISTEMA DE OFICINA
          </p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, #111118 0%, #13131e 100%)', border: '1px solid #1E1E2E', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,45,120,0.08)' }}>
          
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #FF2D78 40%, #4D9FFF 60%, transparent)' }} />

          <h2 className="font-display font-bold text-lg tracking-widest mb-6 text-center" style={{ color: '#E8E9F5' }}>
            IDENTIFICAÇÃO
          </h2>

          {/* Profile selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedProfile === profile.id;
              return (
                <button key={profile.id} onClick={() => { setSelectedProfile(profile.id); setSelectedTechnician(null); setPassword(''); setErrorMessage(''); }}
                  className="relative p-4 rounded transition-all duration-200 flex flex-col items-center gap-2 group"
                  style={{
                    background: isSelected ? `${profile.color}18` : 'rgba(255,255,255,0.03)',
                    border: isSelected ? `1px solid ${profile.color}60` : '1px solid #1E1E2E',
                    boxShadow: isSelected ? `0 0 20px ${profile.color}30` : 'none',
                  }}>
                  <Icon className="w-6 h-6 transition-all" style={{ color: isSelected ? profile.color : '#6B7090' }} />
                  <span className="font-display font-bold text-xs tracking-wider"
                    style={{ color: isSelected ? '#E8E9F5' : '#6B7090' }}>
                    {profile.name.toUpperCase()}
                  </span>
                  {isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                      style={{ background: profile.color }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Technician selection */}
          {selectedProfile === 'tecnico' && (
            <div className="mb-5">
              <label className="font-mono text-xs tracking-widest mb-2 block" style={{ color: '#6B7090' }}>
                SELECIONAR TÉCNICO
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TECHNICIANS.map((tech) => {
                  const isSelected = selectedTechnician === tech.id;
                  return (
                    <button key={tech.id} onClick={() => { setSelectedTechnician(tech.id); setPassword(''); setErrorMessage(''); }}
                      className="py-2.5 px-3 rounded text-sm font-display font-semibold tracking-wide transition-all"
                      style={{
                        background: isSelected ? 'rgba(255,45,120,0.15)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid rgba(255,45,120,0.5)' : '1px solid #1E1E2E',
                        color: isSelected ? '#FF2D78' : '#6B7090',
                        boxShadow: isSelected ? '0 0 12px rgba(255,45,120,0.25)' : 'none',
                      }}>
                      {tech.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Password field */}
          {(selectedProfile === 'admin' || selectedTechnician) && (
            <div className="mb-5">
              <label className="font-mono text-xs tracking-widest mb-2 block" style={{ color: '#6B7090' }}>
                CÓDIGO DE ACESSO
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••"
                  className="w-full px-4 py-3 pr-10 rounded font-mono tracking-[0.3em] text-center text-lg outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: errorMessage ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,45,120,0.25)',
                    color: '#E8E9F5',
                    boxShadow: errorMessage ? '0 0 12px rgba(239,68,68,0.2)' : '0 0 12px rgba(255,45,120,0.1)',
                  }}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: '#6B7090' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 px-3 py-2 rounded font-mono text-xs text-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
              ⚠ {errorMessage}
            </div>
          )}

          {/* Login button */}
          <button onClick={handleLogin} disabled={isLoading || !selectedProfile}
            className="w-full py-3 rounded font-display font-bold tracking-widest text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed clip-cyber-sm"
            style={{
              background: isLoading
                ? 'rgba(255,45,120,0.4)'
                : 'linear-gradient(135deg, #FF2D78 0%, #cc1f5e 100%)',
              boxShadow: isLoading ? 'none' : '0 0 20px rgba(255,45,120,0.35)',
            }}>
            {isLoading ? 'VERIFICANDO...' : 'ACESSAR SISTEMA'}
          </button>

          {/* Bottom tag */}
          <p className="font-mono text-[10px] text-center mt-4 tracking-widest" style={{ color: '#2A2A3E' }}>
            WATCHER v2.0 — SYNTROPHY SYSTEMS
          </p>
        </div>
      </div>
    </div>
  );
}
