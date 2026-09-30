#!/usr/bin/env python3
"""
Inverte ranges de REMOCAO em segmentos de MANUTENCAO, e opcionalmente atribui a
fonte de cada segmento (multicam).

POR QUE ISSO EXISTE: os dois backends falam linguas opostas.
  Palmier   -> quer o que SAI  (ripple_delete_ranges recebe os ranges de remocao)
  video-use -> quer o que FICA (edl.json ranges sao os segmentos mantidos)
A skill decide sempre em ranges de REMOCAO (uniao de marcadores + silencio). Esse
helper faz a ponte pro video-use. Inverter na mao e onde se erra fora por um.

Uso:
  ranges-to-keep.py --remove '[[100,200],[500,650]]' --total 3000
  ranges-to-keep.py --remove @cortes.json --total 3000 --unit s
  ranges-to-keep.py --remove @cortes.json --total 57812 \\
                    --fontes '[[0,900,"cara"],[900,5000,"tela"]]' --edl

  --remove  JSON de ranges [[a,b],...] ou @arquivo.json
  --total   duracao total da fonte, na mesma unidade
  --fontes  mapa de multicam [[inicio,fim,"nome"],...] cobrindo 0->total
  --edl     cospe no formato ranges do edl.json do video-use (precisa --unit s)

Saida: JSON dos segmentos mantidos.
"""
import argparse, json, sys


def carrega(v):
    if v.startswith("@"):
        with open(v[1:]) as f:
            txt = f.read().strip()
        # tolera arquivo cuja ULTIMA linha e o JSON (formato do silences-to-ranges.py)
        try:
            return json.loads(txt)
        except json.JSONDecodeError:
            return json.loads(txt.splitlines()[-1])
    return json.loads(v)


def normaliza(rs):
    """ordena e funde ranges que encostam/sobrepoem"""
    rs = sorted([list(r) for r in rs])
    out = []
    for r in rs:
        if r[1] <= r[0]:
            continue
        if out and r[0] <= out[-1][1]:
            out[-1][1] = max(out[-1][1], r[1])
        else:
            out.append(r)
    return out


def inverte(remove, total):
    """ranges de remocao -> segmentos mantidos, cobrindo 0->total"""
    keep, cur = [], 0
    for a, b in remove:
        if a > cur:
            keep.append([cur, a])
        cur = max(cur, b)
    if cur < total:
        keep.append([cur, total])
    return keep


def aplica_fontes(keep, fontes):
    """fatia cada segmento mantido nas fronteiras do mapa de fontes"""
    out = []
    for ka, kb in keep:
        for fa, fb, nome in fontes:
            a, b = max(ka, fa), min(kb, fb)
            if b > a:
                out.append({"source": nome, "start": a, "end": b})
    out.sort(key=lambda s: s["start"])
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--remove", required=True)
    p.add_argument("--total", type=float, required=True)
    p.add_argument("--fontes")
    p.add_argument("--unit", choices=["frames", "s", "ms"], default="frames")
    p.add_argument("--edl", action="store_true", help="formato ranges do edl.json (video-use)")
    args = p.parse_args()

    # valida ANTES de trabalhar: errar depois de imprimir o resumo confunde
    if args.edl and args.unit != "s":
        sys.exit("erro: --edl precisa --unit s (o edl.json do video-use usa segundos).\n"
                 f"  tu passou --unit {args.unit}. Se o teu range esta em frames, "
                 f"divide por --fps antes, ou gera o flat com --unit s.")

    # frames e ms sao inteiros: frame fracionario quebra API de editor que espera int
    total = args.total if args.unit == "s" else int(round(args.total))
    cast = (lambda v: v) if args.unit == "s" else (lambda v: int(round(v)))

    remove = normaliza(carrega(args.remove))
    for a, b in remove:
        if b > total:
            sys.stderr.write(f"aviso: range [{a}, {b}] passa do total ({total}). Vou aparar.\n")
    remove = [[cast(a), cast(min(b, total))] for a, b in remove if a < total]

    keep = [[cast(a), cast(b)] for a, b in inverte(remove, total)]
    rem_tot = sum(b - a for a, b in remove)
    keep_tot = sum(b - a for a, b in keep)

    if args.fontes:
        fontes = [[cast(fa), cast(fb), nome] for fa, fb, nome in carrega(args.fontes)]
        cobertura = sum(fb - fa for fa, fb, _ in fontes)
        if abs(cobertura - total) > 1:
            sys.stderr.write(f"aviso: mapa de fontes cobre {cobertura} mas o total e {total}. "
                             f"Segmento sem fonte some do resultado.\n")
        segs = aplica_fontes(keep, fontes)
    else:
        segs = [{"start": a, "end": b} for a, b in keep]

    sys.stderr.write(f"remove {len(remove)} ranges ({rem_tot:.0f}) | "
                     f"mantem {len(segs)} segmentos ({keep_tot:.0f}) | "
                     f"total {total:.0f} -> {keep_tot:.0f} ({args.unit})\n")
    if args.unit == "s":
        sys.stderr.write(f"duracao final: {keep_tot / 60:.1f}min\n")

    if args.edl:
        print(json.dumps([{"source": s.get("source", "main"),
                           "start": round(s["start"], 3),
                           "end": round(s["end"], 3)} for s in segs], indent=2))
    else:
        print(json.dumps(segs))


if __name__ == "__main__":
    main()
