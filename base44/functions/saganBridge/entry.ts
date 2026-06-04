// ─────────────────────────────────────────────────────────────────────────────
// saganBridge v2 — separação de papéis leitura/escrita
//
// Variáveis de ambiente obrigatórias (painel Base44 do Watcher):
//   SAGAN_BRIDGE_SECRET  → segredo full-access (só o Sagan tem — server-side)
//   INLIVE_READ_SECRET   → segredo read-only (bridgeProxy do InLive)
//
// Sem fallback hardcoded — falha fechado se env vars não estiverem configuradas.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Falha fechado — sem fallback, sem strings no código
const SAGAN_SECRET  = Deno.env.get('SAGAN_BRIDGE_SECRET') ?? '';
const INLIVE_SECRET = Deno.env.get('INLIVE_READ_SECRET')  ?? '';

const ALLOWED_ENTITIES = ['FrotaACP', 'OrdemServico', 'Notificacao', 'Pedido', 'TechnicianCustomization'];
const READ_ACTIONS  = new Set(['list', 'filter', 'get']);
const WRITE_ACTIONS = new Set(['update', 'create', 'delete']);

Deno.serve(async (req) => {
  try {
    // ── Env vars obrigatórias ────────────────────────────────────────────────
    if (!SAGAN_SECRET || !INLIVE_SECRET) {
      console.error('saganBridge: env vars não configuradas — recusando todas as chamadas');
      return Response.json({ error: 'Bridge not configured' }, { status: 503 });
    }

    const authHeader = req.headers.get('x-sagan-secret') ?? '';

    // ── Determinar papel com base no segredo apresentado ────────────────────
    const isSagan  = authHeader === SAGAN_SECRET;   // acesso total
    const isInLive = authHeader === INLIVE_SECRET;  // só leitura

    if (!isSagan && !isInLive) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body   = await req.json().catch(() => ({}));
    const { action, entity, query, data } = body;

    if (!action || !entity) {
      return Response.json({ error: 'Parâmetros obrigatórios: action, entity' }, { status: 400 });
    }

    if (!ALLOWED_ENTITIES.includes(entity)) {
      return Response.json({ error: `Entidade não permitida: ${entity}` }, { status: 403 });
    }

    // ── Guardrail de papel: InLive só pode ler ───────────────────────────────
    if (isInLive && !READ_ACTIONS.has(action)) {
      console.warn(`saganBridge: InLive tentou acção de escrita '${action}' — bloqueado`);
      return Response.json({ error: `Action '${action}' not permitted for read-only caller` }, { status: 403 });
    }

    // ── Sagan: todas as acções; InLive: só leitura ───────────────────────────
    const client = base44.asServiceRole;
    let result;

    switch (action) {
      case 'list':
        result = await client.entities[entity].list();
        break;
      case 'filter':
        if (!query) return Response.json({ error: 'filter requer query' }, { status: 400 });
        result = await client.entities[entity].filter(query);
        break;
      case 'get':
        if (!query?.id) return Response.json({ error: 'get requer query.id' }, { status: 400 });
        result = await client.entities[entity].get(query.id);
        break;
      case 'update':
        if (!query?.id || !data) return Response.json({ error: 'update requer query.id e data' }, { status: 400 });
        result = await client.entities[entity].update(query.id, data);
        break;
      case 'create':
        if (!data) return Response.json({ error: 'create requer data' }, { status: 400 });
        result = await client.entities[entity].create(data);
        break;
      case 'delete':
        if (!query?.id) return Response.json({ error: 'delete requer query.id' }, { status: 400 });
        result = await client.entities[entity].delete(query.id);
        break;
      default:
        return Response.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }

    return Response.json({ ok: true, result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
