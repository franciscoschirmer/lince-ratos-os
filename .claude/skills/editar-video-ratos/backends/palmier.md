# Backend: Palmier Pro

Editor de video pra Mac com um MCP que expoe a timeline. Vantagem sobre o caminho
headless: tu abre o projeto e **revisa o corte com o olho** antes de exportar, e
sobra um projeto editavel pra ajustar na mao.

Requisitos: Mac, Palmier Pro instalado, MCP `palmier-pro` conectado, `ffmpeg` no PATH.

**Unidade desse backend: frames da FONTE.** Gera o flat com `--unit frames --fps <fps>`.

---

## Dirigindo o MCP

O server responde num endpoint HTTP local (`claude mcp list` mostra a URL, tipo
`http://127.0.0.1:19789/mcp`).

**As tools dele as vezes NAO aparecem como tool chamavel**, nem nativa nem via
ToolSearch, mesmo com o server conectado. Quando isso acontecer, dirige por
`curl` com JSON-RPC direto:

```bash
curl -s -X POST http://127.0.0.1:PORT/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"get_timeline","arguments":{}}}'
```

Faz um `pm.sh <tool>` que le os args JSON do stdin e desembrulha
`result.content[0].text`. Poupa muito ruido no resto da sessao.

Tools que importam: `get_timeline`, `get_media`, `inspect_media`, `get_transcript`,
`add_clips`, `split_clips`, `ripple_delete_ranges`, `remove_clips`, `undo`,
`export_project`.

---

## Fase 1: mapear

- `get_timeline` -> fps, `totalFrames`, tracks. `width > height` = horizontal.
- `get_media` -> as fontes importadas. Guarda `id` (mediaRef) e `absolutePath`.
- Projeto vazio (`totalFrames: 0`) e **normal** quando vais montar multicam do zero.
  Nesse caso as fontes so precisam estar importadas.

## Fase 2: transcricao

Dois caminhos:

**a) Pelo proprio Palmier** (nao precisa chave nem Whisper): `inspect_media` com o
mediaRef de UMA das fontes, `wordTimestamps: true`, `language: "pt"`, paginando em
janelas de ~400s. Converte pro flat `indice|startFrame|endFrame|texto`, frames da
FONTE = `round(segundos * fps)`.

**b) Pelo helper:** `transcribe.py <fonte> --unit frames --fps <fps> -o flat.txt`.

Nos dois casos: **despacha um subagente pra fazer isso**. Video de 30min da 5000-6000
palavras e enche teu contexto a toa. O subagente devolve o caminho do arquivo.
**Guarda o flat original**, tudo depois depende dele.

## Fase 3: multicam (se tiver 2+ fontes)

Roda `check-sync.py <fonte1> <fonte2>` primeiro. Se reprovar, nao tem multicam por
troca de fonte: edita uma fonte so.

O metodo: **sequencia de segmentos contiguos numa track so**. Nao e overlay.

1. Decide os pontos de troca em frames de FONTE, lendo o flat. Faz a troca coincidir
   com um corte de marcador quando der: a emenda ja existe ali, some.
2. Monta a lista `[inicio, fim, fonte]` cobrindo `0 -> totalFrames`, sem buraco.
3. **Um `add_clips` so**, uma entry por segmento:
   `{mediaRef: <fonte>, startFrame: inicio, durationFrames: fim - inicio, trimStartFrame: inicio}`
4. Confere no `get_timeline`: V1 e A1 contiguos, `totalFrames` = duracao da fonte.

Como as fontes tem numeracao de frame identica, cada segmento no seu frame nativo
fica em sync, e o audio linkado sai contiguo no A1 sozinho. Audio identico = emenda
invisivel. Zero orfao, zero overlap.

> **NAO faz overlay** (`add_clips` por cima de um clipe base). Isso deixa audio
> duplicado orfao no A1 que tu tem que caçar e remover com `remove_clips`, e da
> audio dobrado se escapar. Segmentos contiguos evitam o problema inteiro.

## Fase 4: aplicar os cortes

Como a timeline pre-corte e `0 -> fim` contigua, **frame de fonte = frame de
timeline**, entao os ranges calculados na fonte aplicam direto.

Uniao ordenada e sem overlap de todos os ranges (marcadores + silencio + o que mais
foi aprovado), **num `ripple_delete_ranges` so**:

```json
{"trackIndex": 0, "units": "frames", "ranges": [[100,200],[500,650]]}
```

`trackIndex 0` corta video + audio linkado em sincronia. Confirmado na pratica.

> **Nao dependas do `undo`.** Depois de um ripple ele as vezes **esvazia a
> timeline**, ainda mais se tu rodou undos de teste antes. Guarda os segmentos e os
> ranges num JSON e **rebuilda por script**: e barato e deterministico.

## Fase 5: verificar

**Pela transcricao REAL da timeline** (`get_transcript`, frames de timeline). Nao
pela reconstrucao. Os frames do ASR sao inflados, entao a reconstrucao acha que
comeu palavra de fronteira que na verdade esta la, e te da falso alarme.

Confere: zero marcador restante, e as emendas (fim de cada clipe -> inicio do
proximo) fazendo sentido.

Se o `get_transcript` truncar (acontece com timeline de 60+ clipes), ai sim usa
`reconstruct-transcript.py flat-original.txt clips.txt`, sabendo que e aproximacao.

## Fase 6: exportar

```json
{"mode": "video", "codec": "H.264", "resolution": "1080p", "outputPath": "<pasta>/<nome>.mp4"}
```

Renderiza em background. Poll o arquivo com `ffprobe` ate a duracao bater.

Depois, um segundo `export_project` com `{"mode": "palmier", "outputPath": ...}` pra
deixar um **backup editavel**. So um export por vez: roda o palmier DEPOIS que o
video terminar.

O `export_project` le a timeline em memoria, entao nao precisa salvar so pra
exportar. Mas o projeto reverte se fechar sem salvar.

**Sempre confere o export**: `ffprobe -v error -select_streams v -show_entries
stream=nb_frames -of csv=p=0 "<arquivo>"`. Se `nb_frames` < o esperado, re-exporta:
o render as vezes trunca e finaliza curto, cortando o fim no meio da frase.

---

## Gotchas

- Tools do MCP as vezes nao aparecem. Cai pro `curl` JSON-RPC sem drama.
- `undo` depois do ripple pode esvaziar a timeline. Rebuilda por script.
- `get_transcript` trunca em timeline muito fragmentada.
- Nao faz overlay pro multicam.
- Deixa so o projeto certo aberto no app.
- Projeto pode vir com faixa de legenda de sessao anterior, inchando o
  `get_timeline`. `remove_tracks` nela antes de comecar.
- `get_timeline` fica enorme com muitos clipes. Le por janela (`startFrame`/`endFrame`).
