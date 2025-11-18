import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, Zap, Upload, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function BulkCreateModal({ isOpen, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedMachines, setExtractedMachines] = useState([]);
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'creating'
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setStep('upload');
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Upload da imagem
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      // Extrair dados com IA
      const schema = {
        type: "object",
        properties: {
          machines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                modelo: { type: "string", description: "Asset type or model" },
                serie: { type: "string", description: "Serial number" },
                ano: { type: "string", description: "Production year" }
              },
              required: ["modelo", "serie"]
            }
          }
        }
      };

      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: schema,
      });

      if (extractionResult.status === 'success' && extractionResult.output?.machines) {
        const machines = extractionResult.output.machines.map(m => ({
          modelo: m.modelo,
          serie: m.serie,
          ano: m.ano ? parseInt(m.ano) : null,
          tipo: 'usada',
          estado: 'a-fazer',
          origem: 'sts'
        }));
        
        setExtractedMachines(machines);
        setStep('preview');
      } else {
        throw new Error(extractionResult.details || "Não foi possível extrair os dados da imagem.");
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setError(error.message || "Erro ao processar a imagem. Tente novamente.");
    }

    setIsProcessing(false);
  };

  const createMachines = async () => {
    if (extractedMachines.length === 0) return;
    
    setIsProcessing(true);
    setStep('creating');
    
    try {
      await base44.entities.FrotaACP.bulkCreate(extractedMachines);
      
      onSuccess(extractedMachines.length);
      handleClose();
    } catch (error) {
      console.error("Erro ao criar máquinas:", error);
      setError("Erro ao criar máquinas. Tente novamente.");
      setStep('preview');
    }
    
    setIsProcessing(false);
  };

  const removeMachine = (index) => {
    setExtractedMachines(extractedMachines.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setExtractedMachines([]);
    setStep('upload');
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Upload className="w-6 h-6" />
            Criar Máquinas em Massa com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'upload' && !selectedFile && (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 font-medium text-lg">
                Faça upload de uma imagem com a tabela de máquinas
              </p>
              <p className="text-sm text-gray-500 mb-4">
                A IA irá extrair: Modelo, Número de Série e Ano
              </p>
              <p className="text-xs text-gray-400">
                Formatos: PNG, JPG, JPEG, PDF
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {selectedFile && step === 'upload' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden shadow-md bg-gray-50 p-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={processImage} 
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-bold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Extrair Máquinas com IA
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose} className="h-12">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && extractedMachines.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-semibold">
                    {extractedMachines.length} máquinas extraídas com sucesso!
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Revise os dados abaixo antes de criar.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Modelo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Série</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ano</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {extractedMachines.map((machine, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{machine.modelo}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{machine.serie}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{machine.ano || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeMachine(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remover"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={createMachines} 
                  disabled={isProcessing || extractedMachines.length === 0}
                  className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Criar {extractedMachines.length} Máquinas
                </Button>
                <Button variant="outline" onClick={handleClose} className="h-12">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-purple-600 mb-4" />
              <p className="text-lg font-semibold text-gray-900">
                Criando {extractedMachines.length} máquinas...
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Isso pode levar alguns segundos
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}