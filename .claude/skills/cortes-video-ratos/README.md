# Cortes Video Ratos

> Skill de Claude Code feita pela [**Ratos de IA**](https://ratosdeia.com.br), parte do curso [**Claude Code OS**](https://ratosdeia.com.br/claudeos/).

Pega um video longo e devolve **cortes prontos pra postar** no TikTok, Reels e Shorts:
reenquadrados, com hook na abertura, verificados, nomeados, e com a legenda de cada
post escrita.

Funciona com **ffmpeg** (qualquer OS, sem app pago) ou com o **Palmier Pro** (Mac, se
tu quer revisar o corte com o olho antes de exportar).

## Dois modos, porque tem dois problemas

A maioria das ferramentas de corte assume que teu video ja vem fatiado. Raramente vem.

- **`destaques`** — a fonte e corrida (podcast, live, aula, talking head). O trabalho
  e **achar** os momentos que se sustentam sozinhos. Cortes de 20-60s.
- **`blocos`** — a fonte ja tem virada de assunto (compilado de noticias, aula com
  modulos, review de varios produtos). O trabalho e **achar as fronteiras** que ja
  existem. Cortes de 3-8min.

O `destaques` e o caso da maioria e o mais dificil: em blocos as fronteiras te
esperam, em destaques tu tem que achar valor. A skill le a transcricao e sugere o
modo, tu confirma.

## O que ela faz

1. **Transcreve** e mapeia o video (por subagente, pra nao entupir o contexto).
2. **Seleciona** os cortes pelo modo, com criterio explicito. O que mais reprova
   candidato: **o trecho precisa se sustentar sozinho**. Se ele precisa do que veio
   antes, nao e corte.
3. **Hook** na abertura, com regra de tom (curto, minusculo, curiosidade real, sem
   prometer o que o corte nao entrega).
4. **Corta e reenquadra** pra 1080x1920.
5. **Verifica** duracao real contra a pedida. Render trunca, e exit code 0 nao prova
   que o video presta.
6. **Entrega** os arquivos nomeados + um `HOOKS-E-LEGENDAS.md` com hook, legenda de
   post e o motivo de cada corte funcionar, ranqueados por potencial.

## Duas coisas que a gente descobriu medindo

Valem pra ti mesmo se tu nunca usar essa skill:

**`ffmpeg -c copy` nao serve pra cortar pra social.** Ele so corta em keyframe. Numa
fonte com keyframe a cada ~8s, pedimos 5.00s e ele devolveu **12.59s**. Nao e "menos
preciso", e um arquivo errado, e o erro varia com a fonte. Corte pra social vive dos 3
primeiros segundos: errar o inicio mata o hook. Essa skill re-encoda sempre e nem
expoe a opcao ruim.

**`drawtext` nao existe em todo ffmpeg.** Ele depende do build ter libfreetype, e
muito build nao tem (o ffmpeg 8.1 do Homebrew que a gente testou nao tinha freetype
nem libass: nem `drawtext`, nem `subtitles`). Entao o hook aqui e renderizado com PIL
e composto com `overlay`, que e filtro core e existe em qualquer build. De brinde da
**contorno**, que resolve o problema que mais estraga hook: texto branco some em cima
de screenshot claro.

## Instalacao

```bash
# 1. Clonar o repo
git clone `cortes-video-ratos`

# 2. Copiar a skill para a pasta do Claude Code
cp -r cortes-video-ratos ~/.claude/skills/cortes-video-ratos

# 3. Dependencias
brew install ffmpeg          # mac (linux: sudo apt install ffmpeg)
pip install Pillow           # pro hook

# 4. Abre o Claude Code e diz "corta esse video em reels"
```

Na primeira execucao a skill faz um **setup conversacional**: modo, formato, hook,
backend. Fica no `config.json` e ela nao pergunta de novo.

### Transcricao

Funciona **sem chave nenhuma**, com Whisper local (`pip install openai-whisper`). Sem
GPU demora mais ou menos a duracao do video. Se tu corta video toda semana, uma chave
de API (AssemblyAI, ~US$0.12/hora) sai bem mais rapido. Poe no `.env` e a skill usa
sozinha.

## Skills relacionadas

- **`editar-video-ratos`** — limpa a
  gravacao bruta antes: tira os erros que tu marcou falando, apara as pausas, monta a
  troca de camera. Rodar ela antes deixa os cortes melhores.
- **`publicar-social-ratos`** — sobe
  os cortes como rascunho no TikTok e Instagram. Essa skill delega pra ela em vez de
  reimplementar.
- **`transcribe`** — transcreve video de
  YouTube, Instagram, TikTok e 1000+ sites.

## Licenca

CC BY 4.0. Usa, adapta, vende o que tu fizer com ela. So credita a origem.
