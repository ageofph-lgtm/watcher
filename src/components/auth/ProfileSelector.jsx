
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench, Lock, Eye, EyeOff } from "lucide-react";

const ADMIN_PASSWORD = "1618";

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log("User not loaded:", error);
        // This is expected if the user isn't logged in or has no 'me' record
      }
    };
    loadUser();
  }, []);

  const handleLogin = async () => {
    if (!selectedProfile) return;
    if (selectedProfile === 'tecnico' && !selectedTechnician) return;

    setIsLoading(true);
    try {
      // Admin login - verificar senha
      if (selectedProfile === 'admin') {
        if (!password) {
          alert("Por favor, insira a senha de administrador.");
          setIsLoading(false);
          return;
        }
        
        if (password !== ADMIN_PASSWORD) {
          alert("Senha incorreta!");
          setIsLoading(false);
          return;
        }
      }
      
      // Técnico login
      if (selectedProfile === 'tecnico') {
        // Find the selected technician from the TECHNICIANS array based on selectedTechnician ID
        const currentTechUser = TECHNICIANS.find(tech => tech.id === selectedTechnician);

        // This assumes that `currentUser` will reflect the currently logged-in user, not the selected technician from the list.
        // For password management per technician, you'd typically have `currentUser` representing the *actual* user trying to log in,
        // and its `senha_definida` property would be relevant.
        // However, based on the prompt's logic (currentUser?.senha_definida), it implies the `me()` endpoint will return the specific technician's data.
        // If 'me' only returns a generic user, and passwords are per technician, this logic needs adjustment (e.g., fetch technician details from DB).
        // For now, I'm assuming `currentUser` fetched from `base44.auth.me()` *is* the technician being logged in, which is a simplification based on prompt.

        // Simulating `currentUser` having technician-specific data for initial password setup
        // In a real app, `base44.auth.me()` would probably return the user corresponding to the selected technician.
        const isSelectedTechnicianPasswordSet = currentUser?.perfil === 'tecnico' && currentUser?.nome_tecnico === selectedTechnician && currentUser?.senha_definida;

        if (isSelectedTechnicianPasswordSet) {
          // Login com senha existente
          if (!password) {
            alert("Por favor, insira sua senha.");
            setIsLoading(false);
            return;
          }
          
          if (currentUser.senha !== password) { // Assuming currentUser.senha holds the technician's password
            alert("Senha incorreta!");
            setIsLoading(false);
            return;
          }
        } else {
          // Primeira vez - criar senha para este técnico
          if (!password || !confirmPassword) {
            alert("Por favor, crie sua senha.");
            setIsLoading(false);
            return;
          }
          
          if (password !== confirmPassword) {
            alert("As senhas não coincidem!");
            setIsLoading(false);
            return;
          }
          
          if (password.length < 4) {
            alert("A senha deve ter pelo menos 4 caracteres.");
            setIsLoading(false);
            return;
          }
        }
      }

      const updateData = {
        perfil: selectedProfile,
        ultimo_acesso: new Date().toISOString(),
        ativo: true
      };

      if (selectedProfile === 'tecnico') {
        updateData.nome_tecnico = selectedTechnician;
        
        // If it's the first time setting password for this technician
        const isSelectedTechnicianPasswordSet = currentUser?.perfil === 'tecnico' && currentUser?.nome_tecnico === selectedTechnician && currentUser?.senha_definida;

        if (!isSelectedTechnicianPasswordSet) {
          updateData.senha = password;
          updateData.senha_definida = true;
        }
      } else {
        updateData.nome_tecnico = null;
        // When switching from tecnico to admin, clear previous password data if it was set
        // Or if admin profile doesn't need to persist technician-specific password data.
        // For this specific case, we just set nome_tecnico to null.
      }

      await base44.auth.updateMe(updateData);
      const user = await base44.auth.me(); // Fetch the updated user data
      onLogin(user);
    } catch (error) {
      console.error("Login error:", error);
      alert("Erro ao fazer login. Tente novamente.");
    }
    setIsLoading(false);
  };

  // Determine if a technician is creating a password for the first time
  useEffect(() => {
    if (selectedProfile === 'tecnico' && selectedTechnician) {
        // This condition assumes `currentUser` already reflects the technician attempting to log in.
        // In a more robust system, you might fetch specific technician details here.
        const isTechnicianLoggedIn = currentUser?.perfil === 'tecnico' && currentUser?.nome_tecnico === selectedTechnician;
        setIsCreatingPassword(isTechnicianLoggedIn && !currentUser?.senha_definida);
    } else {
      setIsCreatingPassword(false);
    }
    // Also reset passwords when technician or profile selection changes
    setPassword('');
    setConfirmPassword('');
  }, [selectedProfile, selectedTechnician, currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ 
      background: 'radial-gradient(ellipse at center, #1a0b2e 0%, #0a0118 70%, #000000 100%)'
    }}>
      {/* Cosmic animated background */}
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
        `}
      </style>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo with BRIGHT Background - Enhanced Visibility */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            {/* Multiple layered glowing backgrounds for maximum visibility */}
            <div className="absolute inset-0 flex items-center justify-center" style={{
              animation: 'float 6s ease-in-out infinite'
            }}>
              {/* Outer glow */}
              <div className="absolute w-[500px] h-[280px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'pulse 3s ease-in-out infinite'
              }}></div>
              
              {/* Mid glow - brighter */}
              <div className="absolute w-[400px] h-[220px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.8) 0%, rgba(167, 139, 250, 0.6) 40%, transparent 70%)',
                filter: 'blur(20px)',
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0.5s'
              }}></div>
              
              {/* Inner glow - brightest */}
              <div className="absolute w-[350px] h-[180px] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.7) 50%, transparent 70%)',
                filter: 'blur(10px)'
              }}></div>
            </div>
            
            {/* Logo with enhanced effects */}
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
            
            {/* Orbiting particles - more prominent */}
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
                    setConfirmPassword('');
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
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                      e.currentTarget.style.boxShadow = '0 5px 30px rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
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
                    onClick={() => setSelectedTechnician(tech.id)}
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
                    onMouseEnter={(e) => {
                      if (selectedTechnician !== tech.id) {
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTechnician !== tech.id) {
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      }
                    }}
                  >
                    {tech.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Password Input - Admin */}
          {selectedProfile === 'admin' && (
            <div className="mb-6 p-4 rounded-xl" style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <label className="block text-sm font-semibold mb-2 text-purple-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all pr-12"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#e9d5ff'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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

          {/* Password Input - Técnico */}
          {selectedProfile === 'tecnico' && selectedTechnician && (
            <div className="mb-6 p-4 rounded-xl" style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              {isCreatingPassword ? (
                <>
                  <p className="text-sm text-purple-300 mb-4">
                    É a sua primeira vez! Por favor, crie uma senha para aceder ao sistema.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-300 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Criar Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha"
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all pr-12"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#e9d5ff'
                          }}
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

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-300 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Digite novamente"
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all pr-12"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#e9d5ff'
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-semibold mb-2 text-purple-300 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all pr-12"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#e9d5ff'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Enter Button */}
          <button
            onClick={handleLogin}
            disabled={
              isLoading || 
              !selectedProfile || 
              (selectedProfile === 'tecnico' && !selectedTechnician) ||
              (selectedProfile === 'admin' && !password) ||
              (selectedProfile === 'tecnico' && selectedTechnician && isCreatingPassword && (!password || !confirmPassword || password !== confirmPassword || password.length < 4)) ||
              (selectedProfile === 'tecnico' && selectedTechnician && !isCreatingPassword && !password)
            }
            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && selectedProfile && (selectedProfile !== 'tecnico' || selectedTechnician)) {
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(139, 92, 246, 0.7)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(139, 92, 246, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? 'A ENTRAR...' : 'ENTRAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
