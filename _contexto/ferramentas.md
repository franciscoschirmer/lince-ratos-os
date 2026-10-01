<!-- quem alimenta: o /setup semeia na entrevista; o /atualizar acrescenta ferramenta nova, acesso novo ou "não alcanço"; a /faxina confere e pergunta. Lido antes de dizer "não consigo" e ao criar skill. -->
# Ferramentas

> O que o negócio usa e como o agente alcança cada coisa. **"não ligada" é resposta válida:** é assim
> que o agente sabe que aquilo existe e dá pra ligar, em vez de achar que é impossível.
> Chave nunca fica aqui. Chave mora no `.env` (fora do git) ou no gerenciador de senha; aqui vai só o
> nome da variável. O cardápio do que dá pra ligar está no catálogo de ferramentas do kit (ver mapa).

| ferramenta | pra quê | como o agente alcança | estado | última checagem |
|---|---|---|---|---|
| ClickUp | tarefas, prazos, rotinas das lideranças, espaços de cliente | MCP (conector do claude.ai) | ligada, liberada em definitivo no `.claude/settings.local.json` | 2026-09-30 |
| Gmail | email (conta operacional@brio-lab.com) | MCP (conector do claude.ai) | ligada, chega ao Claude Code (testado) | 2026-09-30 |
| Google Agenda | agenda e reuniões | MCP (conector do claude.ai), conta admin@linceco.com.br, que vê todas as reuniões da equipe | ligada, chega ao Claude Code e à rotina na nuvem (testado) | 2026-09-30 |
| Google Drive (Docs, Sheets) | ficha do cliente, materiais, planilhas, drives compartilhados com clientes; Anotações do Gemini (dono operacional@linceco.com.br) | MCP (conector do claude.ai) | ligada, chega ao Claude Code e à rotina na nuvem (testado) | 2026-09-30 |
| Cloudflare | hospedar páginas e painéis (Pages), funções, controle de acesso por e-mail (Access) | CLI `wrangler` (OAuth, `npx wrangler login` neste computador) + skill `/cloudflare-ratos`; conta pessoal do Francisco (franciscoschirmer@gmail.com), Account ID `dd1f6c7762790b4ae65f086e86ca8832`. A conta da empresa (operacional@linceco.com.br) existe mas foi desconectada por escolha dele. Login no navegador certo: `npx wrangler login --browser=false` e colar o link | ligada (modo básico, sem token) | 2026-09-30 |
| Supabase | banco do log de produtividade (projeto "Chico" na conta pessoal do Francisco desde 2026-10-01; o portal do Cláudio fica em outra conta) | MCP (conector do claude.ai), chega ao Claude Code, às rotinas e ao Painel de Produção | ligada | 2026-09-30 |
| Granola | notas de reunião | MCP (conector do claude.ai), conta operacional@brio-lab.com | ligada, vazia, sem uso | 2026-09-30 |
| Meta Ads (Gerenciador) | campanhas dos clientes, análises e criativos | skill `/meta-ads-ratos` + `/ads-ratos` (token no `.env`) | não ligada | 2026-09-29 |
| WhatsApp | grupos com os clientes | só você, na mão (exportar conversa e trazer) | não ligada | 2026-09-29 |
| Google Meet | reuniões | transcrição do Gemini cai no Drive e é lida pela `/captura-reunioes` | ligada via Drive | 2026-09-30 |
| Claude web | projetos e agentes da equipe (conta compartilhada) | só você, na mão (export em Configurações > Privacidade) | não ligada | 2026-09-29 |
| ChatGPT | apoio | só você, na mão | não ligada | 2026-09-29 |
| Canva · Figma | design | MCP (conector do claude.ai) | ligada, sem uso ainda | 2026-09-29 |
| Lovable | sites e LPs (boutique/comercial.lince.company rodam nele) | MCP (conector do claude.ai) | ligada, sem uso ainda | 2026-09-29 |

## Os sete assuntos que todo negócio tem

| assunto | o que usa |
|---|---|
| mensagem com cliente | WhatsApp (um grupo por cliente) |
| tarefa e prazo | ClickUp |
| email | Gmail (Google Workspace) |
| agenda | Google Agenda |
| dinheiro entrando e saindo | planilha (Google Sheets); financeiro é da Júlia e é confidencial |
| ficha do cliente | Drive + projetos no Claude web |
| reunião | Google Meet |

## Notas de uso
- Doc do Google com link aberto: o agente lê pelo export em txt (`/export?format=txt`), mas não escreve nele (2026-09-30)
- O modo automático do Claude Code bloqueia gravar arquivo com senhas ou CPFs de terceiros; nesses casos o Francisco roda o script à mão (2026-09-30)
- O conector do ClickUp tem limite de 1.000 chamadas por dia para o workspace inteiro (rotinas e sessões somadas); carga grande só fora do horário das rotinas (2026-10-01)
- O modo automático do Claude Code pode barrar o `git push` quando o pacote tem arquivo de outra sessão; aí o Francisco roda no terminal, um comando por vez (o PowerShell não aceita `&&`) (2026-10-01)
- ClickUp, IDs de usuário (resolver por nome é instável): Francisco `158419961` · Ivan `112000442` · Júlia `82001470` · Pâmela `284651027` · Victoria `48777424` · Marina `81994084` · Jenifer `49036032` · Henri `164678340` · Cláudio `118092849` · Mateus `118126212` · Giovanna `284462463` (2026-09-30)
- O conector ClickUp age como Admin Lince & Co (`266535331`), não como o Francisco: mensagem de chat atribuída a ele (assignee `158419961`) gera notificação. O conector não cria canal de chat (2026-09-30)
