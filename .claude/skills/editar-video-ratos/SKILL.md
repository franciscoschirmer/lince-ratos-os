---
name: editar-video-ratos
description: Limpa a gravacao bruta de um video e devolve um corte pronto pra publicar. Remove os erros que tu marcou falando um marcador ("pato amarelo"), apara pausa e dead-air medindo o audio de verdade, corta redundancia, e monta a troca de camera quando tu gravou tela e rosto ao mesmo tempo. Funciona com o editor Palmier Pro (Mac, GUI) ou com a skill video-use (ffmpeg, headless, qualquer OS). Use quando o usuario pedir pra editar/limpar/cortar os erros de um video gravado, tirar as pausas, remover os trechos que ele errou, montar a troca cara/tela, ou mencionar "edita esse video", "limpa a gravacao", "tira os erros", "corta as pausas", "marcador falado". Pra transformar um video longo em cortes curtos pra TikTok/Reels, usa a skill cortes-video-ratos.
---

# Editar Video Ratos

Pega a gravacao bruta e devolve **um video limpo**: erros fora, pausa aparada,
troca de camera montada, emendas que nao quebram a mensagem.

A ideia central: **tu marca o erro falando, na hora da gravacao.** Errou, fala o
marcador ("pato amarelo"), respira e refaz a frase. Nao para a gravacao, nao anota
timecode, nao pensa em edicao. Depois essa skill acha os marcadores na transcricao,
resolve onde comeca e termina cada corte, e aplica.

Funciona com dois backends. A skill decide, o backend executa.

| | **Palmier Pro** | **video-use** |
|---|---|---|
| O que e | editor com GUI, MCP na timeline | ffmpeg headless, skill open source |
| Precisa | Mac + app | qualquer OS, `ffmpeg` |
| Unidade | frames da fonte | segundos |
| Vantagem | tu revisa com o olho, sobra projeto editavel | roda em qualquer lugar, automatiza inteiro |

---

## Setup (primeira vez)

Se nao existe `config.json` na pasta da skill, faz o setup **conversando**, uma
pergunta de cada vez. Copia o `config.example.json` e preenche. Nunca assume: o que
esta abaixo sao os defaults do exemplo, nao a preferencia do usuario.

1. **Qual palavra tu fala quando erra?** Explica o criterio antes de perguntar:
   precisa ser algo que tu **nunca falaria por acaso** no teu conteudo. Por isso
   "pato amarelo" funciona bem: e absurdo o suficiente pra nunca aparecer sozinho, e
   tem duas silabas fortes que qualquer ASR pega. "corta" ou "erro" sao ruins, tu
   vai falar sem querer. Se ele nao tem marcador ainda, ajuda a escolher e avisa que
   so vale a partir da PROXIMA gravacao.
2. **Quantos niveis de rollback?** Um marcador so ja resolve (volta uma frase). Dois
   dao controle: um pra "volta pouco" e outro pra "volta muito, as vezes o bloco
   inteiro". Mais que dois raramente compensa.
3. **Nivel de silencio.** 0.5 agressivo, 0.6 equilibrado, 0.8 conservador. Se ele
   nao souber, sugere 0.6 e explica que da pra mudar depois.
4. **Cortar redundancia nao marcada?** Default `nao`, e explica o porque: se o
   usuario ja marca o que quer fora, varrer repeticao semantica so gera pergunta
   sobre coisa que ele quis manter. So liga se ele pedir.
5. **Backend e transcricao.** Detecta antes de perguntar (secao abaixo). So pergunta
   se tiver os dois, ou nenhum.

Grava o `config.json` e mostra o que ficou. Da segunda vez em diante, **le o config
e nao pergunta mais nada** disso.

## Detectar o ambiente

Antes de perguntar qualquer coisa de backend, olha:

- Palmier: `claude mcp list` mostra `palmier-pro` conectado?
- video-use: `~/.claude/skills/video-use/` existe?
- Transcricao: `ASSEMBLYAI_API_KEY` no `.env`? `python3 -c "import whisper"` passa?
- `ffmpeg` no PATH? Sem ele nao roda nada: manda `brew install ffmpeg`.

Achou um backend so, usa ele e avisa. Achou os dois, pergunta. Nao achou nenhum,
explica as duas opcoes e o custo de cada uma.

---

## As 4 tarefas (nessa ordem)

Editar nao e so "tirar os erros". Sao quatro coisas, e a ordem importa porque cada
uma muda as coordenadas da seguinte.

0. **Multicam** (se tiver 2+ fontes sincronizadas): montar a troca de camera.
1. **Marcadores**: remover os erros que o usuario marcou falando.
2. **Silencio**: aparar pausa e dead-air, medindo o AUDIO, nunca a transcricao.
3. **Redundancia**: pulada por padrao.

