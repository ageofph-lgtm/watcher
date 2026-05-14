const SAGAN_SECRET = 'sagan-watcher-bridge-2026';
const API_KEY = 'f8517554492e492090b62dd501ad7e14';
const APP_ID  = '690c7a2cb53713f70561ad65';
const BASE    = `https://base44.app/api/apps/${APP_ID}/entities/FrotaACP`;

const SKIP_FIELDS = new Set(["id","created_date","updated_date","created_by_id","is_sample","baia","pausa_motivo"]);
const STRING_FIELDS = new Set(["ano","observacoes","modelo","serie","estado","tecnico",
  "tipo","timer_status","timer_started_at","timer_started_by","previsao_inicio","previsao_fim",
  "dataAtribuicao","dataConclusao","imageUrl"]);

function cleanRecord(m: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) {
    if (SKIP_FIELDS.has(k)) continue;
    if (k === "tarefas" && Array.isArray(v)) {
      out[k] = v.map(t => typeof t === "string" ? { texto: t, concluida: false } : t);
    } else if (k === "historicoCriacoes" && Array.isArray(v)) {
      out[k] = v.map(t => typeof t === "string" ? { texto: t } : t);
    } else if (STRING_FIELDS.has(k)) {
      if (v === null || v === undefined) out[k] = null;
      else if (Array.isArray(v)) out[k] = null;
      else if (typeof v !== "string") out[k] = String(v);
      else out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-sagan-secret') !== SAGAN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const all: Record<string, unknown>[] = [];
    let skip = 0;
    while (true) {
      const r = await fetch(`${BASE}?limit=100&skip=${skip}`, { headers: { "api_key": API_KEY } });
      const chunk = await r.json();
      if (!Array.isArray(chunk) || chunk.length === 0) break;
      all.push(...chunk);
      if (chunk.length < 100) break;
      skip += 100;
    }

    const toFix = all.filter(m =>
      Array.isArray(m.tarefas) && (m.tarefas as unknown[]).some(t => typeof t === "string")
    );

    let updated = 0, errors = 0;
    const errs: string[] = [];

    for (const m of toFix) {
      const cleaned = cleanRecord(m);
      const r = await fetch(`${BASE}/${m.id}`, {
        method: "PUT",
        headers: { "api_key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (r.ok) {
        updated++;
      } else {
        errors++;
        errs.push(`${m.id}: ${(await r.text()).slice(0, 80)}`);
      }
      await new Promise(res => setTimeout(res, 100));
    }

    return Response.json({ ok: true, total: all.length, toFix: toFix.length, updated, errors, sample_errors: errs.slice(0, 5) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
