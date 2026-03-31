Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, entity_name, entity_id, data, old_data } = body;
    const eventType = event?.type || 'unknown';

    // Skip OrdemServico entirely (admin-managed)
    if (entity_name === 'OrdemServico') {
      return Response.json({ ok: true, skipped: true, reason: 'OS events are admin-only' });
    }

    // FrotaACP: only forward updates that change estado, aguardaPecas or tecnico
    if (entity_name === 'FrotaACP') {
      if (eventType === 'create' || eventType === 'delete') {
        return Response.json({ ok: true, skipped: true, reason: 'FrotaACP create/delete are admin actions' });
      }
      if (eventType === 'update') {
        const estadoChanged = data?.estado !== old_data?.estado;
        const pecasChanged = data?.aguardaPecas !== old_data?.aguardaPecas;
        const tecnicoChanged = data?.tecnico !== old_data?.tecnico;
        if (!estadoChanged && !pecasChanged && !tecnicoChanged) {
          return Response.json({ ok: true, skipped: true, reason: 'Non-technician field update' });
        }
      }
    }

    const SAGAN_API_KEY = 'f8517554492e492090b62dd501ad7e14';
    const SAGAN_AGENT_ID = '69c166ad19149fb0c07883cb';
    const BASE_URL = 'https://app.base44.com/api/agents/' + SAGAN_AGENT_ID;
    const headers = { 'Content-Type': 'application/json', 'api_key': SAGAN_API_KEY };

    // Step 1: Create conversation (empty body)
    const convRes = await fetch(BASE_URL + '/conversations', {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const conv = await convRes.json();
    console.log('[notifySagan] Conv status:', convRes.status, '| id:', conv.id);

    if (!conv.id) {
      return Response.json({ ok: false, error: 'No conversation id', detail: conv }, { status: 500 });
    }

    // Step 2: Send message with raw JSON payload as content
    const messageContent = 'WEBHOOK: ' + JSON.stringify({
      event_type: eventType,
      entity: entity_name,
      entity_id,
      data: data || {},
      old_data: old_data || {}
    });

    const msgRes = await fetch(BASE_URL + '/conversations/' + conv.id + '/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: 'user', content: messageContent })
    });
    const msgData = await msgRes.json();
    console.log('[notifySagan] Msg status:', msgRes.status);

    return Response.json({ ok: true, conversationId: conv.id, msgStatus: msgRes.status, content: messageContent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});