---

## Fase 0: mapear e transcrever

Le o backend em `backends/palmier.md` ou `backends/video-use.md` e segue o mapeamento
de la. Depois:

```bash
# Palmier (frames) — ou pega a transcricao do proprio app, ver backends/palmier.md
python3 helpers/transcribe.py bruto.mp4 --unit frames --fps 30 -o flat.txt

# video-use (segundos)
python3 helpers/transcribe.py bruto.mp4 --unit ms -o flat.txt
```

**Despacha um subagente pra transcricao.** Video de 30min da 5000-6000 palavras. Se
isso entra no teu contexto, tu perde espaco pro que importa, que e decidir os cortes.
O subagente devolve o caminho do arquivo. **Guarda o flat original**: tudo depois
depende dele.

> **Whisper:** o default do helper e `--modelo medium`, porque timestamp ruim vira
> corte ruim. Custo medido num Mac sem GPU: `base` roda a ~0.1x a duracao do video
> (12min viram ~1min) mas com timestamp que derrapa feio; `medium` e varias vezes
> mais lento e bem mais preciso. Se tu so vai LER a transcricao (achar assunto,
> escolher trecho) e nao cortar em cima dela, `--modelo base` resolve.
> Com Whisper, **a fase 5 deixa de ser boa pratica e vira obrigatoria**: e ela que
> pega o marcador que vazou por timestamp torto.

## Fase 1: multicam (opcional)

So se tiver 2+ fontes. Roda `check-sync.py fonte1 fonte2`. Se reprovar, fala pro
usuario e edita uma fonte so. Nao tenta sincronizar na marra.

Aprovado, decide a estrutura de troca. Isso e **decisao editorial**, entao pergunta
se nao for obvio. Um padrao que funciona pra tela + rosto: rosto na abertura e no
encerramento, tela quando ele mostra alguma coisa, e voltar pro rosto nas reflexoes
longas (onde a tela congela e morre).

Faz a troca **coincidir com um corte de marcador** quando der: a emenda ja existe
ali, entao a troca some.

Monta o mapa `[[inicio, fim, "fonte"], ...]` cobrindo `0 -> total`, sem buraco, e
entrega pro backend.

## Fase 2: marcadores

```bash
python3 helpers/find-markers.py flat.txt --config config.json --fps 30
```

Cada cluster = um corte. Pra resolver cada um:

- **Inicio do corte = o `endFrame` da ultima palavra boa ANTES do erro.**
  Nao o start. O `find-markers.py` ja te da o numero certo rotulado, mas presta
  atencao: no TEXTO do contexto as palavras aparecem como `palavra@start`, e usar
  esse start come a ultima palavra boa. E o erro mais comum e o mais chato, porque
  so aparece no video final.
- **Fim do corte = o start da primeira palavra boa da retomada.** A refeita quase
  sempre ecoa as palavras de antes do erro. Corta onde elas batem.
- **Rollback longo volta MAIS.** As vezes o bloco inteiro. Se tem conteudo que
  **reaparece depois** (ele re-explica a mesma coisa), estende o corte pra cobrir a
  primeira passada toda. Confirma procurando a frase repetida no flat. Caso classico:
  o encerramento refeito do zero, onde a instrucao e cortar TODAS as tentativas e
  deixar so a ultima.
- **Sempre corta em fronteira de frase.**

