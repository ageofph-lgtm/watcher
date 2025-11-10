import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedProfile) return;
    if (selectedProfile === 'tecnico' && !selectedTechnician) return;

    setIsLoading(true);
    try {
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
      console.error("Login error:", error);
      alert("Erro ao fazer login. Tente novamente.");
    }
    setIsLoading(false);
  };

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
        `}
      </style>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo Grande e Destacado com tema cósmico e animação float */}
        <div className="text-center mb-12">
          <div className="inline-block p-8 rounded-3xl mb-6 relative" style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 10px 60px rgba(139, 92, 246, 0.3)',
            animation: 'float 6s ease-in-out infinite'
          }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/ba40b676f_Gemini_Generated_Image_su5h17su5h17su5h-Photoroom.png"
              alt="The Watcher"
              className="w-full max-w-lg mx-auto"
              style={{ 
                filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))'
              }}
            />
            
            {/* Orbiting particles */}
            <div className="absolute inset-0 rounded-3xl">
              <div className="absolute w-3 h-3 rounded-full bg-purple-400" style={{ 
                top: '20%', 
                left: '10%',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)',
                animation: 'twinkle 2s ease-in-out infinite'
              }}></div>
              <div className="absolute w-2 h-2 rounded-full bg-pink-400" style={{ 
                bottom: '15%', 
                right: '15%',
                boxShadow: '0 0 15px rgba(236, 72, 153, 0.8)',
                animation: 'twinkle 3s ease-in-out infinite',
                animationDelay: '1s'
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