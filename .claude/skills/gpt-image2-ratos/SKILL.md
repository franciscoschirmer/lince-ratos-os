---
name: gpt-image2-ratos
description: Gera imagens via gpt-image-2 (OpenAI) usando OAuth do plano ChatGPT do user — sem API key, sem custo direto. Lê ~/.codex/auth.json (login feito uma vez via Codex CLI) e dispara um proxy local openai-oauth que roteia pelo backend Codex. Suporta text-to-image e image-edit (referência via base64). Setup conversacional do estilo a cada uso. Latência alta (60-180s por imagem). Use quando o user paga ChatGPT Plus/Pro e não quer cobrar API. Pra iteração rápida ou usuários sem plano pago, usar image-gen-ratos (FAL) ou nanobanana-ratos (Gemini).
---

# gpt-image2-ratos

Skill de geração de imagens via **gpt-image-2** usando **OAuth do plano ChatGPT do user**. Sem API key, sem custo direto — queima limite do plano.

Pra usuários que pagam ChatGPT Plus/Pro/Business/Enterprise. Pra usuários sem plano, redirecionar pra `image-gen-ratos` (FAL) ou `nanobanana-ratos` (Gemini).

## Aviso de latência (importante)

Antes de gerar, deixar claro pro user que cada imagem leva **60-180 segundos** (vs 10-15s no FAL). Isso é o overhead do proxy OAuth + backend Codex.

Se o user quer 5+ variações pra escolher, sugerir usar `image-gen-ratos` (FAL) em vez disso. Aqui a skill brilha quando é "1 imagem boa final".

## Setup (primeira vez)

A skill **não tem .env**. Toda a auth vem do `~/.codex/auth.json` que o Codex CLI cria. O fluxo de setup é:

### 1. Verificar pré-requisitos

```bash
test -f ~/.codex/auth.json && echo "OK_AUTH" || echo "NO_AUTH"
which node npx && node --version
which python3
```

### 2. Se `~/.codex/auth.json` NÃO existe

Mostrar ao user:

> Pra usar essa skill tu precisa logar no Codex CLI uma vez (vai abrir o browser). Roda isso no terminal e me avisa quando terminar:
>
> ```bash
> npx @openai/codex login
> ```
>
> Depois disso o token fica salvo em `~/.codex/auth.json` e dura meses. Tu não precisa logar de novo.
>
> Se tu não tem plano ChatGPT pago, essa skill não funciona. Usa `/image-gen-ratos` (FAL, $0.06/imagem) ou `/nanobanana-ratos` (Gemini, grátis) em vez disso.

### 3. Se `~/.codex/auth.json` JÁ existe

Seguir direto pro fluxo de geração. Não precisa de setup adicional.

## Estilo visual (conversacional, NÃO hardcoded)

Igual a `image-gen-ratos`. A skill **não força** nenhum estilo. Cada projeto/marca/canal tem o seu.

No início de cada sessão (a primeira vez que o user pedir imagem na conversa atual), perguntar:

> Como tu quer o estilo? 4 caminhos:
>
> 1. **Livre** — descreve em palavras
> 2. **Brand guide** — cola aqui o teu DNA visual ou aponta pra um arquivo
> 3. **Usar exemplo** — tem exemplos em `~/.claude/skills/gpt-image2-ratos/examples/`
> 4. **Sem estilo** — gera puro, sem calibração

Aplicar o estilo escolhido como contexto/prefixo no prompt em inglês. Não perguntar isso a cada imagem da mesma sessão — só na primeira.

## Modos de operação

### Modo direto

User cola um prompt pronto em inglês. Claude só roda.

### Modo assistido (default quando user só passa tema)

User dá um tema curto. Claude:

1. Se ainda não definiu estilo nesta sessão, pergunta
2. Sugere **3 conceitos distintos** em 2-3 linhas cada
3. Pergunta qual vai
4. Quando user escolher: escreve o prompt em **inglês** com detalhes (lighting, câmera, composição, etc)
5. Roda
6. Mostra

## Aspect ratio e quality

| Aspect | Width x Height | Pra quê |
|---|---|---|
| `1:1` (default) | 1024x1024 | Feed quadrado |
| `4:5` | 1024x1280 | Feed vertical |
| `9:16` | 1024x1792 | Stories, Reels, Shorts |
| `16:9` | 1792x1024 | Thumbnail YouTube, landscape |

