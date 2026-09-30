#!/usr/bin/env python3
"""
Converte a saida do detect-silences.sh em ranges de corte.
Apara cada pausa longa deixando um respiro, sem cortar a pausa inteira (senao a
emenda fica robotica e a fala colada demais).

Uso:
  silences-to-ranges.py <sil.txt> [--limiar 0.6] [--fps 30] [--max 1800]
                                  [--merge-gap 0.7] [--unit frames|s|ms]

  --limiar     so apara pausa MAIOR que isso, em SEGUNDOS.
               0.5 agressivo, 0.6 equilibrado, 0.8 conservador
  --fps        fps da fonte (usado pra converter quando --unit frames)
  --max        duracao da fonte em SEGUNDOS (nao em frames), pra nao gerar range
               alem do fim. Pega com: ffprobe -v error -show_entries format=duration
  --merge-gap  junta silencios separados por menos que isso, em SEGUNDOS. LER A NOTA
  --unit       unidade de SAIDA. frames pro Palmier, s pro video-use/ffmpeg

  Todo parametro de tempo aqui e em SEGUNDOS. So a saida muda de unidade.

NOTA MERGE-GAP (leia antes de aumentar esse valor):
  O silencedetect FRAGMENTA uma pausa longa quando tem um estalo, respiracao ou
  ruido de boca no meio dela. Uma pausa real de 2s vira tres silencios de 0.5s
  separados por ~0.05s de "fala" que nao e fala. Cada pedaco fica abaixo do limiar,
  todos sao descartados, e a pausa longa sobrevive inteira no corte final.
  Juntar silencios separados por menos de --merge-gap conserta isso.

  MAS o intervalo entre dois silencios pode ser FALA DE VERDADE. Esse script so ve
  os timestamps do silencedetect, nao o audio: ele nao sabe distinguir um estalo de
  uma palavra curta. Fundir por cima de fala APAGA a palavra, e apaga em silencio.

  Por isso o default e 0.15s: estalo e respiracao duram ~50-150ms, palavra nao.
  Medido num video real de 12min: com 0.7s o script comia 21 palavras faladas; com
  0.15s a fala fica intacta e os slivers ainda fundem.
  SUBIR esse valor troca dead-air por palavra comida. 0.3 ja custa ~3 palavras/12min.

Saida: resumo em stderr + JSON dos ranges (ordenados, sem overlap) na ULTIMA linha
do stdout. Parseia so a ultima linha.
"""
import argparse, json, re, sys


def parse_silences(path):
    """le a saida do silencedetect -> [(inicio_s, fim_s, duracao_s)]"""
    out, start = [], None
    for line in open(path):
        m = re.search(r"silence_start: (-?[\d.]+)", line)
        if m:
            start = max(0.0, float(m.group(1)))
            continue
        m = re.search(r"silence_end: ([\d.]+).*silence_duration: ([\d.]+)", line)
        if m and start is not None:
            out.append((start, float(m.group(1)), float(m.group(2))))
            start = None
    return out


def merge_proximos(sils, gap):
    """junta silencios separados por < gap (estalo/respiracao no meio da pausa)"""
    if not sils:
        return []
    sils = sorted(sils)
    out = [list(sils[0])]
    for a, b, _ in sils[1:]:
        if a - out[-1][1] < gap:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b, 0])
    return [(a, b, b - a) for a, b, _ in out]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("sil")
    p.add_argument("--limiar", type=float, default=0.6)
    p.add_argument("--fps", type=float, default=30.0)
    p.add_argument("--max", type=float, default=None, help="duracao da fonte em SEGUNDOS")
    p.add_argument("--merge-gap", type=float, default=0.15,
                   help="junta silencios separados por menos que isso (s). "
                        "Subir apaga fala: ler a nota no topo do arquivo")
    p.add_argument("--unit", choices=["frames", "s", "ms"], default="frames")
    p.add_argument("--respiro-head", type=float, default=4, help="frames de respiro no inicio da pausa")
    p.add_argument("--respiro-tail", type=float, default=5, help="frames de respiro no fim da pausa")
    args = p.parse_args()

    brutos = parse_silences(args.sil)
    if not brutos:
        sys.stderr.write("nenhum silencio no arquivo. conferiu o detect-silences.sh?\n")
        print("[]")
        return

    sils = merge_proximos(brutos, args.merge_gap)
    fundidos = len(brutos) - len(sils)

    # respiro convertido pra segundos, pra matematica ficar numa unidade so
    head_s, tail_s = args.respiro_head / args.fps, args.respiro_tail / args.fps

    def conv(v):
        if args.unit == "frames":
            return round(v * args.fps)
        if args.unit == "ms":
            return round(v * 1000)
        return round(v, 3)

    ranges, removido_s = [], 0.0
    for a, b, d in sils:
        if d <= args.limiar:
            continue
        ca, cb = a + head_s, b - tail_s
        # clampa em SEGUNDOS, antes de converter: --max e a duracao da fonte em segundos
        if args.max is not None:
            cb = min(cb, args.max)
        if cb <= ca:
            continue
        # ganho minimo: ignora aparo de menos de ~0.15s, nao vale a emenda
        if (cb - ca) < 0.15:
            continue
        ca_c, cb_c = conv(ca), conv(cb)
        if cb_c <= ca_c:
            continue
        ranges.append([ca_c, cb_c])
        removido_s += cb - ca

    ranges.sort()
    # merge de ranges que encostam, pro backend receber uniao limpa sem overlap
    limpos = []
    for r in ranges:
        if limpos and r[0] <= limpos[-1][1]:
            limpos[-1][1] = max(limpos[-1][1], r[1])
        else:
            limpos.append(list(r))
    overlap_ok = all(limpos[i][1] <= limpos[i + 1][0] for i in range(len(limpos) - 1))

    sys.stderr.write(
        f"silencios: {len(brutos)} brutos -> {len(sils)} apos merge (<{args.merge_gap}s juntados: {fundidos})\n"
        f"acima do limiar {args.limiar}s: {len(limpos)} aparos, sem overlap: {overlap_ok}\n"
        f"remove {removido_s:.2f}s (unidade de saida: {args.unit})\n"
    )
    if args.merge_gap > 0.25 and fundidos:
        sys.stderr.write(
            f"AVISO: --merge-gap {args.merge_gap}s e alto. Um intervalo desse tamanho entre\n"
            f"  silencios costuma ser FALA, nao estalo. {fundidos} silencios foram fundidos e a\n"
            f"  fala entre eles vai ser APAGADA sem aviso no video final. Estalo/respiracao\n"
            f"  dura ~50-150ms: 0.15 pega eles sem comer palavra.\n"
        )
    print(json.dumps(limpos))


if __name__ == "__main__":
    main()
