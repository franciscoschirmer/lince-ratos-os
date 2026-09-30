---
name: image-gen-ratos
description: Gera imagens via gpt-image-2 (OpenAI) através da FAL API. Setup conversacional do estilo a cada uso — tu fala como quer (livre, descrição em palavras, brand guide colado, ou um exemplo da pasta examples/) e o Claude monta o prompt em inglês com detalhes cinematográficos. Suporta text-to-image e image-edit (até 16 imagens de referência). Zero dependências (curl + python3 stdlib). Use quando o usuário pedir imagem com cena, personagem, mockup, composição ou texto complexo. Pra imagens simples e rápidas, usar nanobanana-ratos.
---

# image-gen-ratos

Skill de geração de imagens via **gpt-image-2** (modelo da OpenAI servido pela **FAL API**). Zero dependências — curl + python3 stdlib.

Pra imagens mais simples e rápidas (free tier), usar `nanobanana-ratos`. Pra cenas elaboradas com texto, mockup, composição complexa, personagem — usar esta.

## Setup (primeira vez)

Antes de gerar qualquer imagem, verificar se `~/.claude/skills/image-gen-ratos/.env` existe.

### Se o .env NÃO existe

Perguntar pro usuário:

> Tu já tem uma chave da FAL API?
>
> Se sim, cola ela aqui que eu configuro.
>
> Se não, cria em https://fal.ai/dashboard/keys — precisa colocar uns $5 em créditos (fal.ai/dashboard/billing). Cada imagem medium custa ~$0.06.

Quando o usuário fornecer a chave:

1. Criar o arquivo `~/.claude/skills/image-gen-ratos/.env` com:
   ```
   FAL_KEY=chave-que-o-usuario-passou
   ```
2. `chmod 600 ~/.claude/skills/image-gen-ratos/.env`
3. Confirmar: "Pronto! Chave salva. Bora testar?"

### Se o .env JÁ existe

Carregar a chave quando precisar:
```bash
source ~/.claude/skills/image-gen-ratos/.env
```

## Estilo visual (conversacional, NÃO hardcoded)

A skill **não força** nenhum estilo. Cada projeto, marca ou canal tem o seu, e tu escolhe na hora.

No início de cada sessão de geração (a primeira vez que o user pedir imagem na conversa atual), perguntar:

> Como tu quer o estilo? Tenho 4 caminhos:
>
> 1. **Livre** — descreve em palavras o que tu quer ("foto profissional limpa", "estilo Pixar", "fotografia analógica anos 70")
> 2. **Brand guide** — cola aqui o teu brand guide / DNA visual (ou aponta pra um arquivo do projeto tipo `marca/brand-dna.md`)
> 3. **Usar exemplo da skill** — tenho exemplos prontos em `~/.claude/skills/image-gen-ratos/examples/` (atualmente: estilo-ratos do canal Ratos de IA, mas tu pode copiar e fazer o teu)
> 4. **Sem estilo** — só gera o que eu pedir, sem calibração extra

Aplicar o estilo escolhido como **prefixo/contexto** no prompt em inglês. Se a escolha foi "sem estilo", gerar com o prompt do user puro.

**Não perguntar isso a cada imagem da mesma sessão** — só na primeira. Se o user mudar de assunto e quiser outro estilo, ele pede.

Se o user pedir imagem direto sem definir estilo (ex: "gera uma imagem do produto X em fundo branco"), assumir "sem estilo" e gerar. Não atrasar com pergunta se a intenção é clara.

## Modos de operação

### Modo direto

User cola um prompt pronto em inglês. Claude só roda.

Exemplo:
> User: "gera essa imagem: [prompt longo em inglês detalhado]"
> Claude: [roda curl, baixa imagem, mostra]

### Modo assistido (default quando user só passa tema)

User dá um tema curto ("capa pro post sobre IA na medicina" / "criativo pro curso" / "imagem pra tweet").

Claude:

1. Se ainda não definiu estilo nesta sessão, pergunta (ver seção "Estilo visual" acima)
2. Sugere **3 conceitos distintos** em 2-3 linhas cada, dentro do estilo escolhido. Ex: ângulos diferentes, composições diferentes, props diferentes.
3. Numera 1, 2, 3
4. Pergunta: "qual vai? pode mandar o 2 com ajuste X, ou outra ideia tua"
5. Quando user escolher/ajustar: escrever o prompt completo em **inglês** (modelos renderam melhor em en) com todos os detalhes cinematográficos (lighting, câmera, props, mood, composition, text overlay se houver)
6. Rodar curl
7. Mostrar

## Aspect ratio

| Flag | Dimensão | Pra quê |
|---|---|---|
| `1:1` (default) | 1024x1024 | Feed Instagram/TikTok square |
| `4:5` | 1024x1280 | Feed vertical Meta Ads |
| `9:16` | 1024x1792 | Stories, Reels, Shorts |
| `16:9` | 1792x1024 | YouTube thumbnail, landscape |

Se user não falar, perguntar — ou usar 1:1 como default se for óbvio que é feed.

## Quality

| Flag | Custo aprox (1024x1024) | Quando usar |
|---|---|---|
| `low` | $0.01 | Rascunho/iteração |
| `medium` (default) | $0.06 | Produção padrão |
| `high` | $0.22 | Final final, hero shot |

## Comando base (text-to-image)

