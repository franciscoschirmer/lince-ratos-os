# Publicar Social Ratos

Skill de Claude Code pra publicar e agendar carrosséis, imagens e reels no Instagram e TikTok, com um painel HTML da semana de posts. Setup guiado, dois métodos disponíveis.

## O que faz

- Publica carrosséis, imagens e reels no Instagram e TikTok
- **Agenda** pra data e hora (Post for Me), um post ou a semana inteira
- **Painel HTML** da semana: o que está agendado e o que já saiu, uma coluna por dia
- **Reels de teste** no Instagram (só pra quem não segue) e o mesmo vídeo no TikTok sem subir de novo
- Confere a ordem do carrossel depois de agendar e refaz se vier embaralhado
- Dois métodos: **Post for Me** (recomendado) ou **Graph API** (avançado, só publica na hora)
- Setup conversacional na primeira vez e dry-run antes de publicar

## Instalação

```bash
# baixe o zip de publicar-social-ratos na plataforma (Materiais) e descompacte em ~/.claude/skills/
```

## Como usar

```
publica o carrossel que acabei de criar
```

Ou com caminho e horário:

```
agenda conteudo/carrosseis/ia-no-varejo/instagram/ pra sexta às 18h30
```

E pra ver a semana:

```
o que tá agendado essa semana?
```

Na primeira vez, a skill guia o setup do método escolhido.

## Métodos

| | Post for Me | Graph API |
|---|---|---|
| **Plataformas** | Instagram, TikTok, LinkedIn | Só Instagram |
| **Setup** | 5 min (conta + API key) | ~15 min (OAuth + tokens) |
| **Agenda?** | Sim, com painel da semana | Não, só publica na hora |
| **Token expira?** | Não | A cada 60 dias |
| **TikTok** | Sim (direto ou rascunho) | Não |
| **Custo** | Plano pago (ver postforme.dev) | Gratuito |

## Estrutura

```
publicar-social-ratos/
├── SKILL.md
├── VERSION
├── CHANGELOG.md
└── scripts/
    ├── publish-postforme.js
    ├── painel-agendados.js
    └── publish-graph-api.js
```

## Pré-requisitos

- **Post for Me:** conta em postforme.dev + API key no `.env`
- **Graph API:** app no Meta Developer + token longo + imgbb key no `.env`
- **Node.js 18+** pra rodar os scripts

## Licença

CC BY 4.0
