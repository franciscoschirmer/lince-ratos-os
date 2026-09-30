# yt-transcript

Skill para Claude Code que extrai transcrições de vídeos do YouTube usando yt-dlp.

## O que faz

- Baixa apenas as legendas (sem baixar o vídeo)
- Tenta legendas manuais primeiro, depois automáticas
- Suporta inglês e português
- Converte VTT para texto limpo, sem timestamps nem tags HTML
- Opção de saída com timestamps `[MM:SS]`

## Instalação

```bash
# baixe o zip de yt-transcript na plataforma (Materiais) e descompacte em ~/.claude/skills/
```

Dependência: [yt-dlp](https://github.com/yt-dlp/yt-dlp)

```bash
brew install yt-dlp
```

## Como usar

Cole o link do YouTube no chat e peça a transcrição:

```
transcreve esse vídeo: https://www.youtube.com/watch?v=XXXXXXXXXXX
```

O arquivo `XXXXXXXXXX-transcript.txt` é salvo na pasta atual.

## Licença

MIT
