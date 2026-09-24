// ─────────────────────────────────────────────────────────────────────────────
// atlasBridge — ponte ATLAS → Watcher
//
// Princípio: ATLAS é o registo da máquina; Watcher é o registo do trabalho.
// O ATLAS EMPURRA trabalho para o Watcher (ato explícito da gestão de frota)
// e LÊ o estado de execução de volta. Nunca os dois escrevem o mesmo campo.
//
// Variável de ambiente obrigatória (painel Base44 do Watcher):
//   ATLAS_BRIDGE_SECRET → segredo de escrita (só o ATLAS tem — server-side)
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ATLAS_SECRET = Deno.env.get('ATLAS_BRIDGE_SECRET') ?? '';

// Whitelist dura: só campos já existentes no schema FrotaACP
const ALLOWED_CREATE_FIELDS = new Set([
  'serie', 'modelo', 'ano', 'tipo', 'recondicao', 'prioridade',
  'isExpress', 'isVps', 'previsao_inicio', 'previsao_fim',
  'tarefas', 'imageUrl',
  'cone_cor', 'cone_numero', 'atlas_ciclo_id'
]);

Deno.serve(async (req) => {
  try {
    if (!ATLAS_SECRET) {
      console.error('atlasBridge: ATLAS_BRIDGE_SECRET não configurado — recusando todas as chamadas');
      return Response.json({ error: 'Bridge not configured' }, { status: 503 });
    }
    const secret = req.headers.get('x-atlas-secret') ?? '';
    if (secret !== ATLAS_SECRET) {
      console.warn('atlasBridge: chamada não autorizada — segredo inválido');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, data, query } = body;
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities.FrotaACP;

    switch (action) {
      case 'create_a_fazer': {
        if (!data?.serie) return Response.json({ error: 'create_a_fazer requer data.serie' }, { status: 400 });
        const payload = {};
        for (const [k, v] of Object.entries(data)) {
          if (ALLOWED_CREATE_FIELDS.has(k)) payload[k] = v;
        }
        // Regras de negócio do Watcher — hardcode de segurança:
        payload.estado = 'a-fazer';
        payload.tecnico = null;
        payload.timer_status = null;
        payload.timer_started_at = null;
        payload.timer_accumulated_seconds = null;
        const result = await db.create(payload);
        return Response.json({ ok: true, result });
      }
      case 'get_status': {
        if (!query?.id && !query?.serie) {
          return Response.json({ error: 'get_status requer query.id ou query.serie' }, { status: 400 });
        }
        const result = query.id
          ? await db.get(query.id)
          : await db.filter({ serie: query.serie });
        return Response.json({ ok: true, result });
      }
      case 'update_cone': {
        if (!data || !('cone_cor' in data)) {
          return Response.json({ error: 'update_cone requer data.cone_cor' }, { status: 400 });
        }
        let target = null;
        // 1º: procurar por atlas_ciclo_id (preferido)
        if (data.atlas_ciclo_id) {
          const byCiclo = await db.filter({ atlas_ciclo_id: data.atlas_ciclo_id });
          target = Array.isArray(byCiclo) && byCiclo.length > 0 ? byCiclo[0] : null;
        }
        // 2º: na falta de ciclo, a FrotaACP mais recente com essa serie,
        //     que não esteja concluída nem arquivada
        if (!target && data.serie) {
          const bySerie = await db.filter({ serie: data.serie });
          const candidates = (Array.isArray(bySerie) ? bySerie : [])
            .filter(m => !m.arquivada && !(String(m.estado || '')).startsWith('concluida'))
            .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime());
          target = candidates[0] || null;
        }
        if (!target) {
          return Response.json({ error: 'FrotaACP não encontrada para o cone' }, { status: 404 });
        }
        // Atualiza só cone_cor e cone_numero (aceita null para libertar o cone)
        await db.update(target.id, {
          cone_cor: data.cone_cor ?? null,
          cone_numero: data.cone_numero ?? null,
        });
        return Response.json({ ok: true, id: target.id });
      }
      default:
        return Response.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});