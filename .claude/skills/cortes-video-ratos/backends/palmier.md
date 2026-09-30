# Backend: Palmier Pro

Editor de video pra Mac com MCP na timeline. Vale quando tu quer **ver o corte antes
de exportar** e ficar com um projeto editavel pra ajustar na mao.

Requisitos: Mac, Palmier Pro, MCP `palmier-pro` conectado, `ffmpeg` no PATH.
O video precisa estar **aberto como projeto** no app (`get_timeline` mostra ele).
`open -a PalmierPro <video>` NAO cria projeto: so refoca. Projeto novo, o usuario abre.

**Unidade: frames da fonte.**

---

## Dirigindo o MCP

Endpoint HTTP local (`claude mcp list` mostra a URL). **As tools as vezes nao aparecem
como tool chamavel**, nem nativa nem via ToolSearch. Quando isso acontecer, `curl`:

```bash
curl -s -X POST http://127.0.0.1:PORT/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"get_timeline","arguments":{}}}'
```

Um `pm.sh <tool>` que le args JSON do stdin e desembrulha `result.content[0].text`
economiza muito ruido.

## Fluxo por corte

**isolar -> (A/V fix) -> hook -> exportar -> resetar.** Sempre `get_timeline` no
inicio pra pegar fps, `totalFrames` e os IDs de clipe.

### 1. Isolar

`ripple_delete_ranges` no `trackIndex 0`, removendo o que vem antes E depois numa
chamada so:

```json
{"trackIndex": 0, "units": "frames", "ranges": [[0, inicio], [fim, totalFrames]]}
```

Corte que comeca em 0: so `[[fim, totalFrames]]`. A/V linkados cortam juntos.

### 2. Hook

`add_texts`, 1 clipe no topo.

Posicao: usa `transform {centerX, centerY}` e **so isso**. `set_clip_properties` com
`width`+`height` explicitos **escala o texto pra encher a caixa** e estoura.

Quebra o texto em **linhas curtas manuais** com `\n` (~10-14 chars). Ele nao quebra
sozinho.

**Onde por depende do que abre na tela** (mapeia com `inspect_timeline` nos primeiros
~1200 frames):
- abre em tela **cheia** (rosto, cena escura): hook do frame 0, terminando uns 15-20
  frames ANTES de qualquer mudanca de layout
- abre em tela **clara** (screenshot, slide): texto branco no topo some. Poe no terco
  inferior sobre a pessoa (fundo escuro = legivel), ou acha a 1a janela de tela cheia
  e poe ali

> O MCP nao expoe controle de sombra nem de entrelinha: o texto sai chapado. Por isso
> a posicao importa tanto aqui. Se o teu conteudo e majoritariamente tela clara, o
> backend ffmpeg resolve melhor: la o hook e PNG com contorno e fica legivel em
> qualquer fundo.

### 3. A/V dessincronizado (so se a TUA fonte tiver)

Mede antes. Nao chuta e nao copia numero de tutorial: o offset e da tua cadeia de
captura.

Nao da pra deslocar so o video ou so o audio de um clipe linkado (trim e move
propagam pro parceiro, e nao ha unlink no MCP). Solucao: **clipe-carrier** (2a copia
do mesmo media) + esconder/silenciar.

| Situacao | Variante | Como |
|---|---|---|
| corte comeca no frame 0 da fonte | adiantar video | `set_clip_properties` no video principal `trimStartFrame += offset` (propaga audio); `add_clips` carrier no trimStart original; carrier AUDIO audivel, audio original volume 0, carrier VIDEO opacity 0 |
| corte termina no fim da fonte, ou no meio | atrasar audio | `add_clips` carrier com `trimStart = trimStart_do_bloco - offset`; carrier AUDIO audivel, audio original volume 0, carrier VIDEO opacity 0 |

Valida a imagem com `inspect_timeline`. O audio nao da pra ouvir pelo MCP: confia na
matematica do offset e confere no app depois.

### 4. Exportar

`export_project {mode: "video", codec: "H.264", resolution: "1080p", outputPath: ...}`.
Renderiza em background. Poll o arquivo com `ffprobe` ate a duracao bater.

**Sempre confere o nº de frames** contra o `totalFrames` do corte:
```bash
ffprobe -v error -select_streams v -show_entries stream=nb_frames -of csv=p=0 "<arquivo>"
```
Se `nb_frames` < o esperado, **re-exporta**. O render as vezes trunca: estabiliza o
tamanho cedo, finaliza curto e corta o fim no meio da frase. Visto na pratica.

### 5. Resetar pro proximo corte (deterministico, ~3 chamadas)

**Nao usa `undo`.** Depois de um ripple ele as vezes esvazia a timeline.

1. `remove_tracks` de TODAS as faixas extras (hook, legenda, carrier de video, carrier
   de audio). Deixa so video principal + audio principal.
2. `set_clip_properties` no video principal: `trimStartFrame 0`, `trimEndFrame 0`,
   `durationFrames` = total da fonte. Propaga pro audio linkado.
3. `set_clip_properties` no audio principal: `volume 1` (desmuta).

`get_timeline` tem que mostrar so V1+A1 cheios. Pronto pro proximo isolar.

---

## Gotchas

- Tools do MCP as vezes nao aparecem. Cai pro `curl` JSON-RPC.
- `undo` depois do ripple pode esvaziar a timeline. Reset deterministico, sempre.
- `set_clip_properties` com width+height escala o texto e estoura. So centerX/centerY.
- Projeto pode vir com faixa de legenda de sessao anterior (centenas de clipes de
  texto), inchando o `get_timeline`. `remove_tracks` nela antes de comecar.
- `get_timeline` fica enorme com muitos clipes. Le por janela (`startFrame`/`endFrame`).
- Ferramenta que distribui legenda em blocos iguais atrasa progressivamente. Monta do
  timestamp por palavra.
