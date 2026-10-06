// Farol de Clientes no ClickUp (lista 🚦 Farol de Clientes, uma tarefa por cliente por mês).
// Roda todo dia às 7h de Brasília (cron "0 10 * * *" no wrangler.toml):
// 1. Virada de mês: cria a linha do mês novo para cada cliente ativo (copia o escopo da última linha)
//    e passa as linhas antigas de "Mês atual" para "Histórico".
// 2. Conta no Calendário Editorial os conteúdos "postado/subido" com Data de Postagem no mês
//    e grava Conteúdos postados, % entregue e Farol (mês atual e mês anterior).
// Leads, conversas e agendamentos NÃO são daqui: vêm da rotina que lê os relatórios da Jenifer.
// Limite de subrequisições do Worker: para em ~45 chamadas e continua no dia seguinte (tudo é idempotente).

const L_FAROL = '901329216299';
const L_CAL = '901325858184';
const F_POST = 'd4806a40-74c1-45fb-9c36-972aca497d00';
const STATUS_POSTADO = 'postado/subido';
// meses antes deste vieram da planilha (importados em 06/10/2026) e o script não mexe neles
const PRIMEIRO_MES = { ano: 2026, mes: 9 }; // outubro/2026 (mês 0-11)
const ATIVOS = ['Ativo', 'Aviso', 'Onboarding'];
const COPIAR = ['👔 Clientes', 'Status da contratação', 'Tier', 'Designer', 'Escopo', 'Gestor', 'Relatório em contrato', 'O que é conversão', 'Conteúdo em contrato'];
const MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const tz = 'America/Sao_Paulo';