**Distingue marcador-erro de marcador-narracao.** Se o video FALA sobre o sistema de
marcacao, ou o usuario fala direto com o editor ("essa parte aqui e exemplo, nao
corta"), o marcador esta no conteudo e **fica**. So o contexto word-level resolve
isso, entao le. O `find-markers.py` lista SUSPEITAS justamente pra isso.

**Apresenta o plano pro usuario aprovar antes de cortar.** Tabela: timecode, tipo,
o que sai, como fica a emenda. Cortar errado o video principal e caro: um corte
errado so aparece depois do render, e refazer custa mais que perguntar.

## Fase 3: silencio

```bash
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 bruto.mp4)
bash helpers/detect-silences.sh bruto.mp4 -30 0.35 sil.txt
python3 helpers/silences-to-ranges.py sil.txt --limiar 0.6 --fps 30 --max "$DUR"
# --max e a duracao em SEGUNDOS. Todo parametro de tempo do helper e em segundos;
# so a saida muda de unidade (--unit frames pro Palmier, --unit s pro video-use).
```

**Nunca meça silencio pela transcricao.** O timestamp do ASR e uma estimativa de
alinhamento, nao uma medida do audio: ele erra pros dois lados, e de um jeito que
muda por motor e por modelo. Nao da pra corrigir com um fator, so da pra nao usar.
`silencedetect` le o audio de verdade.

O `--merge-gap` (default 0.15) junta silencios que o `silencedetect` fragmentou por
causa de um estalo ou respiracao no meio da pausa. Sem ele, pausa longa some da
lista e sobrevive no corte final.

**Nao aumenta o `--merge-gap` sem pensar.** O script so ve os timestamps do
silencedetect, nao o audio: ele nao distingue um estalo de uma palavra curta, entao
fundir por cima de fala APAGA a palavra sem avisar. Estalo e respiracao duram
~50-150ms, palavra nao. Medido num video real de 12min: `0.7` comia 21 palavras
faladas, `0.3` comia 3, `0.15` nao comeu nenhuma e ainda fundiu os slivers.

Caveat de tela: pausa longa num trecho de tela pode ser ele mostrando alguma coisa
calado. Se o video tem muita tela, conservador e mais seguro que agressivo.

## Fase 4: redundancia (pulada por padrao)

So roda se `config.redundancia` for `perguntar`, ou se o usuario pedir na hora
("da uma varrida de redundancia", "ta repetindo alguma coisa?").

Quando rodar: despacha um subagente com a transcricao **final** (pos-corte, com
timecode) pra listar repeticao semantica distante e quase-verbatim. Ele devolve
rotulo, ocorrencias com timecode e qual manter. **Apresenta e o usuario decide.**
Nunca corta redundancia sozinho.

## Fase 5: aplicar, verificar, exportar

1. **Uniao dos ranges** (marcadores + silencio + redundancia aprovada) num espaco de
   coordenadas so, ordenada e sem overlap. O backend recebe isso numa chamada so.
   Pro video-use, converte com `ranges-to-keep.py`.
2. **Verifica.** Palmier: transcricao real da timeline. video-use: re-transcreve o
   output. Nos dois: roda `find-markers.py` de novo e confirma **zero marcador
   restante**, e le as emendas.
   Isso nao e formalidade. O marcador vaza: quando ele cola numa palavra que fica,
   o som comeca antes do timestamp que o ASR reporta, e sobra um pedaco audivel
   mesmo cortando no tempo "certo". So a verificacao pega.
3. **Timecodes pro usuario conferir**: as trocas de camera e as emendas maiores. Ele
   revisa, aponta o que ficou torto, tu refina cirurgico. Se tem multicam, pede pra
   ele confirmar o sync labial numa troca: e a unica coisa que so o olho garante.
4. **Exporta** pelo backend. Sempre confere o resultado com `ffprobe` (duracao e
   `nb_frames`): render trunca as vezes e finaliza curto, cortando o fim no meio da
   frase.
5. **Registro.** Um `REGISTRO-CORTES.md` na pasta do video: os cortes (timecode,
   tipo, o que saiu), as trocas de camera, duracao antes e depois. E a transcricao
   do video ja cortado, que serve pra gerar titulo, descricao e thumb depois.

---

## Gotchas

- **Corta no FIM da palavra, nao no inicio.** O erro que mais come palavra boa.
- **Verifica pela transcricao real, nao pela reconstrucao.** Frames de ASR sao
  inflados, entao a reconstrucao acusa palavra comida que na real esta la.
- **Marcador vaza na emenda.** Sempre re-verifica o output.
- **Nao meça silencio pela transcricao.** Sempre `silencedetect` no audio real.
- **Rollback longo volta mais** do que parece. Procura conteudo repetido.
- **Marcador no conteudo fica.** Le o contexto antes de cortar.
- **Transcricao grande estoura contexto.** Sempre por subagente, sempre em arquivo.
- **Nao re-transcreve fonte que nao mudou.** Os helpers cacheiam. Usa o cache.

## Referencia rapida

| Item | Valor |
|---|---|
| Marcadores | configuraveis no `config.json`, com fuzzy match (todo ASR erra o marcador) |
| Inicio do corte | `endFrame` da ultima palavra boa (NAO o `@start` do contexto) |
| Fim do corte | `startFrame` da 1a palavra boa da retomada |
| Cluster | marcadores a <= 12 palavras = 1 corte (`--gap` pra mudar) |
| Silencio | `silencedetect=noise=-30dB:d=0.35`, limiar 0.6s, merge-gap 0.7s |
| Redundancia | pulada por padrao |
| Aplicar | uniao ordenada sem overlap, 1 chamada |
| Verificar | `find-markers.py` no output, zero marcador restante |
| Ordem | mapear -> multicam -> marcadores -> silencio -> (redundancia) -> aplicar -> verificar -> exportar |
