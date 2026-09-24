import React from "react";
import { Check, Square, Trash2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";

// Formata datas: datetime → "dd/MM HH:mm", date-only → "dd/MM"
const fmt = (s) => {
  if (!s) return null;
  try {
    const str = String(s);
    return format(parseISO(str), str.length > 10 ? "dd/MM HH:mm" : "dd/MM");
  } catch { return null; }
};

function Section({ title, children }) {
  return (
    <div className="border-t border-slate-700 pt-3 mt-3">
      <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-2 tracking-wider">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export default function MaquinaCardDetails({ machine, onRemoveImprevisto, currentUser, isAdmin }) {
  const tarefas = Array.isArray(machine.tarefas) ? machine.tarefas : [];
  const observacoes = Array.isArray(machine.observacoes) ? machine.observacoes : [];
  const imprevistos = Array.isArray(machine.imprevistos) ? machine.imprevistos : [];
  const historico = Array.isArray(machine.historicoCriacoes) ? machine.historicoCriacoes : [];
  const canRemoveImprevisto = isAdmin || machine.tecnico === currentUser?.nome_tecnico;

  return (
    <div className="text-slate-300">
      {/* TAREFAS — só visual, a interação continua no ObservationsModal */}
      {tarefas.length > 0 && (
        <Section title="Tarefas">
          {tarefas.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {t.concluida
                ? <Check className="w-3.5 h-3.5 text-cpro shrink-0" />
                : <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              <span className={t.concluida ? "text-cpro line-through" : "text-slate-300"}>{t.texto}</span>
            </div>
          ))}
        </Section>
      )}

      {/* IMPREVISTOS — removíveis (mesma guarda de permissões de hoje) */}
      {imprevistos.length > 0 && (
        <Section title="Imprevistos">
          {imprevistos.map((iv, i) => (
            <div key={i} className="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">
              <span className="text-red-400 shrink-0">⚡</span>
              <div className="flex-1 min-w-0">
                <div className="text-red-400 break-words">{iv.descricao}</div>
                <div className="num text-[10px] text-red-400/60">+{iv.horas_extra}h{iv.data ? ` · ${fmt(iv.data)}` : ""}</div>
              </div>
              {canRemoveImprevisto && onRemoveImprevisto && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveImprevisto(machine.id, i); }}
                  title="Eliminar imprevisto"
                  className="shrink-0 p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* OBSERVAÇÕES */}
      {observacoes.length > 0 && (
        <Section title="Observações">
          {observacoes.map((obs, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-700 rounded px-2 py-1.5">
              <p className="text-xs text-slate-200 break-words">{obs.texto}</p>
              <p className="num text-[10px] text-slate-400 mt-0.5">{obs.autor}{obs.data ? ` · ${fmt(obs.data)}` : ""}</p>
            </div>
          ))}
        </Section>
      )}

      {/* CRONOLOGIA */}
      {(machine.dataAtribuicao || machine.previsao_inicio || machine.previsao_fim || machine.dataConclusao) && (
        <Section title="Cronologia">
          {machine.dataAtribuicao      && <div className="num text-xs text-slate-300">Atribuição: <span className="text-slate-400">{fmt(machine.dataAtribuicao)}</span></div>}
          {machine.previsao_inicio     && <div className="num text-xs text-slate-300">Prev. início: <span className="text-slate-400">{fmt(machine.previsao_inicio)}</span></div>}
          {machine.previsao_fim        && <div className="num text-xs text-slate-300">Prev. entrega: <span className="text-slate-400">{fmt(machine.previsao_fim)}</span></div>}
          {machine.dataConclusao       && <div className="num text-xs text-cpro">Conclusão: <span className="text-cpro/80">{fmt(machine.dataConclusao)}</span></div>}
        </Section>
      )}

      {/* IMAGEM */}
      {machine.imageUrl && (
        <Section title="Imagem">
          <img src={machine.imageUrl} alt={machine.serie} className="w-full rounded-lg border border-slate-700" />
        </Section>
      )}

      {/* HISTÓRICO DE CRIAÇÕES */}
      {historico.length > 0 && (
        <Section title="Histórico de criações">
          <div className="text-xs text-slate-400">Esta série já foi registada {historico.length}x anteriormente.</div>
          {historico.map((h, i) => (
            <div key={i} className="num text-[10px] text-slate-500">
              {h.dataCriacao ? fmt(h.dataCriacao) : "—"} → {h.estado || "—"}
            </div>
          ))}
        </Section>
      )}

      {/* LINK ATLAS */}
      {machine.atlas_ciclo_id && (
        <Section title="Origem">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <ExternalLink className="w-3 h-3" /> ATLAS · {String(machine.atlas_ciclo_id).slice(-6)}
          </span>
        </Section>
      )}
    </div>
  );
}