export async function farol(env, api) {
  let chamadas = 0;
  const avisos = [];
  const call = async (url, opts) => {
    if (++chamadas > 45) throw new Error('LIMITE');
    return api(env, url, opts);
  };

  const hoje = new Date(new Date().toLocaleDateString('en-CA', { timeZone: tz }) + 'T12:00:00-03:00');
  const ano = hoje.getUTCFullYear(), m = hoje.getUTCMonth();
  const rotulo = (a, mm) => `${MES[mm]}/${String(a).slice(2)}`;
  const atual = rotulo(ano, m);
  const anterior = m === 0 ? rotulo(ano - 1, 11) : rotulo(ano, m - 1);
  const inicio = (a, mm) => new Date(`${a}-${String(mm + 1).padStart(2, '0')}-01T00:00:00-03:00`).getTime();
  const diasNoMes = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
  const diaHoje = Number(new Date().toLocaleDateString('en-CA', { timeZone: tz }).slice(8, 10));

  try {
    const campos = (await call(`https://api.clickup.com/api/v2/list/${L_FAROL}/field`)).fields;
    const F = n => { const f = campos.find(x => x.name === n); if (!f) throw new Error(`campo "${n}" sumiu da lista do Farol`); return f; };
    const opcao = (n, nome) => (F(n).type_config.options || []).find(o => o.name === nome);
    const valorDe = (t, n) => (t.custom_fields || []).find(f => f.id === F(n).id)?.value;
    const nomeOpcao = (t, n) => { const v = valorDe(t, n); return v == null ? null : (F(n).type_config.options.find(o => o.orderindex == v || o.id === v) || {}).name; };

    // linhas do Farol
    let linhas = [];
    for (let p = 0; ; p++) {
      const r = await call(`https://api.clickup.com/api/v2/list/${L_FAROL}/task?include_closed=true&page=${p}`);
      linhas.push(...r.tasks);
      if (r.last_page !== false || !r.tasks.length) break;
    }

    // 1. virada de mês
    const doMes = linhas.filter(t => nomeOpcao(t, 'Mês') === atual);
    if (!doMes.length) {
      const opMes = opcao('Mês', atual);
      if (!opMes) avisos.push(`a opção "${atual}" não existe no campo Mês do Farol: crie no ClickUp para as linhas do mês nascerem`);
      else {
        const porCliente = {};
        for (const t of linhas) {
          const c = valorDe(t, '👔 Clientes'); if (c == null) continue;
          const ordem = (F('Mês').type_config.options.find(o => o.orderindex == valorDe(t, 'Mês')) || {}).orderindex ?? -1;
          if (!porCliente[c] || ordem > porCliente[c].ordem) porCliente[c] = { t, ordem };
        }
        for (const { t } of Object.values(porCliente)) {
          if (!ATIVOS.includes(nomeOpcao(t, 'Status da contratação'))) continue;
          const cf = [{ id: F('Mês').id, value: opMes.id }, { id: F('Período').id, value: opcao('Período', 'Mês atual').id }];
          for (const n of COPIAR) {
            const v = valorDe(t, n); if (v == null || v === '') continue;
            const f = F(n);
            if (f.type === 'drop_down') cf.push({ id: f.id, value: (f.type_config.options.find(o => o.orderindex == v) || {}).id });
            else if (f.type === 'labels') cf.push({ id: f.id, value: v });
            else cf.push({ id: f.id, value: v });
          }
          const cliente = t.name.split(' · ')[0];
          await call(`https://api.clickup.com/api/v2/list/${L_FAROL}/task`, { method: 'POST', body: JSON.stringify({ name: `${cliente} · ${atual}`, custom_fields: cf }) });
        }
        linhas = []; // relê no próximo dia; hoje só cria
        console.log(`farol: linhas de ${atual} criadas`);
        return avisos;
      }
    }
    // linhas antigas que ainda estão como "Mês atual" viram "Histórico"
    for (const t of linhas) {
      if (nomeOpcao(t, 'Período') === 'Mês atual' && nomeOpcao(t, 'Mês') !== atual)
        await call(`https://api.clickup.com/api/v2/task/${t.id}/field/${F('Período').id}`, { method: 'POST', body: JSON.stringify({ value: opcao('Período', 'Histórico').id }) });
    }

    // 2. postados por cliente (mês atual e anterior) no Calendário Editorial
    const contar = async (a, mm) => {
      // o filtro de campo de data da API não funciona nessa lista: filtra por status + atualizadas desde 10 dias antes do mês, e confere a data aqui
      const desde = inicio(a, mm) - 10 * 864e5;
      const cont = {};
      for (let p = 0; ; p++) {
        const r = await call(`https://api.clickup.com/api/v2/list/${L_CAL}/task?subtasks=true&include_closed=true&statuses[]=${encodeURIComponent(STATUS_POSTADO)}&date_updated_gt=${desde}&page=${p}`);
        for (const t of r.tasks) {
          const fp = (t.custom_fields || []).find(f => f.id === F_POST);
          if (!fp?.value || Number(fp.value) < inicio(a, mm) || Number(fp.value) >= inicio(mm === 11 ? a + 1 : a, (mm + 1) % 12)) continue;
          const c = (t.custom_fields || []).find(f => f.id === F('👔 Clientes').id)?.value;
          if (c != null) cont[c] = (cont[c] || 0) + 1;
        }
        if (r.last_page !== false || !r.tasks.length) break;
      }
      return cont;
    };
    const meses = [[atual, ano, m, true], [anterior, m === 0 ? ano - 1 : ano, m === 0 ? 11 : m - 1, false]];
    for (const [rot, a, mm, corrente] of meses) {
      if (a < PRIMEIRO_MES.ano || (a === PRIMEIRO_MES.ano && mm < PRIMEIRO_MES.mes)) continue;
      const cont = await contar(a, mm);
      for (const t of linhas.filter(x => nomeOpcao(x, 'Mês') === rot)) {
        const c = valorDe(t, '👔 Clientes');
        const postados = cont[c] || 0;
        const contrato = Number(valorDe(t, 'Conteúdo em contrato')) || null;
        if (Number(valorDe(t, 'Conteúdos postados')) !== postados || valorDe(t, 'Conteúdos postados') == null)
          await call(`https://api.clickup.com/api/v2/task/${t.id}/field/${F('Conteúdos postados').id}`, { method: 'POST', body: JSON.stringify({ value: postados }) });
        if (!contrato) continue;
        const pct = Math.round(postados / contrato * 100);
        if (Number(valorDe(t, '% entregue')) !== pct)
          await call(`https://api.clickup.com/api/v2/task/${t.id}/field/${F('% entregue').id}`, { method: 'POST', body: JSON.stringify({ value: pct }) });
        // no mês corrente o farol compara com o esperado até hoje (ritmo); no mês fechado, com o contrato inteiro
        const base = corrente ? contrato * diaHoje / diasNoMes : contrato;
        const ritmo = base ? postados / base * 100 : 0;
        const cor = ritmo >= 100 ? '🟢 No contrato' : ritmo >= 80 ? '🟡 Perto' : '🔴 Abaixo';
        if (nomeOpcao(t, 'Farol') !== cor)
          await call(`https://api.clickup.com/api/v2/task/${t.id}/field/${F('Farol').id}`, { method: 'POST', body: JSON.stringify({ value: opcao('Farol', cor).id }) });
      }
    }
    console.log(`farol: atualizado (${chamadas} chamadas)`);
  } catch (e) {
    if (e.message === 'LIMITE') console.log('farol: limite de chamadas do dia, continua amanhã');
    else avisos.push(e.message);
  }
  return avisos;
}
