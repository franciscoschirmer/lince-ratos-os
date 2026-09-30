---
name: nanobanana-ratos
description: Gera imagens via Nano Banana (Google Gemini). Sem dependencias, usa curl direto. Trigger quando o usuario pedir pra gerar, criar ou fazer uma imagem, ilustracao, foto, banner, thumbnail ou criativo visual.
---

# Skill: Nano Banana — Gerador de Imagens

Gera imagens a partir de prompts de texto usando o Nano Banana (Gemini API). Zero dependencias — usa curl + python3 (pre-instalados no macOS).

## Setup (primeira vez)

Antes de gerar qualquer imagem, verificar se o arquivo `.env` existe em `~/.claude/skills/nanobanana-ratos/.env`.

### Se o .env NAO existe:

Perguntar pro usuario:

> Tu ja tem uma chave da API do Google Gemini?
>
> Se sim, cola ela aqui que eu configuro tudo pra ti.
>
> Se nao, e so criar gratis em https://aistudio.google.com/apikey — leva 30 segundos. Nao precisa de cartao de credito.

Quando o usuario fornecer a chave:

1. Criar o arquivo `~/.claude/skills/nanobanana-ratos/.env` com:
```
GEMINI_API_KEY=chave-que-o-usuario-passou
```

2. Confirmar:
> Pronto! Chave salva em `~/.claude/skills/nanobanana-ratos/.env`. Vamos testar?

### Se o .env JA existe:

Carregar a chave com:
```bash
source ~/.claude/skills/nanobanana-ratos/.env
```

Seguir direto pra geracao.

## Como gerar uma imagem

### 1. Carregar a chave

```bash
source ~/.claude/skills/nanobanana-ratos/.env
```

### 2. Montar o prompt

Escrever um prompt descritivo em ingles. Ser especifico sobre:
- Estilo (realistic photo, flat illustration, 3D render, watercolor, etc)
- Composicao (close-up, wide shot, centered, top-down, etc)
- Cores e iluminacao (warm tones, soft lighting, high contrast, etc)
- Contexto e elementos visuais

### 3. Chamar a API e salvar a imagem

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "PROMPT_AQUI"}]}],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }' | python3 -c "
import sys, json, base64
r = json.load(sys.stdin)
parts = r.get('candidates', [{}])[0].get('content', {}).get('parts', [])
for part in parts:
    if 'inlineData' in part:
        with open('ARQUIVO_SAIDA', 'wb') as f:
            f.write(base64.b64decode(part['inlineData']['data']))
        print('Imagem salva: ARQUIVO_SAIDA')
        break
else:
    print('Erro: nenhuma imagem na resposta')
    print(json.dumps(r, indent=2)[:500])
"
```

Substituir:
- `PROMPT_AQUI` — prompt descritivo em ingles
- `ARQUIVO_SAIDA` — caminho do arquivo (ex: `./minha-imagem.png`)

### 4. Mostrar pro usuario

Depois de salvar, usar o Read pra mostrar a imagem gerada pro usuario.

## Fallback: Pollinations (sem API key)

Se o usuario nao tiver API key e quiser gerar algo rapido, usar Pollinations (gratis, sem cadastro):

```bash
curl -L "https://image.pollinations.ai/prompt/PROMPT_URL_ENCODED?width=1024&height=1024&nologo=true" -o ARQUIVO_SAIDA
```

Qualidade inferior ao Gemini, mas funciona sem nada configurar.

## Opcoes avancadas

### Aspect ratio

Adicionar dentro de `generationConfig`:
```json
"imageConfig": {"aspectRatio": "16:9"}
```
Opcoes: `1:1` (padrao), `16:9`, `9:16`, `4:3`, `3:4`

### Modelos

| Modelo | Apelido | Free tier? | Qualidade |
|--------|---------|-----------|-----------|
| `gemini-2.5-flash-image` | Nano Banana Original | Sim (~500/dia, sem cartao) | 4/5 |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | Nao (precisa billing) | 5/5 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | Nao (precisa billing) | 5/5, 4K |

O padrao e o `gemini-2.5-flash-image` porque funciona no free tier sem cartao de credito.
Se o usuario tiver billing configurado no Google Cloud, trocar pra `gemini-3.1-flash-image-preview` (melhor qualidade).

### Loop de melhoria (agentico)

Se o usuario nao gostar do resultado, o Claude pode:
1. Analisar a imagem gerada (usar Read pra ver)
2. Identificar o que melhorar
3. Refinar o prompt
4. Gerar de novo

Basta pedir: "melhora essa imagem" ou "tenta de novo com mais detalhe".

## Regras

1. SEMPRE rodar `source ~/.claude/skills/nanobanana-ratos/.env` antes de qualquer chamada
2. Prompt SEMPRE em ingles (resultados muito melhores)
3. Salvar no diretorio atual ou onde o usuario pedir
4. Mostrar o caminho do arquivo salvo e usar Read pra exibir a imagem
5. Se a API retornar erro, mostrar a mensagem completa
6. Se o usuario pedir multiplas imagens, rodar em paralelo
7. NUNCA expor a chave da API em output pro usuario — so referenciar o .env
8. Se der erro de quota (429), sugerir esperar 1 minuto ou usar Pollinations como alternativa
