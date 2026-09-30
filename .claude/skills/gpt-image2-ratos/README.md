# gpt-image2-ratos

Skill de geracao de imagens com **gpt-image-2** (OpenAI) usando **OAuth do teu plano ChatGPT** — sem API key, sem cartao na FAL.

Funciona em qualquer plano ChatGPT pago (Plus, Pro, Business, Enterprise/Edu). As geracoes consomem o limite Codex do teu plano em vez de cobrar API.

## Pra que serve (e quando NAO serve)

**Quando usar essa skill:**
- Tu ja paga ChatGPT Plus/Pro e quer gerar imagem sem custo extra
- Tu nao quer mexer com API key, billing, FAL, etc
- Vai gerar 1-3 imagens por sessao (nao iteracao rapida)

**Quando NAO usar essa skill:**
- Tu nao tem plano ChatGPT pago — usa `image-gen-ratos` (FAL, ~$0.06/imagem) ou `nanobanana-ratos` (Gemini, free tier)
- Tu precisa iterar rapido (5+ imagens em sequencia) — a latencia OAuth e alta (60-120s por imagem)
- Tu quer fluxo determinista, sem dependencia de servico de terceiro

## Como funciona (alto nivel)

1. Tu ja logou no Codex CLI alguma vez (`npx @openai/codex login`). O token OAuth ficou em `~/.codex/auth.json`
2. Quando tu pedir uma imagem, a skill sobe um proxy local ([`openai-oauth`](https://github.com/EvanZhouDev/openai-oauth)) que le esse token e expoe um endpoint OpenAI-compativel em `127.0.0.1:10531`
3. A skill manda um POST pro proxy nos endpoints de imagem (`/v1/images/generations` pra gerar, `/v1/images/edits` pra editar com referência), no modelo `gpt-image-2.5-flare`
4. O resultado vem em SSE stream e a skill salva o PNG

A skill nao loga, nao implementa OAuth, nao gerencia tokens. So usa o que o Codex CLI ja deixou pronto.

## Pre-requisitos

- Node 18+ e npx (vem com Node)
- Plano ChatGPT pago (Plus, Pro, Business, Enterprise ou Edu)
- Login feito no Codex CLI: `npx @openai/codex login` (uma vez, valido por meses)
- Python 3.9+ (pre-instalado no macOS)

A skill faz checagem desses pre-reqs no primeiro uso e te guia se faltar algum.

## Instalacao

```bash
cp -r gpt-image2-ratos ~/.claude/skills/
```

Depois e so pedir uma imagem pro Claude Code que ele dispara a skill.

## Estilo visual

Igual a `image-gen-ratos`: **a skill nao forca nenhum estilo**. Cada projeto tem o seu, tu escolhe na hora.

Na primeira imagem da conversa, o Claude pergunta:

1. **Livre** — descreve em palavras
2. **Brand guide** — cola ou aponta pra um arquivo
3. **Usar exemplo** — tem exemplos prontos em [`examples/`](./examples/) que tu pode usar ou copiar pra criar o teu
4. **Sem estilo** — gera puro, sem calibracao

## Custo (atencao)

**Nao e "de graca de verdade"** — usa o limite Codex do teu plano ChatGPT.

Pela [doc oficial da OpenAI](https://developers.openai.com/codex/cli/features), image generation **consome limite Codex 3-5x mais rapido** que turn de texto.

Se tu ja usa Codex CLI pra coding, gerar imagens vai comer parte da tua quota diaria.

| Plano ChatGPT | Limite Codex aproximado | Imagens medium estimadas/dia |
|---|---|---|
| Plus ($20/mes) | ~30-150 turns/5h | ~6-30 imagens/5h |
| Pro ($200/mes) | ~10x mais que Plus | ~60-300 imagens/5h |

Sao estimativas — a OpenAI nao publica numeros exatos e os limites variam.

## Latencia

POC real (April 2026, plano Plus, quality=low):

| Quality | Latencia tipica |
|---|---|
| `low` | ~60-90s |
| `medium` | ~90-120s |
| `high` | ~120-180s |

Pra comparacao, o mesmo modelo via FAL roda em ~10-15s. A diferenca e o overhead do proxy + roteamento via Codex backend.

## Sobre o nome

Nasceu no canal **Ratos de IA**. Funciona pra qualquer projeto, marca ou nicho — nao tem nada de Ratos hardcoded no comportamento.

## Skills relacionadas

| Skill | Backend | Custo | Latencia | Quando usar |
|---|---|---|---|---|
| **gpt-image2-ratos** (esta) | OAuth ChatGPT | "Free" (limite plano) | 60-180s | Tu paga Plus/Pro |
| `image-gen-ratos` | FAL API | $0.01-0.22/imagem | 10-15s | Iteracao rapida, sem plano ChatGPT |
| `nanobanana-ratos` | Gemini API | Free tier | 5-10s | Imagens simples, sem texto critico |
