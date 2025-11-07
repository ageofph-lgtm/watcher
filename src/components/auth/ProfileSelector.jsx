
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Shield, Wrench } from "lucide-react";

const PROFILES = [
  {
    id: 'admin',
    name: 'Administrador',
    icon: Shield,
    color: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
    description: 'Acesso completo ao sistema'
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    icon: Wrench,
    color: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
    description: 'Gerir apenas suas próprias máquinas',
    technicians: [
      { id: 'raphael', name: 'Raphael' },
      { id: 'nuno', name: 'Nuno' },
      { id: 'rogerio', name: 'Rogério' },
      { id: 'patrick', name: 'Patrick' }
    ]
  }
];

export default function ProfileSelector({ onLogin }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedProfile) {
      alert('Por favor, selecione um perfil');
      return;
    }

    if (selectedProfile === 'tecnico' && !selectedTechnician) {
      alert('Por favor, selecione o seu nome');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        perfil: selectedProfile,
        ultimo_acesso: new Date().toISOString(),
        ativo: true
      };

      if (selectedProfile === 'tecnico') {
        updateData.nome_tecnico = selectedTechnician;
      }

      await base44.auth.updateMe(updateData);
      const user = await base44.auth.me();
      onLogin(user);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ 
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef2 50%, #f0f4f8 100%)' 
    }}>
      <style>
        {`
          :root {
            --ff-blue-primary: #0066ff;
            --ff-blue-electric: #00d4ff;
            --ff-orange-accent: #ff6b35;
            --ff-red-accent: #ff4444;
          }
        `}
      </style>
      
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c7a2cb53713f70561ad65/9bd54dd17_syn.png"
              alt="SYNAPSE"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-lg" style={{ color: '#666' }}>Gestor de Oficina</p>
        </div>

        <div className="rounded-2xl shadow-xl p-8 w-full max-w-4xl" style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1a2e' }}>Selecione o seu perfil</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isSelected = selectedProfile === profile.id;

              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    setSelectedProfile(profile.id);
                    setSelectedTechnician(null);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-transparent shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={isSelected ? {
                    background: profile.color,
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
                  } : {
                    background: 'white'
                  }}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4`} style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.2)' : profile.color
                  }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {profile.name}
                  </h3>
                  <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    {profile.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Technician Selection */}
          {selectedProfile === 'tecnico' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a1a2e' }}>Selecione o seu nome</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROFILES.find(p => p.id === 'tecnico').technicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTechnician === tech.id
                        ? 'border-transparent shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedTechnician === tech.id ? {
                      background: 'linear-gradient(135deg, var(--ff-blue-primary) 0%, var(--ff-blue-electric) 100%)',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
                    } : {
                      background: 'white'
                    }}
                  >
                    <User className={`w-6 h-6 mx-auto mb-2 ${selectedTechnician === tech.id ? 'text-white' : 'text-gray-700'}`} />
                    <p className={`text-sm font-medium text-center ${selectedTechnician === tech.id ? 'text-white' : 'text-gray-900'}`}>
                      {tech.name}
                    </p>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-center" style={{ color: '#666' }}>
                Pode personalizar seu avatar e cores depois de entrar
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 text-white rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--ff-orange-accent) 0%, var(--ff-red-accent) 100%)',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.6)')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)')}
          >
            {isLoading ? 'A entrar...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
