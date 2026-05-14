const SAGAN_SECRET = 'sagan-watcher-bridge-2026';
const API_KEY = 'f8517554492e492090b62dd501ad7e14';
const APP_ID  = '690c7a2cb53713f70561ad65';
const BASE    = `https://base44.app/api/apps/${APP_ID}/entities/FrotaACP`;

const BAIA_MAP: Record<string, string> = {
  "rogerio": "BAIA 1",
  "nuno":    "BAIA 2",
  "yano":    "BAIA 4",
  "raphael": "BAIA 5",
};

const READONLY = new Set(["id","created_date","updated_date","created_by_id","is_sample"]);

function cleanRecord(m: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) {
    if (READONLY.has(k)) continue;
    if (k === "tarefas" && Array.isArray(v)) {
      out[k] = v.map(t => typeof t === "string" ? { texto: t, concluida: false } : t);
    } else if (k === "historicoCriacoes" && Array.isArray(v)) {
      out[k] = v.map(t => typeof t === "string" ? { texto: t } : t);
    } else if ((k === "ano" || k === "observacoes") && v !== null && typeof v !== "string") {
      out[k] = String(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function apiGet(url: string) {
  const r = await fetch(url, { headers: { "api_key": API_KEY } });
  if (!r.ok) throw new Error(`GET ${r.status}`);
  return r.json();
}

async function apiPut(id: string, data: Record<string, unknown>) {
  const r = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "api_key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`${r.status}: ${err.slice(0, 200)}`);
  }
  return r.json();
}

Deno.serve(async (req) => {
  if (req.headers.get('x-sagan-secret') !== SAGAN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const all: Record<string, unknown>[] = [];
    let skip = 0;
    while (true) {
      const chunk = await apiGet(`${BASE}?limit=100&skip=${skip}`);
      if (!Array.isArray(chunk) || chunk.length === 0) break;
      all.push(...chunk);
      if (chunk.length < 100) break;
      skip += 100;
    }

    let updated = 0, errors = 0;
    const errs: string[] = [];

    for (const m of all) {
      if (m.arquivada) continue;
      const tecnico = ((m.tecnico as string) || "").toLowerCase().trim();
      const baia = BAIA_MAP[tecnico];
      if (!baia || m.baia === baia) continue;

      const cleaned = cleanRecord(m);
      cleaned.baia = baia;

      try {
        await apiPut(m.id as string, cleaned);
        updated++;
      } catch (e) {
        errors++;
        errs.push(`${m.id} (${tecnico}): ${(e as Error).message.slice(0, 80)}`);
      }

      await new Promise(r => setTimeout(r, 80));
    }

    return Response.json({ ok: true, total: all.length, updated, errors, sample_errors: errs.slice(0, 5) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
