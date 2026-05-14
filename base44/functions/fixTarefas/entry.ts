import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SAGAN_SECRET = 'sagan-watcher-bridge-2026';

Deno.serve(async (req) => {
  if (req.headers.get('x-sagan-secret') !== SAGAN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const base44 = createClientFromRequest(req);
    const client = base44.asServiceRole;

    // Buscar todas as máquinas
    const all = await client.entities.FrotaACP.list();

    // Filtrar as que têm tarefas como strings
    const toFix = all.filter((m: Record<string, unknown>) =>
      Array.isArray(m.tarefas) && (m.tarefas as unknown[]).some((t: unknown) => typeof t === "string")
    );

    let updated = 0, errors = 0;
    const errs: string[] = [];

    for (const m of toFix) {
      const tarefasFixed = (m.tarefas as unknown[]).map((t: unknown) =>
        typeof t === "string" ? { texto: t, concluida: false } : t
      );
      try {
        // update direto via SDK — sem validação REST
        await client.entities.FrotaACP.update(m.id, { tarefas: tarefasFixed });
        updated++;
      } catch (e) {
        errors++;
        errs.push(`${m.id}: ${(e as Error).message?.slice(0, 80)}`);
      }
      await new Promise(r => setTimeout(r, 80));
    }

    return Response.json({ ok: true, total: all.length, toFix: toFix.length, updated, errors, sample_errors: errs.slice(0, 5) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
