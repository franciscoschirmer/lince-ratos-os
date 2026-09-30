#!/usr/bin/env python3
"""Ancora um trecho ESCOLHIDO PELO SENTIDO na linha do tempo real do video.

O ponto de corte quem escolhe e quem entendeu o video: entra a frase que abre
e a que fecha, como aparecem na transcricao, SEM depender de pontuacao (a
legenda automatica do YouTube as vezes vem sem um unico ponto final).

O script faz as duas coisas que texto nenhum faz:
  1. empurra o ponto pra respiracao real mais proxima, mas SO se ela estiver
     dentro da janela de ajuste fino. Silencio longe nao e a pausa daquela
     frase, e usar ele engole a frase vizinha
  2. devolve as palavras que o intervalo REALMENTE pega, pra conferir que o
     corte abre e fecha onde se pediu

    python3 ancorar.py <audio> <srt> "<frase que abre>" "<frase que fecha>"
"""
import re, subprocess, sys, unicodedata

# ate onde vale procurar respiracao. Fora disso o silencio e de outra frase.
JANELA_ENTRADA = (-0.80, 0.35)
JANELA_SAIDA = (-0.20, 1.00)
# quando nao ha pausa na janela, o proprio tempo da palavra com uma folga
FOLGA_ENTRADA = 0.25
FOLGA_SAIDA = 0.35


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", s).split()


def _desenrola(cues):
    """Legenda automatica do YouTube costuma vir ROLANDO: cada cue repete o fim
    da anterior e so acrescenta o pedaco novo no fim. Isso enche a linha do tempo
    de palavras duplicadas e QUEBRA o casamento de frase (a sequencia de tokens
    fica interrompida por repeticao). Aqui, pra cada cue, corta do inicio dela o
    trecho que ja apareceu no fim da anterior. Legenda normal (sem rolagem) passa
    intacta: nao ha overlap pra cortar."""
    limpo, prev = [], []
    for t, txt in cues:
        ws = txt.split()
        k = 0
        if prev and ws:
            for kk in range(min(len(prev), len(ws)), 0, -1):
                if [w.lower() for w in prev[-kk:]] == [w.lower() for w in ws[:kk]]:
                    k = kk
                    break
        novo = ws[k:]
        if novo:
            limpo.append((t, " ".join(novo)))
        prev = ws
    return limpo


def palavras(srt):
    """(onset, palavra). O start do bloco e o onset da 1a palavra dele; as
    demais sao distribuidas ate o inicio do bloco seguinte."""
    blocos = open(srt, encoding="utf-8").read().strip().split("\n\n")
    cues = []
    for b in blocos:
        L = b.split("\n")
        if len(L) < 3:
            continue
        h, m, r = L[1].split(" --> ")[0].split(":")
        s, ms = r.split(",")
        cues.append((int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000,
                     " ".join(L[2:]).strip()))
    cues.sort()
    cues = _desenrola(cues)
    out = []
    for i, (t, txt) in enumerate(cues):
        fim = cues[i + 1][0] if i + 1 < len(cues) else t + 3
        ws = txt.split()
        if not ws:
            continue
        passo = (fim - t) / len(ws)
        for j, w in enumerate(ws):
            out.append((t + j * passo, w))
    return sorted(out)


def silencios(audio):
    # stdin fechado: sem isso o ffmpeg engole o stdin de quem chamou, e um
    # laco "while read ... python3 ancorar.py" perde linhas pelo caminho
    saida = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", audio, "-af",
         "silencedetect=noise=-32dB:d=0.25", "-f", "null", "-"],
        capture_output=True, text=True, stdin=subprocess.DEVNULL).stderr
    out, ini = [], None
    for l in saida.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", l)
        if m:
            ini = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", l)
        if m and ini is not None:
            out.append((ini, float(m.group(1))))
            ini = None
    return out


def achar(pal, alvo):
    """(onset da 1a palavra, onset da palavra SEGUINTE a ultima).

    A frase-alvo e tokenizada PALAVRA A PALAVRA e cada palavra e normalizada
    junta, igual ao lado da legenda. Sem isso, contracao com apostrofo ("you're",
    "I'm", "it's") viraria dois tokens no alvo ("you","re") e um so na legenda
    ("youre"), e a frase nunca casaria. Contracao e comum demais em ingles (e
    aparece em pt: "tá", nomes) pra deixar quebrar."""
    a = [j for w in alvo.split() if (j := "".join(norm(w)))]
    seq = ["".join(norm(w)) for _, w in pal]
    for i in range(len(seq) - len(a) + 1):
        if seq[i:i + len(a)] == a:
            fim = pal[i + len(a)][0] if i + len(a) < len(pal) else pal[-1][0]
            return pal[i][0], fim
    return None, None


def encaixar(alvo, cands, janela, folga, sinal):
    """Pausa mais proxima dentro da janela; se nao houver, o tempo + folga."""
    lo, hi = janela
    perto = [c for c in cands if lo <= c - alvo <= hi]
    if perto:
        return min(perto, key=lambda c: abs(c - alvo)), True
    return alvo + sinal * folga, False


def main():
    audio, srt, abre, fecha = sys.argv[1:5]
    pal, sil = palavras(srt), silencios(audio)

    t_abre, _ = achar(pal, abre)
    _, t_fecha = achar(pal, fecha)
    if t_abre is None:
        print(f"NAO ACHEI a frase de abertura: {abre!r}")
        sys.exit(1)
    if t_fecha is None:
        print(f"NAO ACHEI a frase de fechamento: {fecha!r}")
        sys.exit(1)

    entra, ok_e = encaixar(t_abre, [s[1] for s in sil], JANELA_ENTRADA,
                           FOLGA_ENTRADA, -1)
    sai, ok_s = encaixar(t_fecha, [s[0] for s in sil], JANELA_SAIDA,
                         FOLGA_SAIDA, +1)
    dur = sai - entra

    # confere o que o intervalo REALMENTE pega
    ws = [w for t, w in pal if entra <= t < sai]
    limpo = []
    for w in ws:
        if not limpo or limpo[-1] != w:
            limpo.append(w)
    cabeca, cauda = " ".join(limpo[:7]), " ".join(limpo[-7:])

    print(f"  entra {entra:6.2f}  sai {sai:6.2f}  ({dur:4.1f}s)"
          f"  respiracao: {'sim' if ok_e else 'NAO'}/{'sim' if ok_s else 'NAO'}")
    print(f"  ABRE:  {cabeca}")
    print(f"  FECHA: ...{cauda}")
    print(f"  ffmpeg -ss {entra:.2f} -t {dur:.2f}")


main()
