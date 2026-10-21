<!-- quem alimenta: o /setup semeia; o /atualizar reescreve no fim de cada sessão. Lido em toda conversa (boot). Teto: 40 linhas; estourou, vira ponteiro pra arquivo próprio. -->
# Agora · onde paramos

> O contexto que muda toda semana (diferente de `estrategia.md`, que é o foco de fundo).
> Mantenha curto: o que passou de ~30 dias sai daqui. Decisão não mora aqui: mora em `_memoria/decisoes.md`.
> Pendência que sai desta lista sai com motivo (feito, virou projeto, mandaram soltar), nunca em silêncio.

## Onde paramos
2026-10-21: ffmpeg-skill instalada e plugada como camada de conferência da `edicao-completa` (check, look com zona segura, loudness). BF08 da Black da Fazenda montado em v2 (texto sobre vídeo, `black-2026/reels-black/plano-bf08-v2.json`), aguardando upload no Drive e comentário na subtarefa 5.3; BF07 v1 em revisão interna (comentário de 10h40 na 5.2). Brutos da Eco suíte e takes de casal ainda não chegaram.
2026-10-20: Black da Fazenda estruturada no ClickUp (tarefa-mãe 17trfwhp3n3 em 🎯 Projetos Especiais, 11 subtarefas): 50% OFF, antecipação no ar em 28/10, carrinho em 11/11, debriefing em 19/11. Tarefas soltas da Planning fechadas. Criativos antigos triados em três camadas (`clientes/fazenda-do-rosa/black-2026/`), subtarefas 5.1, 12, 13 e 14 criadas, rotina de ajuste dos vídeos às 23h.
2026-10-19 (tarde): Lince mídia própria com Data de Postagem lançada de 20/10 a 01/12 (terça 12h denso, quinta 18h30 leve). Urocenter novembro no ClickUp: 10 vídeos (Murilo, William, Ricardo) com prazo 5 dias úteis antes, Mateus nos vídeos e capas "CAPA: <nome>" pra Pâmela; outubro intocado.
2026-10-19: skill /onboarding criada (onboarding completo em módulos, contrato decide o que entra, prazos em dias úteis desde o D0 = reunião de onboarding). Onboarding da Dra. Mariana Fontana no ClickUp (tarefa-mãe 17trfwhnu88, 10 subtarefas, Go Live 18/11). Tudo em `operacao/onboarding/`.
2026-10-14: formulário de diagnóstico (diagnostico-lince.pages.dev) revisado de ponta a ponta e pronto pra enviar a clientes; falta o Francisco conferir o login e a planilha no painel.
2026-10-16: sessão de extração da Simone transcrita e minutada (20 vídeos, `clientes/simone-do-valle/extracao/2026-09-16-extracao/` + 2 Google Docs na pasta "Vídeos - 25-09") e cadastrada no ClickUp (tarefa-mãe 17trfwhndxr, 18 vídeos, Reels Dia do Médico movido pra dentro, 19 capas pra Pâmela). Dia do Médico: IMG_0486.MOV 7:07–9:05.
2026-10-07 (noite): postagem automática no ar no Worker `filas-lince` (Instagram ligado pelo app Meta, 14 clientes mapeados, trava `POSTAR_APENAS` = só Lince & Co., que aponta pro @francisco.schirmer). Teste de carrossel marcado pra 07/10 20h00 na tarefa 17trfwhkv88. Falta o Google (Drive e GMN) e o TikTok. Plano: `operacao/postagem-automatica/plano.md`.
2026-10-06 (noite): Farol de Clientes no ClickUp (`🚦 Farol de Clientes`, 901329216299) com histórico de mar a set/26 da planilha; postados e farol automáticos (Worker, 7h) e leads lidos dos relatórios da Jenifer (rotina diária 9h). Falta o dashboard, montado à mão pelo passo a passo.
2026-10-06: captura de reuniões reescrita: a transcrição inteira é a fonte (o Gemini só confere), critério dos containers feitos à mão, conta fechando e lista "Pra você decidir". Planning de 05/10 refeita: 22 tarefas no lugar de 6.
2026-10-05 (noite): análise de capacidade da semana (`operacao/capacidade/2026-10-05-capacidade-semana.md`) e datas redistribuídas no ClickUp: Fazenda até 31/10, Gabriel 2 por semana até 10/11, Cristiano 3 por semana até 19/11, Karinna 2 vídeos + 1 estático até 21/12.
2026-10-05: programação da semana de 06 a 12/10 feita no ClickUp (3 por cliente, começa terça, formatos alternados) e mensagens de cada cliente montadas no modelo (`operacao/programacao-semanal/modelo-mensagem.md`). Piltcher com programação macro aplicada de 20/10 a 25/12.
2026-10-02 (tarde): filas de aprovação e revisão rodam num Worker da Cloudflare (`filas-lince`, seg-sex 10h e 16h30), sem depender do note nem do conector; rotinas das filas no Claude e tarefas do Windows desligadas.
2026-10-02: captura de reuniões e filas passam a falar com o ClickUp pela API direta com o token do Francisco (variável no ambiente de nuvem, `api.clickup.com` liberado), fora do limite do conector; testado na nuvem. A captura ganhou o filtro do que vira tarefa (na dúvida não cria), o bloco "Filtrado" no relatório, o banco de ideias (💡 Ideias e combinados das reuniões, `86akru8d2`) e aviso no celular a cada execução.
2026-10-01: produtividade migrada para o Supabase próprio do Francisco (projeto "Chico"). Formulário de acessos do cliente no ar (acessos-lince.pages.dev, painel em /painel).

