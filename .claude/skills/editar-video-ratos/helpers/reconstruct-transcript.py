#!/usr/bin/env python3
"""
Reconstroi a transcricao da timeline ATUAL a partir da transcricao ORIGINAL da fonte.

Pra que serve: alguns editores truncam a transcricao quando a timeline fica muito
fragmentada (dezenas de clipes) e param de devolver fala no meio. Esse script
remonta mapeando o source-range de cada clipe de volta pras palavras originais.

USE COMO ULTIMO RECURSO. A transcricao REAL da timeline (pedida pro editor) e a
verdade; essa reconstrucao e uma aproximacao construida em cima dos timestamps do
ASR, que sao inflados. Ela e PESSIMISTA: acha que comeu palavra de fronteira que
na real esta la, e gera falso alarme. So usa quando o editor trunca de verdade.

Uso:
  reconstruct-transcript.py <flat-original.txt> <clips.txt> [-o saida.txt] [--fps 30]

  flat-original.txt : transcricao da fonte INTEIRA (indice|start|end|texto),
                      feita 1x no inicio, em unidade de FONTE
  clips.txt         : um clipe por linha, da track de video, em ordem de timeline:
                        timelineStart|sourceTrimStart|duracao
                      (tudo na mesma unidade do flat)

Saida: indice|start|end|texto em unidade de TIMELINE atual.
"""
import argparse, sys


def main():
    p = argparse.ArgumentParser()
    p.add_argument("flat")
    p.add_argument("clips")
    p.add_argument("-o", "--out", default="/dev/stdout")
    p.add_argument("--fps", type=float, default=30.0, help="so pro resumo em stderr")
    args = p.parse_args()

    words = []
    for l in open(args.flat):
        l = l.rstrip("\n")
        if not l:
            continue
        _, s, e, t = l.split("|", 3)
        words.append((int(s), int(e), t))
    words.sort()

    clips = []
    for n, l in enumerate(open(args.clips), 1):
        l = l.strip()
        if not l:
            continue
        try:
            tl, src, dur = (int(x) for x in l.split("|"))
        except ValueError:
            sys.exit(f"erro: clips.txt linha {n} malformada: {l!r}\n"
                     f"  esperado: timelineStart|sourceTrimStart|duracao")
        clips.append((tl, src, dur))

    if not clips:
        sys.exit("erro: clips.txt vazio.")

    out = []
    for tl, src, dur in clips:
        a, b = src, src + dur
        for ws, we, t in words:
            if a <= ws < b:  # palavra COMECA dentro do source-range do clipe
                out.append((ws - src + tl, we - src + tl, t))
    out.sort()

    with open(args.out, "w") as f:
        for idx, (s, e, t) in enumerate(out, 1):
            f.write(f"{idx}|{s}|{e}|{t}\n")

    ultima = out[-1][0] if out else 0
    seg = ultima / args.fps
    sys.stderr.write(f"reconstruidas {len(out)} palavras de {len(clips)} clipes; "
                     f"ultima fala @{ultima} = {int(seg // 60)}:{int(seg % 60):02d}\n")
    sys.stderr.write("lembra: isso e aproximacao. Confirma pela transcricao real do editor.\n")


if __name__ == "__main__":
    main()
