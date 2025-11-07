import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { User, Shield, Wrench } from "lucide-react";

const PROFILES = [
  {
    id: 'admin',
    name: 'Administrador',
    icon: Shield,
    color: 'bg-red-600',
    description: 'Acesso completo ao sistema'
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    icon: Wrench,
    color: 'bg-blue-600',
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dc340a4ed_LogoGeomtricoATLAScomOlhoCircular-Photoroom.png"
              alt="ATLAS"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ATLAS</h1>
          <p className="text-gray-600">Gestor de Oficina</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecione o seu perfil</h2>

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
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${profile.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{profile.name}</h3>
                  <p className="text-sm text-gray-600">{profile.description}</p>
                </button>
              );
            })}
          </div>

          {/* Technician Selection */}
          {selectedProfile === 'tecnico' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecione o seu nome</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROFILES.find(p => p.id === 'tecnico').technicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTechnician === tech.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium text-center">{tech.name}</p>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600 text-center">
                Pode personalizar seu avatar e cores depois de entrar
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'A entrar...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}