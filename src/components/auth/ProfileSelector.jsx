import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench, Lock, Eye, EyeOff, Download } from "lucide-react";

const ADMIN_PASSWORD = "1618";

const TECHNICIAN_PASSWORDS = {
  'raphael': '2989',
  'nuno': '3006',
  'rogerio': '3024',
  'patrick': '3015'
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
  { id: 'patrick', name: 'Patrick' }
];

export default function ProfileSelector({ onLogin }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Capturar evento de instalação do PWA
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Verificar se já está instalado
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar se foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalado com sucesso!');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    try {
      console.log('=== INICIANDO INSTALAÇÃO DO APP ===');
      
      // 1. Limpar todo o cache e dados do site
      console.log('Passo 1: Limpando cache...');
      
      // Limpar localStorage
      localStorage.clear();
      console.log('✓ localStorage limpo');
      
      // Limpar sessionStorage
      sessionStorage.clear();
      console.log('✓ sessionStorage limpo');
      
      // Limpar cache do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Removendo cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        console.log('✓ Cache do Service Worker limpo');
      }
      
      // Desregistrar Service Workers antigos
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          console.log('Desregistrando Service Worker...');
          await registration.unregister();
        }
        console.log('✓ Service Workers desregistrados');
      }
      
      // 2. Aguardar um pouco para garantir que a limpeza foi completa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. Registrar novo Service Worker
      console.log('Passo 2: Registrando novo Service Worker...');
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('✓ Service Worker registrado');
      }
      
      // 4. Aguardar um pouco para o Service Worker ficar ativo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Mostrar prompt de instalação
      console.log('Passo 3: Mostrando prompt de instalação...');
      if (!deferredPrompt) {
        alert('Por favor, use o menu do navegador para instalar o aplicativo.\n\nNo Chrome: Menu (⋮) → "Instalar aplicativo"');
        console.log('⚠ Prompt de instalação não disponível');
        return;
      }
      
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Resultado da instalação:', outcome);
      
      if (outcome === 'accepted') {
        console.log('✓ Usuário aceitou a instalação');
        alert('App instalado com sucesso! Por favor, abra o app a partir do ícone na tela inicial.');
      } else {
        console.log('✗ Usuário recusou a instalação');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
      
      console.log('=== INSTALAÇÃO CONCLUÍDA ===');
      
    } catch (error) {
      console.error('❌ Erro durante instalação:', error);
      alert('Ocorreu um erro durante a instalação. Por favor, tente instalar manualmente através do menu do navegador.');
    }
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ 
      background: 'radial-gradient(ellipse at center, #1a0b2e 0%, #0a0118 70%, #000000 100%)'
    }}>
      {/* Cosmic background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute w-96 h-96 rounded-full" style={{ 
          top: '-10%', 
          right: '-5%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'cosmic-pulse 8s ease-in-out infinite'
        }}></div>
        <div className="absolute w-96 h-96 rounded-full" style={{ 
          bottom: '-10%', 
          left: '-5%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'cosmic-pulse 10s ease-in-out infinite',
          animationDelay: '2s'
        }}></div>
      </div>

      {/* Floating stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
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
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }

          @keyframes cosmic-pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          @keyframes glow-pulse {
            0%, 100% { 
              filter: drop-shadow(0 0 40px rgba(139, 92, 246, 1)) drop-shadow(0 0 80px rgba(139, 92, 246, 0.8));
            }
            50% { 
              filter: drop-shadow(0 0 60px rgba(139, 92, 246, 1.2)) drop-shadow(0 0 100px rgba(139, 92, 246, 1));
            }
          }

          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }
            50% { box-shadow: 0 0 40px rgba(139, 92, 246, 1); }
          }
        `}
      </style>

      <div className="w-full max-w-2xl relative z-10">
        {/* Install App Button - TOP RIGHT */}
        {showInstallButton && (
          <div className="absolute -top-16 right-0 z-20">
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                border: '1px solid rgba(139, 92, 246, 0.6)',
                color: 'white',
                animation: 'pulse-glow 2s ease-in-out infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden">Instalar</span>
            </button>
          </div>
        )}

        {/* Logo with BRIGHT Background */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <div className="absolute inset-0 flex items-center justify-center" style={{
              animation: 'float 6s ease-in-out infinite'
            }}>
              <div className="absolute w-[500px] h-[280px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'pulse 3s ease-in-out infinite'
              }}></div>
              
              <div className="absolute w-[400px] h-[220px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.8) 0%, rgba(167, 139, 250, 0.6) 40%, transparent 70%)',
                filter: 'blur(20px)',
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0.5s'
              }}></div>
              
              <div className="absolute w-[350px] h-[180px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, transparent 70%)',
                filter: 'blur(10px)'
              }}></div>
            </div>
            
            <div className="relative p-8" style={{
              animation: 'float 6s ease-in-out infinite'
            }}>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/ba40b676f_Gemini_Generated_Image_su5h17su5h17su5h-Photoroom.png"
                alt="The Watcher"
                className="w-full max-w-lg mx-auto relative z-10"
                style={{ 
                  animation: 'glow-pulse 3s ease-in-out infinite'
                }}
              />
            </div>
            
            <div className="absolute inset-0">
              <div className="absolute w-4 h-4 rounded-full bg-purple-400" style={{ 
                top: '15%', 
                left: '5%',
                boxShadow: '0 0 30px rgba(139, 92, 246, 1)',
                animation: 'twinkle 2s ease-in-out infinite'
              }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-pink-400" style={{ 
                bottom: '10%', 
                right: '10%',
                boxShadow: '0 0 25px rgba(236, 72, 153, 1)',
                animation: 'twinkle 3s ease-in-out infinite',
                animationDelay: '1s'
              }}></div>
              <div className="absolute w-3 h-3 rounded-full bg-blue-400" style={{ 
                top: '30%', 
                right: '5%',
                boxShadow: '0 0 25px rgba(59, 130, 246, 1)',
                animation: 'twinkle 2.5s ease-in-out infinite',
                animationDelay: '0.5s'
              }}></div>
            </div>
          </div>
        </div>

        {/* Profile Selection Card */}
        <div className="rounded-2xl p-8 shadow-2xl" style={{
          background: 'linear-gradient(135deg, rgba(26, 11, 46, 0.6) 0%, rgba(10, 1, 24, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 20px 80px rgba(139, 92, 246, 0.2)'
        }}>
          <h2 className="text-2xl font-bold mb-6 text-purple-200">
            Selecione o seu perfil
          </h2>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg" style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.5)'
            }}>
              <p className="text-sm font-semibold text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Profile Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PROFILES.map(profile => {
              const Icon = profile.icon;
              const isSelected = selectedProfile === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    setSelectedProfile(profile.id);
                    setSelectedTechnician(null);
                    setPassword('');
                    setErrorMessage('');
                  }}
                  className="p-6 rounded-xl transition-all text-left"
                  style={isSelected ? {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    border: '2px solid transparent',
                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
                    color: 'white',
                    transform: 'scale(1.02)'
                  } : {
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    color: '#e9d5ff'
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-lg" style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      boxShadow: isSelected ? '0 0 20px rgba(255, 255, 255, 0.3)' : 'none'
                    }}>
                      <Icon className="w-8 h-8" style={{ 
                        color: isSelected ? 'white' : profile.color 
                      }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{profile.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm" style={{ 
                    color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#c4b5fd' 
                  }}>
                    {profile.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Technician Selection */}
          {selectedProfile === 'tecnico' && (
            <div className="mb-6 p-4 rounded-xl" style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <label className="block text-sm font-semibold mb-3 text-purple-300">
                Selecione o técnico:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TECHNICIANS.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => {
                      setSelectedTechnician(tech.id);
                      setErrorMessage('');
                    }}
                    className="p-3 rounded-lg transition-all font-semibold"
                    style={selectedTechnician === tech.id ? {
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      color: 'white',
                      border: '2px solid transparent',
                      boxShadow: '0 5px 20px rgba(139, 92, 246, 0.5)'
                    } : {
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#c4b5fd',
                      border: '2px solid rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    {tech.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Password Input */}
          {(selectedProfile === 'admin' || (selectedProfile === 'tecnico' && selectedTechnician)) && (
            <div className="mb-6 p-4 rounded-xl" style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <label className="block text-sm font-semibold mb-2 text-purple-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {selectedProfile === 'admin' ? 'Senha de Administrador' : 'Senha'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Digite a senha"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all pr-12 text-lg"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#e9d5ff'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Enter Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading || !selectedProfile || (selectedProfile === 'tecnico' && !selectedTechnician)}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
              border: 'none'
            }}
          >
            {isLoading ? 'A ENTRAR...' : 'ENTRAR'}
          </button>
        </div>
      </div>
    </div>
  );
}