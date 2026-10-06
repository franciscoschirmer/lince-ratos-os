<!-- quem alimenta: o /setup semeia; o /atualizar reescreve no fim de cada sessão. Lido em toda conversa (boot). Teto: 40 linhas; estourou, vira ponteiro pra arquivo próprio. -->
# Agora · onde paramos

> O contexto que muda toda semana (diferente de `estrategia.md`, que é o foco de fundo).
> Mantenha curto: o que passou de ~30 dias sai daqui. Decisão não mora aqui: mora em `_memoria/decisoes.md`.
> Pendência que sai desta lista sai com motivo (feito, virou projeto, mandaram soltar), nunca em silêncio.

## Onde paramos
2026-10-06 (noite): Farol de Clientes no ClickUp (`🚦 Farol de Clientes`, 901329216299) com histórico de mar a set/26 da planilha; postados e farol automáticos (Worker, 7h) e leads lidos dos relatórios da Jenifer (rotina diária 9h). Falta o dashboard, montado à mão pelo passo a passo.
2026-10-06: captura de reuniões reescrita: a transcrição inteira é a fonte (o Gemini só confere), critério dos containers feitos à mão, conta fechando e lista "Pra você decidir". Planning de 05/10 refeita: 22 tarefas no lugar de 6.
2026-10-05 (noite): análise de capacidade da semana (`operacao/capacidade/2026-10-05-capacidade-semana.md`) e datas redistribuídas no ClickUp: Fazenda até 31/10, Gabriel 2 por semana até 10/11, Cristiano 3 por semana até 19/11, Karinna 2 vídeos + 1 estático até 21/12.
2026-10-05: programação da semana de 06 a 12/10 feita no ClickUp (3 por cliente, começa terça, formatos alternados) e mensagens de cada cliente montadas no modelo (`operacao/programacao-semanal/modelo-mensagem.md`). Piltcher com programação macro aplicada de 20/10 a 25/12.
2026-10-02 (tarde): filas de aprovação e revisão rodam num Worker da Cloudflare (`filas-lince`, seg-sex 10h e 16h30), sem depender do note nem do conector; rotinas das filas no Claude e tarefas do Windows desligadas.
2026-10-02: captura de reuniões e filas passam a falar com o ClickUp pela API direta com o token do Francisco (variável no ambiente de nuvem, `api.clickup.com` liberado), fora do limite do conector; testado na nuvem. A captura ganhou o filtro do que vira tarefa (na dúvida não cria), o bloco "Filtrado" no relatório, o banco de ideias (💡 Ideias e combinados das reuniões, `86akru8d2`) e aviso no celular a cada execução.
2026-10-01: produtividade migrada para o Supabase próprio do Francisco (projeto "Chico"). Formulário de acessos do cliente no ar (acessos-lince.pages.dev, painel em /painel).

## Pendências
- Farol: montar o dashboard no ClickUp (passo a passo da conversa de 2026-10-06); encaminhar à Jenifer o pedido do bloco fixo no relatório; cobrar relatório de setembro do Piltcher, Aragão (Logan) e Otorrinos na tarefa [RELATÓRIO]; criar as opções Jan/27 em diante no campo Mês até dez/26 (2026-10-06)
- Piltcher: passar pro ClickUp os conteúdos aprovados na reunião de 02/10 (Francisco faz em outra conversa); ver a alteração do CNPJ na Hotmart do Dr. Luis Henrique (tarefa 86akm4vqc, vencida desde 30/09) (2026-10-05)
- Piltcher: decisão da Vic e da Marina sobre Saúde Bucal, Consciência Negra e Pessoas com Deficiência até 2026-10-09 (tarefa 86akt98hj); pautas novas do Cartão até 2026-11-13 (86akt9hkj); Curiosidades do robô (17/11) depende do OK do Dr. Rodrigo; Outubro Rosa espera gravações, sem data (2026-10-05)
- Programação: Otorrinos com 1 conteúdo por semana e nada depois de 18/10, tem estoque pra distribuir (2026-10-05)
- Karinna gravar os Roteiros 7, 8 e 10 até 2026-10-20: a partir de 28/10 os vídeos dela dependem disso (2026-10-05)
- Fazenda: decidir a troca do Reels do porquê com o Carrossel Saudade do verão na semana de 06/10, e se o Takes Feriadinho é pro feriado de 12/10 ou de 20/11 (2026-10-05)
- Cadastrar no ClickUp os roteiros da Maysa (enviados no grupo) e o conteúdo do Aragão quando o Francisco mandar (2026-10-05)
- Higiene do ClickUp: 61 peças em "design / edição" sem data (55 paradas desde setembro) e 65 vídeos em "disponível para edição" sem editor marcado (2026-10-05)
- Piltcher: conferir a revisão da Marina na tarefa 86akrzb99, confirmar quem da design faz os ajustes (até 2026-10-06) e se a Vitória da reunião é do cliente (2026-10-02)
- Com o Cláudio: subdomínio do formulário de acessos. Primeiro decidir linceco.com.br ou lince.company; depois Custom domain no projeto `acessos-lince` e CNAME `acessos` → `acessos-lince.pages.dev` no DNS (2026-10-02)
- Entrar no painel de acessos, testar mostrar, exportar e apagar com o envio "TESTE CLAUDE (apagar)" (2026-10-01)
- Guardar a `ACESSOS_CHAVE` do `.env` no gerenciador de senhas (2026-10-01)
- Remover do projeto Supabase antigo do Cláudio ("Lince", axilzquaqtppqjkbqqca) o schema `produtividade` e a função `public.produtividade_dados_painel`: o Cláudio apaga, ou reconectar a conta operacional por um minuto (2026-10-01)
- Passar o link producao-lince.pages.dev e a senha às lideranças (operacional@, criativos@, admin@) por canal privado (2026-09-30)
- Conferir os nomes dos status "alteração interna" e "alteração do cliente" (criados pelo Francisco em 2026-10-01) quando o ClickUp liberar, e orientar a Marina (2026-10-01)
- Conferir o primeiro fechamento semanal de produtividade na Review/Retro, quinta 2026-10-01 19h: é o teste completo com o banco novo (2026-10-01)
- Apagar na web a execução de teste de 14:46 (claude.ai/code/session_01UH8cHRxJP97QzVYuThyD3V, mostra o token do ClickUp) e a rotina "TESTE · token ClickUp na nuvem (apagar)" (2026-10-02)
- Conferir a captura das 19h de 2026-10-06, a primeira com o método novo: leu a transcrição, a conta fecha, "Pra você decidir" numerado (2026-10-06)
- Conferir o primeiro disparo do Worker das filas, segunda 2026-10-05 10h: mensagem nos dois canais (sai como Francisco: notifica a Marina, não ele). Se não chegar, religar as tarefas do Agendador do Windows (2026-10-02)
- Ativar a verificação em duas etapas na Cloudflare (o token do ClickUp mora lá agora) e, se faltar, no ClickUp (2026-10-02)
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
- Farol de Clientes: conferir a 1ª execução do Worker (07/10 7h) e da rotina dos relatórios (07/10 9h)
- Fechamento de setembro e Health Score de outubro
- Piltcher: inauguração da casa do Cartão em 2026-10-08
- Captura de reuniões: calibrar pelo "Pra você decidir" e pela conta nas primeiras execuções
- Painel de produtividade da equipe de conteúdo
