<!-- quem alimenta: o /setup semeia; o /atualizar reescreve no fim de cada sessão. Lido em toda conversa (boot). Teto: 40 linhas; estourou, vira ponteiro pra arquivo próprio. -->
# Agora · onde paramos

> O contexto que muda toda semana (diferente de `estrategia.md`, que é o foco de fundo).
> Mantenha curto: o que passou de ~30 dias sai daqui. Decisão não mora aqui: mora em `_memoria/decisoes.md`.
> Pendência que sai desta lista sai com motivo (feito, virou projeto, mandaram soltar), nunca em silêncio.

## Onde paramos
2026-10-02: captura de reuniões e filas passam a falar com o ClickUp pela API direta com o token do Francisco (variável no ambiente de nuvem, `api.clickup.com` liberado), fora do limite do conector; testado na nuvem. A captura ganhou o filtro do que vira tarefa (na dúvida não cria), o bloco "Filtrado" no relatório, o banco de ideias (💡 Ideias e combinados das reuniões, `86akru8d2`) e aviso no celular a cada execução.
2026-10-01: produtividade migrada para o Supabase próprio do Francisco (projeto "Chico"). Formulário de acessos do cliente no ar (acessos-lince.pages.dev, painel em /painel).

## Pendências
- Com o Cláudio: subdomínio do formulário de acessos. Primeiro decidir linceco.com.br ou lince.company; depois Custom domain no projeto `acessos-lince` e CNAME `acessos` → `acessos-lince.pages.dev` no DNS (2026-10-02)
- Entrar no painel de acessos, testar mostrar, exportar e apagar com o envio "TESTE CLAUDE (apagar)" (2026-10-01)
- Guardar a `ACESSOS_CHAVE` do `.env` no gerenciador de senhas (2026-10-01)
- Remover do projeto Supabase antigo do Cláudio ("Lince", axilzquaqtppqjkbqqca) o schema `produtividade` e a função `public.produtividade_dados_painel`: o Cláudio apaga, ou reconectar a conta operacional por um minuto (2026-10-01)
- Passar o link producao-lince.pages.dev e a senha às lideranças (operacional@, criativos@, admin@) por canal privado (2026-09-30)
- Conferir os nomes dos status "alteração interna" e "alteração do cliente" (criados pelo Francisco em 2026-10-01) quando o ClickUp liberar, e orientar a Marina (2026-10-01)
- Conferir o primeiro fechamento semanal de produtividade na Review/Retro, quinta 2026-10-01 19h: é o teste completo com o banco novo (2026-10-01)
- Conferir o comentário "🤖 Captura 01/10" no container da semana: primeira execução automática (2026-10-01)
- Na Planning de 2026-10-05, revisar as tarefas com a tag captura-ia e as 7 divergências do relatório de 30/09 (2026-09-30)
- Apagar na web a execução de teste de 14:46 (claude.ai/code/session_01UH8cHRxJP97QzVYuThyD3V, mostra o token do ClickUp) e a rotina "TESTE · token ClickUp na nuvem (apagar)" (2026-10-02)
- Conferir a captura das 19h de 2026-10-02, a primeira com filtro e API: notificação no celular e bloco Filtrado no comentário do container (2026-10-02)
- Conferir a fila das 16h30 de 2026-10-02, a primeira pela API (sai como Francisco: notifica a Marina, não ele) (2026-10-02)
- Apagar o canal "Fila de Aprovação (antigo)" no ClickUp (2026-10-01)
- Mapear os próximos processos: varredura operacional do ClickUp, programação semanal, fechamento semanal, avanços da semana, WhatsApp para ClickUp, auditoria de setup (2026-09-30)
- Troca geral de senhas expostas nos grupos: Karina (Registro.br, Hostgator, wp-admin), e-mails operacional e criativos, Simone no doc aberto (2026-09-30)
- Restringir o doc de acessos e colar nele os acessos da Átria e dos sócios (2026-09-30)
- Pedir à Jenifer os acessos da Urocenter (2026-09-30)
- Base de contratado versus entregue de setembro para a Júlia (2026-09-30)
- Health Score dos clientes até 2026-10-05 (2026-09-30)
- Conferir a cópia duplicada do kit em .claude/skills/ratos-os/ (rodar /faxina) (2026-09-29)
- Ligar Meta Ads com a Jenifer: token da conta de anúncios, depois `/meta-ads-ratos setup` (2026-09-29)
- Confirmar com o Cláudio o servidor próprio e onde moram os sites (2026-09-29)
- Pedir à Pâmela/Victoria os códigos oficiais da marca e o logo em PNG transparente ou SVG (2026-09-29)
- Criar a pasta do Dr. Walter Pinto com /novo-projeto (2026-09-29)

## Quente agora
- Fechamento de setembro e Health Score de outubro
- Captura de reuniões: calibrar o filtro pelo bloco "Filtrado" nas primeiras execuções
- Painel de produtividade da equipe de conteúdo
