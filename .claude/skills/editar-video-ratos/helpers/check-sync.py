#!/usr/bin/env python3
"""
Confere se duas ou mais fontes servem pra multicam por TROCA DE FONTE.

O metodo de multicam da skill so funciona se as fontes forem o MESMO take, gravado
junto, com numeracao de frame identica. Ai trocar de fonte no frame X e trocar de
camera, e o audio nao se mexe. Se as fontes NAO forem sincronizadas, a troca
desalinha a fala e nao tem conserto barato.

Esse script responde: da pra tratar como sample-synced?

  1. duracao e fps batem?           (ffprobe, sem dependencia)
  2. o audio decodificado e IDENTICO? (md5 via ffmpeg, sem dependencia)
       Esse e o caso comum: um app de captura que grava tela e camera cospe dois
       arquivos com a MESMA trilha de audio. md5 igual = sync perfeito, fim.
  3. se o audio difere (microfones diferentes), tenta cross-correlacao (precisa numpy)

Uso:  check-sync.py <fonte1> <fonte2> [fonte3 ...]
"""
import subprocess, sys, json


def ffprobe(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json",
         "-show_entries", "format=duration:stream=codec_type,r_frame_rate,nb_frames", path],
        capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"erro: ffprobe falhou em {path}\n{r.stderr}")
    d = json.loads(r.stdout)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), None)
    fps = None
    if v and v.get("r_frame_rate"):
        num, _, den = v["r_frame_rate"].partition("/")
        fps = float(num) / float(den or 1)
    return {"dur": float(d["format"]["duration"]), "fps": fps,
            "frames": int(v["nb_frames"]) if v and v.get("nb_frames", "N/A").isdigit() else None}


def audio_md5(path):
    """md5 do audio DECODIFICADO e normalizado. Iguala fontes com container/codec diferente."""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path,
         "-vn", "-ar", "16000", "-ac", "1", "-f", "md5", "-"],
        capture_output=True, text=True)
    if r.returncode:
        return None
    return r.stdout.strip().replace("MD5=", "")


def offset_por_correlacao(a, b):
    """segundos que b esta atrasado em relacao a a. precisa numpy."""
    try:
        import numpy as np
    except ImportError:
        return None, "numpy nao instalado (pip install numpy) — nao deu pra medir o offset"

    def envelope(path):
        r = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path,
             "-vn", "-ar", "1000", "-ac", "1", "-f", "s16le", "-"],
            capture_output=True)
        x = np.frombuffer(r.stdout, dtype=np.int16).astype(np.float64)
        return np.abs(x)  # envelope de amplitude a 1kHz: barato e suficiente pra achar o offset

    ea, eb = envelope(a), envelope(b)
    n = min(len(ea), len(eb))
    if n < 1000:
        return None, "audio curto demais pra correlacionar"
    ea, eb = ea[:n] - ea[:n].mean(), eb[:n] - eb[:n].mean()
    c = np.correlate(ea, eb, mode="full")
    lag = c.argmax() - (n - 1)
    denom = (np.linalg.norm(ea) * np.linalg.norm(eb))
    corr = c.max() / denom if denom else 0
    return lag / 1000.0, f"correlacao {corr:.3f}"


def main():
    if len(sys.argv) < 3:
        sys.exit("uso: check-sync.py <fonte1> <fonte2> [fonte3 ...]")
    fontes = sys.argv[1:]

    print("=" * 70)
    infos = {}
    for f in fontes:
        i = ffprobe(f)
        infos[f] = i
        fr = i["frames"] if i["frames"] else "?"
        print(f"{f}\n  duracao {i['dur']:.3f}s | fps {i['fps']:.3f} | frames {fr}")
    print("=" * 70)

    base = fontes[0]
    ok = True

    durs = [i["dur"] for i in infos.values()]
    if max(durs) - min(durs) > 0.05:
        print(f"REPROVADO: duracoes diferem em {max(durs) - min(durs):.3f}s (tolerancia 0.05s).")
        print("  Fontes de duracao diferente nao sao o mesmo take. Multicam por troca de fonte")
        print("  nao se aplica: sincroniza no teu editor primeiro, ou edita uma fonte so.")
        ok = False

    fpss = [i["fps"] for i in infos.values() if i["fps"]]
    if fpss and max(fpss) - min(fpss) > 0.01:
        print(f"REPROVADO: fps diferentes ({sorted(set(round(f, 3) for f in fpss))}).")
        print("  Numeracao de frame nao bate entre as fontes. Reencoda tudo pro mesmo fps antes.")
        ok = False

    if not ok:
        sys.exit(1)

    md5s = {f: audio_md5(f) for f in fontes}
    if len(set(md5s.values())) == 1 and None not in md5s.values():
        print("APROVADO: audio IDENTICO nas fontes (md5 igual).")
        print("  Mesmo take, sample-synced. Podes trocar de fonte em qualquer frame.")
        print("  A emenda de audio na troca e invisivel porque o audio nao muda.")
        return

    print("Audio difere entre as fontes (md5 diferente). Medindo offset...")
    for f in fontes[1:]:
        off, nota = offset_por_correlacao(base, f)
        if off is None:
            print(f"  {f}: {nota}")
            print("  Sem medicao: confere o sync labial na mao antes de confiar na troca.")
            continue
        ms = off * 1000
        veredito = "OK" if abs(ms) <= 20 else "CUIDADO"
        print(f"  {f}: offset {ms:+.0f}ms vs {base} ({nota}) -> {veredito}")
        if abs(ms) > 20:
            print("     Acima de ~20ms da pra notar na troca. Alinha as fontes antes,")
            print("     ou compensa o offset no trimStart de cada segmento.")


if __name__ == "__main__":
    main()
