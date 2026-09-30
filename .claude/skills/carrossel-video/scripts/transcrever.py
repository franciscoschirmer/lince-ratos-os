#!/usr/bin/env python3
"""Transcreve o AUDIO de um video PUBLICADO e cospe um .srt na linha do tempo REAL.

Existe pro caminho em que nao ha legenda automatica pra baixar: video sem
auto-sub no YouTube, video de outra plataforma (Instagram, TikTok, Vimeo...) ou
um arquivo local na maquina. O resto da skill continua igual: o ancorar.py le
esse .srt do mesmo jeito que leria a legenda do YouTube.

POR QUE ISSO NAO FERE A REGRA "nunca usar transcricao":
  o aviso da skill e contra usar a transcricao do PROJETO DE EDICAO, que fica
  dessincronizada porque muito canal publica com correcao de velocidade e o erro
  cresce ao longo do video. Aqui a transcricao e do AUDIO JA PUBLICADO, entao o
  timecode ESTA na linha do tempo real. E a mesma fonte que a auto-sub, so que
  gerada por nos quando o YouTube nao deu.

Motores (--motor):
  auto        assemblyai se houver ASSEMBLYAI_API_KEY, senao whisper local
  whisper     local, gratis, sem chave. precisa: pip install openai-whisper
  assemblyai  precisa ASSEMBLYAI_API_KEY no ambiente ou no .env (~US$0.12/hora)

Uso:
  transcrever.py <audio-ou-video> -o video.pt.srt
  transcrever.py aula.mp4 -o video.pt.srt --motor whisper --modelo medium --idioma pt

CACHE: a transcricao vai pra .cache/<hash>.json ao lado da saida e e reusada.
Nao re-transcreve fonte que nao mudou. --force ignora o cache.

MODELO DO WHISPER (--modelo, default medium):
  o timecode por palavra do 'base' derrapa e vira corte que abre no meio da
  oracao. 'medium' e mais lento mas ancora melhor. So use 'base' se for apenas
  LER a transcricao pra escolher trecho, nunca pra cortar em cima dela.
"""
import argparse, hashlib, json, os, subprocess, sys, time
from pathlib import Path


def carrega_env():
    """le .env da raiz da skill sem depender de python-dotenv"""
    for base in (Path(__file__).resolve().parent.parent, Path.cwd()):
        env = base / ".env"
        if not env.exists():
            continue
        for line in env.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sha_fonte(path):
    h = hashlib.sha256()
    st = os.stat(path)
    h.update(f"{os.path.abspath(path)}|{st.st_size}|{int(st.st_mtime)}".encode())
    return h.hexdigest()[:16]


def extrai_audio(fonte, dest):
    """16kHz mono wav: menor, mais rapido, e o que os dois motores querem.
    Serve tanto pra video quanto pra audio ja solto."""
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(fonte),
         "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", str(dest)],
        check=True)
    return dest


# ---- motores: cada um devolve [{"text","start","end"}] com start/end em SEGUNDOS ----

def via_whisper(audio, idioma, modelo):
    try:
        import whisper  # noqa
    except ImportError:
        sys.exit("erro: whisper nao instalado.\n"
                 "  pip install openai-whisper\n"
                 "ou usa AssemblyAI: poe ASSEMBLYAI_API_KEY no .env e roda com --motor assemblyai")
    import whisper
    sys.stderr.write(f"whisper: carregando modelo '{modelo}' (a 1a vez baixa)...\n")
    m = whisper.load_model(modelo)
    sys.stderr.write("whisper: transcrevendo (sem GPU isso demora, ~1x a duracao do video)...\n")
    r = m.transcribe(str(audio), language=idioma, word_timestamps=True, verbose=False)
    words = []
    for seg in r.get("segments", []):
        for w in seg.get("words", []):
            t = w.get("word", "").strip()
            if t:
                words.append({"text": t, "start": float(w["start"]), "end": float(w["end"])})
    return words