**Quality** — afeta latência mais que custo (que é flat dentro do limite do plano):

| Quality | Latência tipica | Quando usar |
|---|---|---|
| `low` | ~60-90s | Rascunho |
| `medium` (default) | ~90-120s | Produção padrão |
| `high` | ~120-180s | Final final |

## Comando base (text-to-image)

> **Mudou em 09/09/2026.** Antes esta skill usava `/v1/responses` com a tool `image_generation` e o model
> de chat `gpt-5.4-mini`. **Essa rota morreu:** a OpenAI recusa modelo de imagem por tool quando o Codex esta
> autenticado com conta ChatGPT (`"...is not supported when using Codex with a ChatGPT account"`), e o
> `gpt-5.4-mini`/`gpt-5.5` sairam do allowlist da conta. **Nao e token vencido, relogar nao resolve.**
> A rota que funciona sao os endpoints de imagem do proxy: `/v1/images/generations` e `/v1/images/edits`.
> Se quebrar de novo, o diagnostico e `curl -s http://127.0.0.1:10531/v1/models`, que lista o que a conta aceita.

```bash
PORT=10531
MODEL="${MODEL:-gpt-image-2.5-flare}"   # alternativa: gpt-image-2
OUT_DIR="${OUT_DIR:-/tmp/gpt-image2-out}"
mkdir -p "$OUT_DIR"

# 1. Verificar se proxy ja esta rodando
if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/v1/models" 2>/dev/null | grep -qE "^(2|4)"; then
  echo "[skill] proxy ja UP"
else
  echo "[skill] subindo proxy openai-oauth na porta $PORT..."
  npx -y openai-oauth --port "$PORT" > "$OUT_DIR/proxy.log" 2>&1 &
  for i in $(seq 1 30); do
    curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/v1/models" 2>/dev/null | grep -qE "^(2|4)" && { echo "[skill] proxy UP ($i)"; break; }
    sleep 1
  done
fi

# 2. Gerar (JSON simples: sem tool, sem SSE)
curl -sS -X POST "http://127.0.0.1:$PORT/v1/images/generations" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"prompt\":\"PROMPT_AQUI\",\"quality\":\"medium\",\"size\":\"1024x1024\"}" \
  > "$OUT_DIR/resp.json"

# 3. Extrair o b64
python3 - "$OUT_DIR/resp.json" "OUTPUT_PATH_PLACEHOLDER" <<'PYX'
import json, base64, pathlib, sys
r = json.loads(pathlib.Path(sys.argv[1]).read_text())
d = (r.get("data") or [{}])[0].get("b64_json")
if not d:
    print("ERRO: sem imagem.", json.dumps(r)[:400], file=sys.stderr); sys.exit(1)
out = pathlib.Path(sys.argv[2]); out.write_bytes(base64.b64decode(d))
print(f"Salvo: {out} ({out.stat().st_size} bytes)")
PYX
```

Substituir `PROMPT_AQUI` e `OUTPUT_PATH_PLACEHOLDER` antes de rodar.

**Nao matar o proxy** ao final do request. Deixa rodando pra reusar nas proximas imagens da sessao. Pra parar manualmente: `lsof -ti:10531 | xargs kill`.

## Comando com imagem de referência (image edit)

Endpoint diferente: `/v1/images/edits`, **multipart**, com um campo `image` por referencia (ate 16).
Nao e base64 dentro de JSON, e upload de arquivo mesmo.

```bash
curl -sS -X POST "http://127.0.0.1:$PORT/v1/images/edits" \
  -F "model=$MODEL" \
  -F "image=@/caminho/ref1.png" \
  -F "image=@/caminho/ref2.png" \
  -F "prompt=PROMPT_AQUI" \
  -F "quality=medium" \
  -F "size=1024x1024" \
  > "$OUT_DIR/resp.json"
```

A extracao do b64 e a mesma do passo 3 acima (`data[0].b64_json`).

**A ordem das referencias importa.** Quando uma e guia de estilo e outra e a pessoa/objeto, manda a guia
primeiro e diz isso no prompt: *"Image 1 is the STYLE GUIDE: copy ONLY its visual style. Image 2 is the
PERSON: keep his exact face and likeness. Ignore the person in image 1."* Sem essa frase o modelo mistura os dois.

**O `size` e sugestao, nao garantia.** Com `gpt-image-2.5-flare`, pedindo `1536x1024` a saida veio
`1672x941` (16:9). Se precisar de dimensao exata, redimensionar depois com ffmpeg.