```bash
source ~/.claude/skills/image-gen-ratos/.env

# Monta payload
python3 <<'PY' > /tmp/fal-payload.json
import json
payload = {
    "prompt": """PROMPT_AQUI_INTEIRO""",
    "image_size": {"width": 1024, "height": 1024},
    "quality": "medium",
    "num_images": 1,
    "output_format": "png"
}
print(json.dumps(payload))
PY

# Dispara
curl -sS -X POST "https://fal.run/openai/gpt-image-2" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d "@/tmp/fal-payload.json" > /tmp/fal-response.json

# Baixa imagem
python3 <<'PY'
import json, urllib.request, sys
r = json.load(open('/tmp/fal-response.json'))
imgs = r.get('images', [])
if not imgs:
    print("ERRO:", json.dumps(r, indent=2), file=sys.stderr)
    sys.exit(1)
urllib.request.urlretrieve(imgs[0]['url'], 'OUTPUT_PATH')
print("Salvo: OUTPUT_PATH")
PY
```

Substituir `PROMPT_AQUI_INTEIRO` pelo prompt e `OUTPUT_PATH` pelo caminho de saída antes de rodar.

## Comando com imagem de referência (edit)

Quando user passa `--ref foto.png` ou uma imagem pra usar como base (ex: foto do produto, foto de pessoa real pra manter traços):

```bash
source ~/.claude/skills/image-gen-ratos/.env

# Upload da referência
REF_URL=$(curl -sS -X POST "https://rest.alpha.fal.ai/storage/upload" \
  -H "Authorization: Key $FAL_KEY" \
  -F "file=@CAMINHO_DA_REF.png" | python3 -c "
import sys, json
r = json.load(sys.stdin)
print(r.get('access_url') or r.get('url') or '')
")

# Payload com image_urls
python3 <<PY > /tmp/fal-payload.json
import json
payload = {
    "prompt": """PROMPT_AQUI""",
    "image_urls": ["$REF_URL"],
    "image_size": {"width": 1024, "height": 1024},
    "quality": "medium",
    "num_images": 1,
    "output_format": "png"
}
print(json.dumps(payload))
PY

# Dispara no endpoint /edit
curl -sS -X POST "https://fal.run/openai/gpt-image-2/edit" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d "@/tmp/fal-payload.json" > /tmp/fal-response.json

# Baixa (igual text-to-image)
python3 <<'PY'
import json, urllib.request, sys
r = json.load(open('/tmp/fal-response.json'))
imgs = r.get('images', [])
if not imgs:
    print("ERRO:", json.dumps(r, indent=2), file=sys.stderr)
    sys.exit(1)
urllib.request.urlretrieve(imgs[0]['url'], 'OUTPUT_PATH')
print("Salvo: OUTPUT_PATH")
PY
```

gpt-image-2 aceita até 16 imagens de referência. Passar mais de uma: `"image_urls": ["url1", "url2", ...]`.

## Princípios pra escrever o prompt

1. **Em inglês.** gpt-image-2 entende PT mas responde melhor a direção técnica em EN. O texto literal que aparece na imagem pode ser em PT.
2. **Texto em quotes.** Pra renderizar verbatim, usar `reads "[texto em português com acentos]"`. O modelo tem 99% accuracy em PT.
3. **Descrever composição, não intenção.** "Medium shot, subject centered, banker lamp backlighting the left side" é melhor que "dramatic portrait".
4. **Listar o que NÃO queremos.** "No emojis, no gradients, no stock photo aesthetic". Remove defaults indesejados.
5. **Specificity vence.** "Space-black MacBook Pro 16-inch M3" é melhor que "a laptop".
6. **Referências cinematográficas (se o estilo pedir).** "In the visual style of Severance office scenes" calibra mood em 1 linha. Mas só se o estilo escolhido pelo user pedir esse tipo de referência.

## Pós-geração

Mostrar a imagem ao user e perguntar:
- Aprovou? → pergunta onde salvar/publicar, ou segue pra outra
- Quer variação? → ajustar prompt e rodar de novo
- Quer mesma ideia em outro aspect/quality? → rerodar

Se user pedir múltiplas variações da mesma cena: mudar 1 detalhe por vez (luz, ângulo, expressão, prop) pra isolar o que muda.

## Troubleshooting

**"User is locked. Exhausted balance"**
Saldo FAL zerado. Ir em https://fal.ai/dashboard/billing e top up.

**"Invalid API key"**
Chave errada ou expirada. Regerar em https://fal.ai/dashboard/keys e atualizar .env.

**Imagem sai genérica/sem personalidade**
O estilo escolhido pelo user tá muito vago. Pedir pra ele detalhar mais (referências de filme/série, lighting, paleta, mood) ou sugerir um exemplo da pasta `examples/` pra ele ver o nível de detalhe que faz diferença.

**Texto em PT sai errado (acentos quebrados)**
Encurtar a string. Confirmar que tá dentro de aspas no prompt: `reads "texto com acentos"`. Se persistir, tentar de novo — gpt-image-2 tem 99% accuracy mas varia.

**Rosto estranho (uncanny)**
Adicionar: "anatomically correct facial features, realistic skin tones, natural proportions, hands not visible" (ou com proporção correta se precisar mostrar).

## Custos

Por 1 render:
- Low: $0.01
- Medium: $0.06
- High: $0.22

Iteração livre: user gera 20 medium num dia e gasta $1.20.

## Referências

- Exemplos de estilo: `~/.claude/skills/image-gen-ratos/examples/`
- Docs FAL: https://fal.ai/models/openai/gpt-image-2
- Docs edit: https://fal.ai/models/openai/gpt-image-2/edit
- Skill complementar: `/nanobanana-ratos` (Gemini Flash Image, mais simples, free tier)
