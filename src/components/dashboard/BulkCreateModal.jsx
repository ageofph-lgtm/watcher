import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calcTempoEstimado } from "../../lib/countdown";
import BulkMachineCard from "./BulkMachineCard";

export default function BulkCreateModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload', 'processing', 'review'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Estás a analisar uma fotografia de uma tabela, lista ou documento com VÁRIAS máquinas industriais (empilhadores STILL: modelos como RX20-16, RX60-30, EXV14, EXU20, FM-X17, OPX20, LTX50, SXH20, ECU15, etc.).

Extrai TODAS as linhas/máquinas visíveis. Para cada máquina:

1. "modelo" — a designação do modelo (coluna "Asset type", "Type", "Modelo" ou similar). Mantém o formato exato (ex: FM-X17, RX20-16, EXV14).

2. "serie" — o número de série COMPLETO (coluna "Serial number", "Serial No", "Nº série" ou similar). Os números de série STILL têm tipicamente 11-12 caracteres alfanuméricos (ex: 511903H00533, F20323H00856, W40188H01234).
   CRÍTICO — lê carácter a carácter com máxima atenção:
   - Distingue 0 (zero) de O (letra O)
   - Distingue 1 (um) de I e de l
   - Distingue 5 de S, 8 de B, 2 de Z, 6 de G
   - NÃO omitas nem acrescentes caracteres
   - NÃO "corrijas" nem normalizes o número — copia-o EXATAMENTE como está escrito
   - Verifica cada série duas vezes antes de a devolver

3. "ano" — ano de produção (coluna "Production year", "Year", "Ano"), como número (ex: 2017). Se não existir, null.

REGRAS:
- Extrai TODAS as linhas da tabela, sem saltar nenhuma
- Se um campo estiver ilegível ou não existir, devolve null nesse campo (nunca inventes)
- Ignora linhas de cabeçalho ou totais`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            machines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  modelo: { type: ["string", "null"] },
                  serie: { type: ["string", "null"] },
                  ano: { type: ["number", "null"] }
                },
                required: ["serie"]
              }
            }
          },
          required: ["machines"]
        }
      });

      const found = (result?.machines || []).filter(m => m.serie);
      if (found.length > 0) {
        const processedMachines = found.map((m, idx) => ({
          tempId: `temp-${idx}`,
          modelo: m.modelo || '',
          serie: String(m.serie).trim().toUpperCase(),
          ano: m.ano || null,
          tipo: 'usada',
          estado: 'a-fazer',
          tarefas: [],
          recondicao: { ferro: false, bronze: false, prata: false, ouro: false },
          isExpress: false,
          isVps: false,
          prioridade: false,
          previsao_inicio: '',
          previsao_fim: '',
          imageUrl: file_url
        }));

        setMachines(processedMachines);
        setStep('review');
      } else {
        throw new Error("Nenhuma máquina foi detectada na imagem. Tente uma foto mais nítida e bem enquadrada.");
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

  const handleCreateAll = async () => {
    if (machines.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const createPromises = machines.map(machine =>
        base44.entities.FrotaACP.create({
          modelo: machine.modelo,
          serie: machine.serie,
          ano: machine.ano ? String(machine.ano) : null,
          tipo: machine.tipo,
          estado: machine.estado,
          tarefas: machine.tarefas,
          recondicao: machine.recondicao,
          isExpress: machine.isExpress,
          isVps: machine.isVps,
          prioridade: machine.prioridade,
          previsao_inicio: machine.previsao_inicio || null,
          previsao_fim: machine.previsao_fim || null,
          tempo_estimado_segundos: calcTempoEstimado({
            tarefas: machine.tarefas,
            isExpress: machine.isExpress,
            isVps: machine.isVps,
            recondicao: machine.recondicao,
            modelo: machine.modelo,
          }) || null,
          imprevistos: [],
          imageUrl: machine.imageUrl
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
                Confirme os números de série contra o documento original e configure cada máquina antes de criar
              </p>
            </div>

            <div className="max-h-[440px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-gray-50">
              {machines.map((machine, index) => (
                <BulkMachineCard
                  key={machine.tempId}
                  machine={machine}
                  onChange={(field, value) => handleEditMachine(index, field, value)}
                  onRemove={() => handleRemoveMachine(index)}
                />
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
      </DialogContent>
    </Dialog>
  );
}