## Princípios pra escrever o prompt

1. **Em inglês.** O modelo entende PT mas responde melhor a direção técnica em EN. Texto literal na imagem pode ser em PT.
2. **Texto em quotes.** Pra renderizar verbatim: `reads "[texto em português]"`. ~99% accuracy.
3. **Composição, não intenção.** "Medium shot, subject centered, banker lamp backlighting" > "dramatic portrait".
4. **Listar negativos.** "No emojis, no gradients, no stock photo aesthetic".
5. **Specificity vence.** "Space-black MacBook Pro 16-inch M3" > "a laptop".
6. **Referências cinematográficas (se o estilo pedir).** "In the visual style of Severance office scenes".

## Pós-geração

Mostrar a imagem ao user. Por causa da latência, perguntar **antes** de fazer outra:
- Aprovou? → pergunta onde salvar/publicar
- Quer variação? → ajusta 1 detalhe e roda de novo (avisa que vai levar mais 1-3 min)
- Quer mesma ideia em outro aspect/quality? → rerodar

Não gerar 3 variações em paralelo sem perguntar — cada uma queima quota Codex do plano dele.

## Troubleshooting

**`~/.codex/auth.json` não existe**
User não logou no Codex CLI. Mostrar: `npx @openai/codex login`.

**Proxy não sobe (timeout em 30s)**
Ver `$OUT_DIR/proxy.log`. Causas comuns:
- Porta 10531 ocupada por outro processo: `lsof -i :10531` e matar
- Rede lenta no primeiro download do `openai-oauth` (npx baixa antes de rodar)
- Token expirado e refresh falhou: rodar `npx @openai/codex login` de novo

**`401` ou `403` do proxy**
Token OAuth expirou ou foi revogado. User precisa relogar: `npx @openai/codex login`.

**`"The '<model>' model is not supported when using Codex with a ChatGPT account"`**
Repare no formato: essa mensagem vem como `{"detail": ...}`, e nao como `{"error": {...}}` da OpenAI.
Quer dizer que a **rota** nao serve imagem pra conta ChatGPT, que e o que acontece ao chamar `/v1/responses`
com a tool `image_generation`. **Nao relogar, nao e token.** Usar `/v1/images/generations` ou
`/v1/images/edits`, que e o que esta skill faz desde 09/09/2026.

**`"The model X does not exist or you do not have access to it"`**
Ai sim e allowlist da conta. Rodar `curl -s http://127.0.0.1:10531/v1/models` e usar um dos listados.
Em 09/09/2026 a conta servia `gpt-image-2` e `gpt-image-2.5-flare` nos endpoints de imagem.

**`429` do proxy**
Limite Codex do plano ChatGPT esgotado. Esperar reset (geralmente a cada 5h).

**Imagem não veio (`No image data in response`)**
Modelo recusou a request (moderation, prompt ambíguo). Ver últimos eventos do SSE. Reescrever o prompt.

**Latência muito maior que 180s**
Status do plano ChatGPT pode estar com fila. Verificar [status.openai.com](https://status.openai.com).

**Imagem em PT com acentos quebrados**
Encurtar a string. Confirmar que tá em quotes: `reads "texto"`.

## Custos reais (atenção)

A skill é "free" no sentido de não cobrar API extra, mas **queima limite do plano ChatGPT**. Por doc oficial da OpenAI, image generation consome limite Codex **3-5x mais rápido** que turn de texto.

Avisar o user no setup:

> Heads up: cada imagem aqui usa parte da tua quota Codex do plano ChatGPT. Se tu também usa Codex CLI pra coding, isso compete pelo mesmo limite. No Plus ($20/mês), tu provavelmente consegue gerar ~6-30 imagens medium em cada janela de 5h, mas isso vai depender do uso normal do Codex.

## Referências

- Exemplos de estilo: `~/.claude/skills/gpt-image2-ratos/examples/`
- [Pacote openai-oauth (proxy local)](https://github.com/EvanZhouDev/openai-oauth)
- [Codex CLI Authentication (OpenAI)](https://developers.openai.com/codex/auth)
- [Codex CLI Features (image generation)](https://developers.openai.com/codex/cli/features)
- Skill complementar (FAL, paga): `/image-gen-ratos`
- Skill complementar (Gemini, grátis): `/nanobanana-ratos`
