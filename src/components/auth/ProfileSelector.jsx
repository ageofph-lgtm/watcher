import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Wrench } from "lucide-react";

const PROFILES = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    icon: Shield,
    color: '#ff6b35'
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    description: 'Gerir apenas suas próprias máquinas',
    icon: Wrench,
    color: '#00d4ff'
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
      background: 'white'
    }}>
      <div className="w-full max-w-2xl">
        {/* Logo Grande e Destacado */}
        <div className="text-center mb-12">
          <div className="inline-block p-8 rounded-3xl mb-6" style={{
            background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%)',
            border: '2px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 212, 255, 0.15)'
          }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/9bd54dd17_syn.png"
              alt="SYNAPSE"
              className="w-48 h-48 object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))' }}
            />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ 
            color: '#0066ff',
            textShadow: '0 0 30px rgba(0, 212, 255, 0.3)'
          }}>
            SYNAPSE
          </h1>
          <p className="text-xl" style={{ color: '#666' }}>Gestor de Oficina</p>
        </div>

        {/* Profile Selection Card */}
        <div className="rounded-2xl p-8 shadow-2xl" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(232, 238, 242, 0.95) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 102, 255, 0.1)'
        }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1a2e' }}>
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
                    background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                    border: '2px solid transparent',
                    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.4)',
                    color: 'white',
                    transform: 'scale(1.02)'
                  } : {
                    background: 'white',
                    border: '2px solid rgba(0, 212, 255, 0.2)',
                    color: '#1a1a2e'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                      e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 212, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 rounded-lg" style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 212, 255, 0.1)'
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
                    color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#666' 
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
              background: 'rgba(0, 212, 255, 0.05)',
              border: '1px solid rgba(0, 212, 255, 0.2)'
            }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#0066ff' }}>
                Selecione o técnico:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TECHNICIANS.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech.id)}
                    className="p-3 rounded-lg transition-all font-semibold"
                    style={selectedTechnician === tech.id ? {
                      background: 'var(--ff-blue-electric)',
                      color: 'white',
                      border: '2px solid var(--ff-blue-electric)',
                      boxShadow: '0 5px 15px rgba(0, 212, 255, 0.4)'
                    } : {
                      background: 'white',
                      color: '#666',
                      border: '2px solid rgba(0, 212, 255, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTechnician !== tech.id) {
                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTechnician !== tech.id) {
                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
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
            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && selectedProfile && (selectedProfile !== 'tecnico' || selectedTechnician)) {
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 107, 53, 0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)';
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