def via_assemblyai(audio, idioma, key):
    import urllib.request
    base = "https://api.assemblyai.com/v2"

    def req(url, data=None, method="GET", raw=False):
        r = urllib.request.Request(url, method=method)
        r.add_header("authorization", key)
        body = None
        if raw:
            body = data
        elif data is not None:
            r.add_header("content-type", "application/json")
            body = json.dumps(data).encode()
        with urllib.request.urlopen(r, body, timeout=300) as resp:
            return json.loads(resp.read())

    sys.stderr.write("assemblyai: subindo audio...\n")
    up = req(f"{base}/upload", data=Path(audio).read_bytes(), method="POST", raw=True)
    sys.stderr.write("assemblyai: transcrevendo...\n")
    job = req(f"{base}/transcript", data={
        "audio_url": up["upload_url"],
        "language_code": idioma,
        "punctuate": True,
    }, method="POST")
    while True:
        st = req(f"{base}/transcript/{job['id']}")
        if st["status"] == "completed":
            break
        if st["status"] == "error":
            sys.exit(f"assemblyai erro: {st.get('error')}")
        time.sleep(3)
    return [{"text": w["text"], "start": w["start"] / 1000.0, "end": w["end"] / 1000.0}
            for w in st.get("words", [])]


# ---- palavras -> .srt (uma cue por punhado de palavras, timecode real) ----

def ts(seg):
    if seg < 0:
        seg = 0
    h = int(seg // 3600)
    m = int((seg % 3600) // 60)
    s = int(seg % 60)
    ms = int(round((seg - int(seg)) * 1000))
    if ms == 1000:
        ms = 0
        s += 1
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def escreve_srt(words, out, por_cue=8):
    """Agrupa palavras em cues curtas. O ancorar.py distribui os onsets dentro
    de cada cue de forma linear, entao cue curta = timecode por palavra melhor."""
    linhas, n = [], 0
    for i in range(0, len(words), por_cue):
        grupo = words[i:i + por_cue]
        n += 1
        ini = grupo[0]["start"]
        fim = grupo[-1]["end"]
        texto = " ".join(w["text"] for w in grupo).strip()
        linhas.append(f"{n}\n{ts(ini)} --> {ts(fim)}\n{texto}\n")
    Path(out).write_text("\n".join(linhas), encoding="utf-8")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("fonte", help="video ou audio (mp4, webm, m4a, wav...)")
    p.add_argument("-o", "--out", default="video.pt.srt")
    p.add_argument("--motor", choices=["auto", "whisper", "assemblyai"], default="auto")
    p.add_argument("--idioma", default="pt")
    p.add_argument("--modelo", default="medium", help="whisper: tiny/base/small/medium/large")
    p.add_argument("--por-cue", type=int, default=8, help="palavras por cue no .srt")
    p.add_argument("--force", action="store_true", help="ignora o cache e transcreve de novo")
    args = p.parse_args()

    carrega_env()
    if not Path(args.fonte).exists():
        sys.exit(f"erro: fonte nao encontrada: {args.fonte}")

    motor = args.motor
    key = os.environ.get("ASSEMBLYAI_API_KEY", "").strip()
    if motor == "auto":
        motor = "assemblyai" if key else "whisper"
    if motor == "assemblyai" and not key:
        sys.exit("erro: --motor assemblyai mas ASSEMBLYAI_API_KEY vazia. Poe no .env.")

    cache_dir = Path(args.out).resolve().parent / ".cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    chave = f"{sha_fonte(args.fonte)}-{motor}"
    if motor == "whisper":
        chave += f"-{args.modelo}"
    chave += f"-{args.idioma}"
    cache = cache_dir / f"{chave}.json"

    if cache.exists() and not args.force:
        sys.stderr.write(f"cache: reusando {cache.name} (--force pra refazer)\n")
        words = json.loads(cache.read_text())
    else:
        wav = cache_dir / f"{sha_fonte(args.fonte)}.wav"
        if not wav.exists():
            sys.stderr.write("extraindo audio...\n")
            extrai_audio(args.fonte, wav)
        words = via_whisper(wav, args.idioma, args.modelo) if motor == "whisper" \
            else via_assemblyai(wav, args.idioma, key)
        cache.write_text(json.dumps(words))
        sys.stderr.write(f"cache: gravado em {cache.name}\n")

    if not words:
        sys.exit("erro: transcricao vazia. Conferiu se a fonte tem audio?")

    escreve_srt(words, args.out, args.por_cue)
    dur = words[-1]["end"]
    sys.stderr.write(f"ok: {len(words)} palavras, {dur / 60:.1f}min, motor={motor}\n")
    sys.stderr.write(f"-> {args.out}\n")


if __name__ == "__main__":
    main()
