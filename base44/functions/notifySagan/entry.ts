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

    // Build summary message
    let summary = '';
    if (entity_name === 'FrotaACP') {
      const serie = data?.serie || entity_id;
      const oldEstado = old_data?.estado;
      const newEstado = data?.estado;
      if (oldEstado !== newEstado) {
        summary = 'Maquina ' + serie + ' mudou de estado: ' + oldEstado + ' -> ' + newEstado;
      } else if (data?.aguardaPecas !== old_data?.aguardaPecas) {
        summary = 'Maquina ' + serie + ' - aguarda pecas: ' + (data?.aguardaPecas ? 'SIM' : 'NAO');
      } else if (data?.tecnico !== old_data?.tecnico) {
        summary = 'Maquina ' + serie + ' atribuida a ' + data?.tecnico;
      }
    } else if (entity_name === 'Pedido') {
      const num = data?.numeroPedido || entity_id;
      const tecnico = data?.tecnico || '';
      const maquina = data?.maquinaSerie || '';
      if (eventType === 'create') {
        summary = 'Novo pedido #' + num + ' criado por ' + tecnico + ' para maquina ' + maquina;
      } else if (eventType === 'update') {
        const oldStatus = old_data?.status;
        const newStatus = data?.status;
        if (oldStatus !== newStatus) {
          summary = 'Pedido #' + num + ' mudou de estado: ' + oldStatus + ' -> ' + newStatus;
        } else {
          summary = 'Pedido #' + num + ' atualizado por ' + tecnico;
        }
      } else if (eventType === 'delete') {
        summary = 'Pedido #' + num + ' removido';
      }
    } else {
      summary = 'Evento ' + eventType + ' em ' + entity_name + ' (id: ' + entity_id + ')';
    }

    const AGENT_BASE_URL = 'https://app.base44.com/api/agents/69c166ad19149fb0c07883cb';
    const API_KEY = 'f8517554492e492090b62dd501ad7e14';
    const headers = { 'Content-Type': 'application/json', 'api_key': API_KEY };

    // Step 1: Create conversation
    const convRes = await fetch(AGENT_BASE_URL + '/conversations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ metadata: { source: 'watcher', entity: entity_name, entity_id } })
    });
    const convData = await convRes.json();
    const conversationId = convData?.id;
    console.log('[notifySagan] Conversation created:', conversationId, '| status:', convRes.status);

    if (!conversationId) {
      return Response.json({ ok: false, error: 'Failed to create conversation', detail: convData }, { status: 500 });
    }

    // Step 2: Send message
    const msgRes = await fetch(AGENT_BASE_URL + '/conversations/' + conversationId + '/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: 'user', content: summary })
    });
    const msgData = await msgRes.json();
    console.log('[notifySagan] Message sent status:', msgRes.status);

    return Response.json({ ok: true, summary, conversationId, msgStatus: msgRes.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});