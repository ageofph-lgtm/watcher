import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload, CheckCircle2, AlertCircle, Edit2, Trash2, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TAREFAS_PREDEFINIDAS = [
  'Preparação geral',
  'Revisão 3000h',
  'VPS',
  'EXPRESS'
];

export default function BulkCreateModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload', 'processing', 'review', 'configuring'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(null);
  const [tempTasks, setTempTasks] = useState([]);
  const [customTask, setCustomTask] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      // Upload da imagem
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      // Usar LLM para extrair dados de MÚLTIPLAS máquinas
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de uma tabela/lista de máquinas e extraia TODAS as máquinas listadas.
        
Para cada máquina, extraia:
- Asset type / Modelo (ex: FM-X17, EXV14, RX6030, etc.)
- Serial number / Número de série (ex: 511903H00533, F20323H00856, etc.)
- Production year / Ano de produção (ex: 2017, 2018, etc.)

IMPORTANTE:
- Extraia TODAS as linhas da tabela
- Mantenha os números de série EXATOS como aparecem
- Se não conseguir ler algum campo claramente, use null
- Retorne um array com todas as máquinas encontradas`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            machines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  modelo: { type: "string" },
                  serie: { type: "string" },
                  ano: { type: "number" }
                },
                required: ["modelo", "serie"]
              }
            }
          },
          required: ["machines"]
        }
      });

      if (result && result.machines && result.machines.length > 0) {
        // Adicionar campos extras e ID temporário
        const processedMachines = result.machines.map((m, idx) => ({
          tempId: `temp-${idx}`,
          modelo: m.modelo,
          serie: m.serie,
          ano: m.ano || null,
          tipo: 'usada',
          estado: 'a-fazer',
          tarefas: [],
          imageUrl: file_url
        }));
        
        setMachines(processedMachines);
        setStep('review');
      } else {
        throw new Error("Nenhuma máquina foi detectada na imagem");
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setError(error.message || "Erro ao processar imagem. Tente novamente.");
      setStep('upload');
    }
    
    setIsProcessing(false);
  };

  const handleEditMachine = (index, field, value) => {
    setMachines(machines.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const handleRemoveMachine = (index) => {
    setMachines(machines.filter((_, i) => i !== index));
  };

  const handleConfigureTasks = (index) => {
    setCurrentConfigIndex(index);
    setTempTasks(machines[index].tarefas || []);
    setCustomTask('');
    setStep('configuring');
  };

  const handleSaveTasks = () => {
    setMachines(machines.map((m, i) => 
      i === currentConfigIndex ? { ...m, tarefas: tempTasks } : m
    ));
    setCurrentConfigIndex(null);
    setTempTasks([]);
    setCustomTask('');
    setStep('review');
  };

  const handleTogglePredefinedTask = (taskText) => {
    if (tempTasks.some(t => t.texto === taskText)) {
      setTempTasks(tempTasks.filter(t => t.texto !== taskText));
    } else {
      setTempTasks([...tempTasks, { texto: taskText, concluida: false }]);
    }
  };

  const handleAddCustomTask = () => {
    if (customTask.trim()) {
      setTempTasks([...tempTasks, { texto: customTask.trim(), concluida: false }]);
      setCustomTask('');
    }
  };

  const handleCreateAll = async () => {
    if (machines.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Criar todas as máquinas em paralelo
      const createPromises = machines.map(machine => 
        base44.entities.FrotaACP.create({
          modelo: machine.modelo,
          serie: machine.serie,
          ano: machine.ano,
          tipo: machine.tipo,
          estado: machine.estado,
          tarefas: machine.tarefas,
          imageUrl: machine.imageUrl,
          origem: 'uts' // Máquinas criadas massivamente
        })
      );

      await Promise.all(createPromises);
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Erro ao criar máquinas:", error);
      setError("Erro ao criar máquinas. Algumas podem não ter sido criadas.");
    }
    
    setIsProcessing(false);
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setMachines([]);
    setError(null);
    setIsProcessing(false);
    setCurrentConfigIndex(null);
    setTempTasks([]);
    setCustomTask('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-6 h-6" />
            Criação Massiva com IA
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                onClick={() => document.getElementById('bulk-file-input').click()}
              >
                <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2 font-medium text-lg">
                  Tire foto ou faça upload de uma tabela com múltiplas máquinas
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  A IA irá extrair automaticamente todos os dados: Modelo, Série e Ano
                </p>
                <input
                  id="bulk-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  capture="environment"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain bg-gray-50"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleProcessImage}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Processar com IA
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="h-12"
                  >
                    Trocar Imagem
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-gray-700">Processando imagem com IA...</p>
            <p className="text-sm text-gray-500 mt-2">Extraindo dados de todas as máquinas</p>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-900">
                  {machines.length} máquina{machines.length !== 1 ? 's' : ''} detectada{machines.length !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-sm text-blue-700">
                Revise os dados e configure as tarefas antes de criar
              </p>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
              {machines.map((machine, index) => (
                <div key={machine.tempId} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Modelo</label>
                        <input
                          type="text"
                          value={machine.modelo}
                          onChange={(e) => handleEditMachine(index, 'modelo', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Série</label>
                        <input
                          type="text"
                          value={machine.serie}
                          onChange={(e) => handleEditMachine(index, 'serie', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Ano</label>
                        <input
                          type="number"
                          value={machine.ano || ''}
                          onChange={(e) => handleEditMachine(index, 'ano', parseInt(e.target.value) || null)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMachine(index)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Tarefas:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TAREFAS_PREDEFINIDAS.map((task, taskIdx) => (
                        <div key={taskIdx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`machine-${index}-task-${taskIdx}`}
                            checked={machine.tarefas.some(t => t.texto === task)}
                            onChange={() => {
                              const hasTarefa = machine.tarefas.some(t => t.texto === task);
                              const newTarefas = hasTarefa
                                ? machine.tarefas.filter(t => t.texto !== task)
                                : [...machine.tarefas, { texto: task, concluida: false }];
                              handleEditMachine(index, 'tarefas', newTarefas);
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <label htmlFor={`machine-${index}-task-${taskIdx}`} className="text-xs cursor-pointer">
                            {task}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAll}
                disabled={isProcessing || machines.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Criar Todas ({machines.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Configuring Step */}
        {step === 'configuring' && currentConfigIndex !== null && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">
                Configurando: {machines[currentConfigIndex].modelo} - {machines[currentConfigIndex].serie}
              </h3>
              <p className="text-sm text-gray-600">
                Selecione as tarefas que devem ser executadas nesta máquina
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-2 block">Tarefas Pré-definidas</label>
                <div className="space-y-2">
                  {TAREFAS_PREDEFINIDAS.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`task-${idx}`}
                        checked={tempTasks.some(t => t.texto === task)}
                        onChange={() => handleTogglePredefinedTask(task)}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor={`task-${idx}`} className="text-sm cursor-pointer">
                        {task}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tarefas Personalizadas</label>
                {tempTasks.filter(t => !TAREFAS_PREDEFINIDAS.includes(t.texto)).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{task.texto}</span>
                    <button
                      onClick={() => setTempTasks(tempTasks.filter(t => t.texto !== task.texto))}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="Adicionar tarefa personalizada..."
                    className="flex-1 px-3 py-2 text-sm border rounded"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTask()}
                  />
                  <Button
                    onClick={handleAddCustomTask}
                    size="sm"
                    disabled={!customTask.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('review');
                  setCurrentConfigIndex(null);
                  setTempTasks([]);
                  setCustomTask('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTasks}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvar Tarefas
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}