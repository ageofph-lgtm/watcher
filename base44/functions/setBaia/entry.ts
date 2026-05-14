import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SAGAN_SECRET = 'sagan-watcher-bridge-2026';

const BAIA_MAP: Record<string, string> = {
  "rogerio": "BAIA 1",
  "nuno":    "BAIA 2",
  "yano":    "BAIA 4",
  "raphael": "BAIA 5",
};

Deno.serve(async (req) => {
  try {
    if (req.headers.get('x-sagan-secret') !== SAGAN_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const client = base44.asServiceRole;

    const machines = await client.entities.FrotaACP.list();
    let updated = 0, errors = 0;

    for (const m of machines) {
      if (m.arquivada) continue;
      const tecnico = (m.tecnico || '').toLowerCase().trim();
      const baia = BAIA_MAP[tecnico];
      if (!baia || m.baia === baia) continue;

      try {
        await client.entities.FrotaACP.update(m.id, { baia });
        updated++;
      } catch (e) {
        errors++;
        console.error(`Erro ${m.id}:`, e.message);
      }
    }

    return Response.json({ ok: true, updated, errors, total: machines.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
