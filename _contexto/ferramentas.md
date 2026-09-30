<!-- quem alimenta: o /setup semeia na entrevista; o /atualizar acrescenta ferramenta nova, acesso novo ou "não alcanço"; a /faxina confere e pergunta. Lido antes de dizer "não consigo" e ao criar skill. -->
# Ferramentas

> O que o negócio usa e como o agente alcança cada coisa. **"não ligada" é resposta válida:** é assim
> que o agente sabe que aquilo existe e dá pra ligar, em vez de achar que é impossível.
> Chave nunca fica aqui. Chave mora no `.env` (fora do git) ou no gerenciador de senha; aqui vai só o
> nome da variável. O cardápio do que dá pra ligar está no catálogo de ferramentas do kit (ver mapa).

| ferramenta | pra quê | como o agente alcança | estado | última checagem |
|---|---|---|---|---|
| ClickUp | tarefas, prazos, rotinas das lideranças, espaços de cliente | MCP (conector do claude.ai) | ligada | 2026-09-29 |
| Gmail | email (conta operacional@brio-lab.com) | MCP (conector do claude.ai) | ligada | 2026-09-29 |
| Google Agenda | agenda e reuniões | MCP (conector do claude.ai) | ligada | 2026-09-29 |
| Google Drive (Docs, Sheets) | ficha do cliente, materiais, planilhas, drives compartilhados com clientes | MCP (conector do claude.ai) | ligada | 2026-09-29 |
| Meta Ads (Gerenciador) | campanhas dos clientes, análises e criativos | skill `/meta-ads-ratos` + `/ads-ratos` (token no `.env`) | não ligada | 2026-09-29 |
| WhatsApp | grupos com os clientes | só você, na mão (exportar conversa e trazer) | não ligada | 2026-09-29 |
| Google Meet | reuniões | transcrição do Meet cai no Drive, lida por lá | não ligada | 2026-09-29 |
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
- ClickUp, IDs de usuário (resolver por nome é instável): Francisco `158419961` · Ivan `112000442` · Júlia `82001470` · Pâmela `284651027`