## Pendências
- Fazenda Black: subir o BF08 v2 na pasta Black 2026 do Drive e comentar na subtarefa 5.3 (17trfwhp8r4) marcando Marina e Vic, no formato do BF07 (2026-10-21)
- Fazenda Black: baixar a pasta Eco suíte do Drive (10 MOV, 229 MB) e os takes de casal pra `black-2026/reels-black/takes/eco-suite/` e `takes/casal/`; depois trocar as placas da jacuzzi e das cabanas no `plano-bf08-v2.json` (2026-10-21)
- Fazenda Black: decidir "até 50% OFF" (briefing) ou "50% OFF" (áudio da Vic) nos criativos BF07 e BF08 (2026-10-21)
- Trocar a senha do painel do diagnóstico (apareceu em print) com `node operacao/diagnostico/configurar.mjs` (2026-10-06)
- Entrar em diagnostico-lince.pages.dev/painel, marcar "Mostrar arquivados" e abrir a planilha do "TESTE CLAUDE revisão final" (2026-10-14)
- Fazenda Black: colocar os originais em `clientes/fazenda-do-rosa/black-2026/videos-ajuste/originais/` antes das 23h e conferir o recado da rotina (2026-10-20)
- ClickUp: ligar "Múltiplos responsáveis" em Performance & Tráfego e Administrativo & Financeiro, com a conta Admin Lince & Co (2026-10-20)
- Fazenda Black: assistir os vídeos do Drive "a conferir" (Teka, Jupiter, POVs, contagem 2025, vídeos do carrinho de inverno); depende do Chrome conectado (2026-10-20)
- Fazenda Black: decidir se a subtarefa 2 (documento da campanha) também é só interna (2026-10-20)
- Fazenda Black: Marina fechar as condições com o Arthur até 2026-10-22 (períodos, regras, duração do carrinho, oferta secundária, orçamento); todo o cronograma depende disso (2026-10-20)
- Fazenda Black: definir quem dispara os e-mails e em qual ferramenta (em 2024 era o RD Station, com o João Vitor) (2026-10-20)
- Fazenda Black: o doc das mensagens do Grupo VIP 2025 (1oXfuWAw...) não abre pelo Drive; pedir acesso ou cópia (2026-10-20)
- Urocenter: 3 carrosséis de novembro sem conteúdo (07, 14 e 21/11); sugestão: perguntas 05, 13 e 15 do Novembro Azul (2026-10-19)
- Urocenter: carrossel "Coisas que os homens fazem" (86ak7m6z5) em aprovação com data 15/10 vencida (2026-10-19)
- Urocenter: sobram 9 vídeos de Novembro Azul + a reserva; decidir se vão pra dezembro sem o selo (2026-10-19)
- Lince: vídeos acabam em 03/12, gravar pauta de vídeo leve (22, 32, 36 ou 42); 6 carrosséis leves sem data; tema "Não gosto de produzir conteúdo" repete no VGC da Vic (2026-10-19)
- Mariana: criar a opção "Mariana Fontana" no campo 👔 Clientes do ClickUp, à mão (a API não cria opção de lista) (2026-10-19)
- Mariana: mandar as respostas dos formulários de investigação e de acessos pro Opus, que vence em 27/10 (2026-10-19)
- Mariana: criar a pasta da cliente com /novo-projeto (2026-10-19)
- Onboarding: confirmar com a Júlia onde ficam os contratos assinados (não estão no Drive operacional), pra skill /onboarding ler direto (2026-10-19)
- Simone: Marina decide a V06 (17trfwhndy3, cita Veoza, preço e Mounjaro): versão curta sem nome (3:55–4:16 + 4:44–4:56) ou regravar (2026-10-16)
- Simone: confirmar quem entrevistou em 16/09 pela conta operacional@ (Marina?) e corrigir o falante na transcrição (2026-10-16)
- Simone: colar a seção ClickUp da minutagem.md no Google Doc da minutagem, que ainda diz "não cadastrado" (2026-10-16)
- Simone: criar a pasta do cliente com /novo-projeto; hoje `clientes/simone-do-valle/` só tem a subpasta de extração (2026-10-16)
- Postagem automática: conferir o resultado do teste das 20h de 07/10 (tarefa 17trfwhkv88 deve virar "postado/subido" com o link) e apagar a tarefa de teste (2026-10-07)
- Postagem automática: autorizar o Google com operacional@ (projeto no Cloud, Drive API, tela OAuth Interno, credencial de computador, `google-autorizar.mjs`); depois o Claude sobe GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN pro Worker. Sem isso o Worker não lê a pasta do LINK DAS PEÇAS (2026-10-07)
- Postagem automática: enviar o formulário "Application for Basic API Access" do Google Business Profile (demora dias a semanas) (2026-10-07)
- Postagem automática: registrar o app no developers.tiktok.com e pedir a auditoria (sem ela, só posta em privado) (2026-10-07)
- Postagem automática: contas sem Página alcançável no Meta: Walter Pinto, Otorrinos POA, Victoria Clasen, Lince & Co., Carlos Parra, Simone, Atria, Doctor Elite, HT Luis Henrique, Diprohl. Conferir no portfólio de cada um a tarefa Conteúdo na Página e o Instagram ligado à Página; depois rodar `meta-contas.mjs --kv` e `kv-contas.mjs --subir` (2026-10-07)
- Postagem automática: depois do teste com um cliente real, tirar a var `POSTAR_APENAS` do wrangler.toml e publicar pra liberar todos; criar o campo LEGENDA no Calendário Editorial (ou manter o bloco "LEGENDA" na descrição) (2026-10-07)
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
- Entrar no painel de acessos, testar mostrar, exportar e arquivar com o envio "TESTE CLAUDE (apagar)" (2026-10-01)
- Guardar no gerenciador de senhas a `ACESSOS_CHAVE` do `.env` e o login do painel do diagnóstico (`DIAGNOSTICO_PAINEL_USUARIO` e `DIAGNOSTICO_PAINEL_SENHA`) (2026-10-01)
- Remover do projeto Supabase antigo do Cláudio ("Lince", axilzquaqtppqjkbqqca) o schema `produtividade` e a função `public.produtividade_dados_painel`: o Cláudio apaga, ou reconectar a conta operacional por um minuto (2026-10-01)
- Passar o link producao-lince.pages.dev e a senha às lideranças (operacional@, criativos@, admin@) por canal privado (2026-09-30)
- Conferir os nomes dos status "alteração interna" e "alteração do cliente" (criados pelo Francisco em 2026-10-01) quando o ClickUp liberar, e orientar a Marina (2026-10-01)
- Conferir o primeiro fechamento semanal de produtividade na Review/Retro, quinta 2026-10-01 19h: é o teste completo com o banco novo (2026-10-01)
- Apagar na web a execução de teste de 14:46 (claude.ai/code/session_01UH8cHRxJP97QzVYuThyD3V, mostra o token do ClickUp) e a rotina "TESTE · token ClickUp na nuvem (apagar)" (2026-10-02)
- Conferir a captura das 19h de 2026-10-06, a primeira com o método novo: leu a transcrição, a conta fecha, "Pra você decidir" numerado (2026-10-06)
- Conferir o primeiro disparo do Worker das filas, segunda 2026-10-05 10h: mensagem nos dois canais (sai como Francisco: notifica a Marina, não ele). Se não chegar, religar as tarefas do Agendador do Windows (2026-10-02)
- Ativar a verificação em duas etapas na Cloudflare (o token do ClickUp mora lá agora), na conta Microsoft do OneDrive (o `.env` sincroniza pra lá) e, se faltar, no ClickUp (2026-10-02)
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
- Black da Fazenda: BF07 e BF08 em revisão interna; antecipação no ar em 28/10
- Black da Fazenda: carrinho em 11/11
- Mariana Fontana: Opus pronto 27/10 e reunião de aprovação na quarta 28/10
- Simone: Reels Dia do Médico sai 18/10 (Mateus edita, prazo 16/10; capa da Pâmela 17/10)
- Postagem automática: resultado do teste das 20h e autorização do Google
- Farol de Clientes: conferir a 1ª execução do Worker (07/10 7h) e da rotina dos relatórios (07/10 9h)
- Fechamento de setembro e Health Score de outubro
- Piltcher: inauguração da casa do Cartão em 2026-10-08
- Captura de reuniões: calibrar pelo "Pra você decidir" e pela conta nas primeiras execuções
- Painel de produtividade da equipe de conteúdo
