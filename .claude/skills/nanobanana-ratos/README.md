# nanobanana-ratos

Skill de geracao de imagens pro Claude Code usando Nano Banana 2 (Gemini 2.5 Flash Image).

Zero dependencias. Usa curl + python3 (pre-instalados no macOS).

## Instalacao

```bash
cp -r nanobanana-ratos ~/.claude/skills/
```

Na primeira vez que pedir uma imagem, o Claude vai te guiar pra configurar a chave gratis do Google Gemini.

## O que faz

- Gera imagens a partir de prompts de texto
- Suporta aspect ratios (1:1, 16:9, 9:16, etc)
- Gratis (free tier do Google AI Studio)
- Sem npm, sem pip, sem Docker

## Uso

Depois de instalar, basta pedir pro Claude Code:

> "gera uma imagem de um rato cartoon com headphones"

Ele usa a skill automaticamente.

## Chave da API

Crie gratis em https://aistudio.google.com/apikey

A chave fica salva em `~/.claude/skills/nanobanana-ratos/.env` (criado automaticamente no primeiro uso).
