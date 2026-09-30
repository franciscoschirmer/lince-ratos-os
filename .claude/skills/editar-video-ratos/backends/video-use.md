# Backend: video-use

Skill open source (MIT, da [Browser Use](https://github.com/browser-use/video-use))
que edita video por ffmpeg, headless. Roda em qualquer OS, sem app pago, sem GUI.

Requisitos: `git clone https://github.com/browser-use/video-use` em
`~/.claude/skills/video-use/`, `ffmpeg` no PATH, deps Python (`uv sync` ou
`pip install -e .` dentro do repo dela).

**Unidade desse backend: SEGUNDOS.** Gera o flat com `--unit ms` e divide por 1000,
ou usa `--unit s` direto.

> **Nao forka a video-use.** Essa skill dirige ela. Se ela nao estiver instalada,
> usa o backend Palmier, ou instala. As regras de correctness dela (subtitle por
> ultimo, fade de 30ms na emenda, extract por segmento + concat) valem e nao
> precisam ser reimplementadas aqui.

---

## A diferenca que mais pega

A video-use pensa no que **FICA**. Essa skill decide o que **SAI**.

O `edl.json` dela quer `ranges` = os segmentos mantidos. Nossos ranges de marcador
e silencio sao de remocao. Inverter na mao e onde se erra fora por um, entao usa:

```bash
python3 helpers/ranges-to-keep.py --remove @cortes.json --total <duracao_s> \
        --unit s --fontes '[[0,120,"cara"],[120,300,"tela"]]' --edl
```

Isso cospe o array `ranges` pronto pro `edl.json`.

## Transcricao

A video-use e hardwired pro ElevenLabs Scribe. Dois caminhos:

**a) Tem chave ElevenLabs:** deixa ela transcrever
(`helpers/transcribe_batch.py <dir>`), depois `pack_transcripts.py`. Ela cacheia.

**b) Nao tem chave:** usa o nosso `transcribe.py` (Whisper local ou AssemblyAI). Ele
cospe o flat que o `find-markers.py` come. O `pack_transcripts.py` dela nao e
necessario pro nosso fluxo: quem le a transcricao aqui e o `find-markers.py`.

Se tu quiser plugar o AssemblyAI *dentro* da video-use (pra usar o fluxo nativo
dela), da pra escrever um `transcribe_assemblyai.py` no `helpers/` dela cuspindo o
mesmo schema do Scribe (`words[]` com `type/text/start/end/speaker_id`). Ai
`pack_transcripts.py` e `render.py` funcionam sem tocar em nada. Usa
`disfluencies: true` pra preservar o marcador falado.

## Multicam

`check-sync.py` primeiro. Se as fontes forem sample-locked, multicam e so
**multi-source no EDL**: cada range aponta pra fonte `cara` ou `tela` no MESMO
timestamp. O espelhamento dos cortes e automatico, zero desalinho.

```json
{
  "version": 1,
  "sources": {"cara": "/abs/cara.mp4", "tela": "/abs/tela.mp4"},
  "ranges": [
    {"source": "cara", "start": 0.0,  "end": 12.4},
    {"source": "tela", "start": 12.4, "end": 48.9}
  ],
  "total_duration_s": 48.9
}
```

Camera e decisao editorial, nao tecnica: le a transcricao e olha uns frames.

## Render

```bash
python3 ~/.claude/skills/video-use/helpers/render.py edl.json -o final.mp4
# --preview pra um 720p rapido antes de queimar tempo no final
```

## Verificar

Nao tem timeline pra pedir transcricao, entao: **re-transcreve o OUTPUT** e roda o
`find-markers.py` nele de novo. Zero marcador restante = passou.

```bash
python3 helpers/transcribe.py final.mp4 --unit ms -o final-flat.txt
python3 helpers/find-markers.py final-flat.txt --config config.json
```

Isso nao e paranoia, ver o gotcha do plosivo abaixo.

---

## Gotchas

- **Vazamento de plosivo na emenda do marcador.** Quando o marcador cola numa palavra
  que fica, sem pausa entre elas, o onset acustico do marcador comeca ANTES do
  timestamp que o ASR reporta. Cortar no tempo "certo" ainda deixa um "Pá" audivel.
  Por isso o passe de verificacao re-transcrevendo o output e obrigatorio: ele pega
  o que vazou. Ajusta o corte na mao com mais margem quando acontecer. Na pratica
  isso pegou 2 de 12 marcadores num video real, e so a verificacao achou.
- **`render.py` forca 24fps.** Se a fonte e 30fps e tu quer manter, troca o `-r 24`
  no `render.py` ou passa `--filter`. Senao teu video de 30 sai 24 calado.
- **Nunca meças silencio pela transcricao.** Vale aqui tambem: `detect-silences.sh`
  no audio real. O `silencedetect` fragmenta pausa longa quando tem estalo no meio,
  e o `--merge-gap` do `silences-to-ranges.py` conserta.
- **Nao re-transcreve fonte que nao mudou.** Custa tempo (Whisper) ou dinheiro (API)
  e o resultado e identico. Os dois helpers cacheiam.
- As Hard Rules da video-use continuam valendo. Le o `SKILL.md` dela antes de
  inventar moda no filtergraph.
