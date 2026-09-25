import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Invólucro visual padrão do ATLAS para modais.
 * Overlay + caixa glass + header (title/subtitle ou header custom) + body (scroll) + footer fixo.
 * Fecha com Escape, clique no overlay ou botão X.
 */
export default function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  header,
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`glass border border-slate-700 rounded-xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {header ? (
          header
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
            <div>
              {title && <h3 className="page-title text-slate-100">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">{children}</div>
        {footer && (
          <div className="shrink-0 p-4 border-t border-slate-700 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}