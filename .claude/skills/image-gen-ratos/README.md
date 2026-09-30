# image-gen-ratos

Skill de geracao de imagens pro Claude Code via **gpt-image-2** (OpenAI) atraves da **FAL API**.

Zero dependencias. Usa curl + python3 (pre-instalados no macOS).

## Instalacao

```bash
cp -r image-gen-ratos ~/.claude/skills/
```

Na primeira vez que pedir uma imagem, o Claude vai te guiar pra configurar a chave da FAL.

## O que faz

- Gera imagens com gpt-image-2 (modelo da OpenAI servido pela FAL)
- Suporta aspect ratios (1:1, 4:5, 9:16, 16:9)
- Suporta imagem de referencia via endpoint /edit (mantem traços de pessoa, mockup de produto, etc)
- Modos: direto (cola prompt pronto) ou assistido (Claude sugere conceitos, tu escolhe, ele gera)
- Sem npm, sem pip, sem Docker

## Estilo visual

A skill **nao forca nenhum estilo**. Cada projeto, marca ou canal tem o seu, e tu escolhe na hora.

Na primeira imagem da conversa, o Claude pergunta:

1. **Livre** — descreve em palavras ("foto profissional limpa", "estilo Pixar", "fotografia analogica anos 70")
2. **Brand guide** — cola aqui o teu DNA visual ou aponta pra um arquivo do projeto
3. **Usar exemplo** — tem exemplos prontos em `examples/` que tu pode usar ou copiar pra criar o teu
4. **Sem estilo** — sem calibracao extra, gera puro

Olha a pasta [`examples/`](./examples/) pra ver um exemplo real (estilo do canal Ratos de IA) e usar de modelo pra criar o teu.

## Pra que serve (vs nanobanana-ratos)

Use esta skill pra cenas elaboradas com texto na imagem, mockup, composicao complexa, personagem.

Pra imagens mais simples e rapidas (free tier), usar `nanobanana-ratos`.

## Uso

Depois de instalar, basta pedir pro Claude Code:

> "gera uma imagem de capa pra um post sobre IA na medicina"

Na primeira vez ele pergunta o estilo. Depois disso, dentro da mesma conversa, ele mantem o estilo escolhido pra todas as imagens — e tu pode mudar quando quiser.

## Chave da API

Crie em https://fal.ai/dashboard/keys

Precisa colocar uns $5 em creditos (https://fal.ai/dashboard/billing). Cada imagem em quality `medium` custa ~$0.06.

A chave fica salva em `~/.claude/skills/image-gen-ratos/.env` (criado automaticamente no primeiro uso).

## Custos

| Quality | Custo aprox (1024x1024) | Quando usar |
|---|---|---|
| `low` | $0.01 | Rascunho/iteracao |
| `medium` (default) | $0.06 | Producao padrao |
| `high` | $0.22 | Final final, hero shot |

## Sobre o nome

Nasceu no canal **Ratos de IA** (por isso o sufixo). Funciona pra qualquer projeto, marca ou nicho — nao tem nada de Ratos hardcoded no comportamento.
