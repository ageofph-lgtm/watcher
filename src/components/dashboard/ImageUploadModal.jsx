import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertCircle, Zap, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ImageUploadModal({ isOpen, onClose, onSuccess, onMachineDetected, purpose = 'create' }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setRetryCount(0);
    }
  };

  const processImage = async (isRetry = false) => {
    if (!selectedFile) return;

    if (!isRetry) {
      setRetryCount(0);
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: getPrompt(),
        file_urls: [file_url],
        response_json_schema: getSchema(),
      });

      if (result && (result.serie || result.modelo)) {
        const extractedData = {
          ...result,
          serie: result.serie ? String(result.serie).trim().toUpperCase() : '',
        };
        if (purpose === 'create' && extractedData.ano) {
           extractedData.ano = !isNaN(parseInt(extractedData.ano)) ? parseInt(extractedData.ano) : '';
        }
        extractedData.imageUrl = file_url;
        const cb = onMachineDetected || onSuccess;
        cb(extractedData);
        handleClose();
      } else {
        throw new Error("Não foi possível ler os dados da placa. Tente uma foto mais nítida.");
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      let errorMessage = "Não foi possível processar a imagem. Tente novamente ou use a entrada manual.";
      if (error.message?.includes('timeout') || error.message?.includes('DatabaseTimeout')) {
        errorMessage = "O processamento demorou muito. Tente com uma imagem menor ou use a entrada manual.";
      }
      setError(errorMessage);
    }

    setIsProcessing(false);
  };

  const getPrompt = () => {
    const serieRules = `O "serie" (número de série) é o campo MAIS IMPORTANTE. Nas placas STILL aparece junto a "Serial No.", "Fabrik-Nr.", "S/N" ou "Serien-Nr." e tem tipicamente 11-12 caracteres alfanuméricos (ex: 511903H00533, F20323H00856, W40188H01234).
CRÍTICO — lê carácter a carácter com máxima atenção:
- Distingue 0 (zero) de O (letra O)
- Distingue 1 (um) de I e de l
- Distingue 5 de S, 8 de B, 2 de Z, 6 de G
- NÃO omitas nem acrescentes caracteres
- NÃO "corrijas" nem normalizes o número — copia-o EXATAMENTE como está gravado
- Verifica a leitura duas vezes antes de responder
- Se um campo não for legível, devolve null (nunca inventes)`;

    if (purpose === 'search') {
      return `Estás a analisar a fotografia de uma placa de identificação de um empilhador/máquina industrial (marca STILL ou similar).

Extrai apenas o número de série da máquina.

${serieRules}`;
    }
    return `Estás a analisar a fotografia de uma placa de identificação de um empilhador/máquina industrial (marca STILL ou similar).

Extrai:
1. "modelo" — designação do modelo, junto a "Type", "Typ" ou "Model" (ex: RX20-16, RX60-30, EXV14, FM-X17, OPX20, LTX50). Mantém o formato exato.
2. "serie" — número de série completo.
3. "ano" — ano de fabrico, junto a "Year", "Baujahr" ou "Year of manufacture" (ex: 2019).

${serieRules}`;
  };

  const getSchema = () => {
    if (purpose === 'search') {
      return {
        type: "object",
        properties: { "serie": { "type": ["string", "null"], "description": "O número de série exato da máquina, carácter a carácter" } },
        required: ["serie"]
      };
    }
    return {
      type: "object",
      properties: {
        "modelo": { "type": ["string", "null"], "description": "O modelo da máquina (ex: RX20-16)" },
        "serie": { "type": ["string", "null"], "description": "O número de série exato da máquina, carácter a carácter" },
        "ano": { "type": ["string", "null"], "description": "O ano de fabrico da máquina" }
      },
      required: ["serie"]
    };
  };
  
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      processImage(true);
    } else {
        setError("O processamento falhou várias vezes. Por favor, utilize a entrada manual.")
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsProcessing(false);
    setRetryCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <Camera className="w-6 h-6" />
            {purpose === 'search' ? 'Pesquisar com Imagem' : 'Adicionar com Imagem'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              {retryCount < 3 && (
                <Button variant="link" onClick={handleRetry} className="h-auto p-0 mt-2 text-red-700">
                  <RefreshCw className="w-3 h-3 mr-1" /> Tentar Novamente
                </Button>
              )}
            </Alert>
          )}

          {!selectedFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                Tire uma foto da placa de identificação
              </p>
              <p className="text-sm text-gray-500">
                O sistema tentará ler os dados automaticamente.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                capture="environment"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden shadow-inner">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              
              <Button 
                onClick={() => processImage(false)} 
                disabled={isProcessing}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Processar Imagem
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 h-12">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}