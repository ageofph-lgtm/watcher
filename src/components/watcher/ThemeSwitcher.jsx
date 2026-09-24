import React, { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../../ThemeContext";

const OPTIONS = [
  { value: "still-light", label: "Still · Light" },
  { value: "still-dark", label: "Still · Dark" },
  { value: "retro-light", label: "Retro · Light" },
  { value: "retro-dark", label: "Retro · Dark" },
];

export default function ThemeSwitcher({ compact }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Tema"
        className="flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        style={compact ? { width: 36, height: 36 } : { width: 36, height: 36 }}
      >
        <Palette size={15} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 glass border border-slate-700 rounded-lg py-1 z-[120] w-48">
          <div className="px-3 pt-1 pb-2 text-[10px] uppercase text-slate-400 tracking-wider">Tema</div>
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-slate-200 hover:bg-slate-700/50"
              }`}
            >
              <span>{opt.label}</span>
              {theme === opt.value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}