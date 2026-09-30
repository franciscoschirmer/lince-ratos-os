#!/usr/bin/env python3
"""
Transcreve com timestamp POR PALAVRA e cospe um flat unico, independente do motor.

  flat: indice|start|end|texto   (1 palavra por linha)

Motores (--motor):
  auto        assemblyai se tiver chave, senao whisper local
  whisper     local, gratis, sem chave. precisa: pip install openai-whisper
  assemblyai  precisa ASSEMBLYAI_API_KEY no ambiente ou no .env. ~US$0.12/hora

  ElevenLabs Scribe nao entra aqui de proposito: a skill video-use ja transcreve
  por ele nativamente. Se tu usa o backend video-use com chave ElevenLabs, deixa
  ele fazer. Esse helper existe pro caminho sem chave (whisper) e pro AssemblyAI.

Uso:
  transcribe.py <video.mp4> --unit frames --fps 30 -o flat.txt
  transcribe.py <video.mp4> --unit ms -o flat.txt --motor whisper --idioma pt

CACHE: a transcricao vai pra .cache/<hash>.json ao lado da saida e e reusada.
Nao re-transcreve fonte que nao mudou. Transcrever de novo custa tempo (whisper)
ou dinheiro (api) e o resultado e identico. Use --force pra ignorar o cache.

VERBATIM importa: o marcador falado ("pato amarelo") precisa sobreviver na
transcricao. O AssemblyAI roda com disfluencies=true por isso. O Whisper NAO tem
modo verbatim de verdade e limpa parte das hesitacoes; o marcador em si costuma
sobreviver (e fala normal, nao disfluencia), mas o timestamp por palavra dele
derrapa mais. O find-markers.py compensa com fuzzy match, e o passe de
verificacao no fim da skill existe justamente pra pegar o que vazou.

MODELO DO WHISPER (--modelo, default medium):
  Custo medido num Mac sem GPU, video de 12min:
    base    ~0.1x a duracao do video (12min -> ~1min). Timestamp por palavra
            derrapa feio: ja datou duas palavras em 140ms, o que e impossivel.
    medium  varias vezes mais lento que base, timestamp bem melhor.
  O default e medium porque timestamp ruim vira CORTE ruim, e corte ruim so
  aparece depois do render. Se tu so quer ler a transcricao (escolher trecho,
  achar assunto) e nao cortar em cima dela, --modelo base resolve e e muito
  mais rapido. Com Whisper, o passe de verificacao no fim da skill nao e
  opcional: e ele que pega o marcador que vazou por timestamp torto.
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


def extrai_audio(video, dest):
    """16kHz mono wav: menor, mais rapido e o que os dois motores querem"""
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(video),
         "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", str(dest)],
        check=True)
    return dest


# ---------- motores: cada um devolve [{"text","start","end"}] com start/end em SEGUNDOS ----------

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
        "disfluencies": True,   # verbatim: preserva o marcador falado e as hesitacoes
        "punctuate": True,
    }, method="POST")

    while True:
        st = req(f"{base}/transcript/{job['id']}")
        if st["status"] == "completed":
            break
        if st["status"] == "error":
            sys.exit(f"assemblyai erro: {st.get('error')}")
        time.sleep(3)

    # AssemblyAI devolve ms
    return [{"text": w["text"], "start": w["start"] / 1000.0, "end": w["end"] / 1000.0}
            for w in st.get("words", [])]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("fonte")
    p.add_argument("-o", "--out", default="flat.txt")
    p.add_argument("--motor", choices=["auto", "whisper", "assemblyai"], default="auto")
    p.add_argument("--idioma", default="pt")
    p.add_argument("--modelo", default="medium", help="modelo do whisper: tiny/base/small/medium/large")
    p.add_argument("--unit", choices=["frames", "ms", "s"], default="frames")
    p.add_argument("--fps", type=float, default=30.0)
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
    # A chave inclui modelo e idioma: sem isso, pedir --modelo medium depois de rodar
    # com base devolvia o resultado do base CALADO. Isso mata justamente a rota de
    # recuperacao quando o timestamp derrapa (o reflexo e subir de modelo).
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

    def conv(seg):
        if args.unit == "frames":
            return round(seg * args.fps)
        if args.unit == "ms":
            return round(seg * 1000)
        return round(seg, 3)

    with open(args.out, "w") as f:
        for i, w in enumerate(words, 1):
            f.write(f"{i}|{conv(w['start'])}|{conv(w['end'])}|{w['text']}\n")

    dur = words[-1]["end"]
    sys.stderr.write(f"ok: {len(words)} palavras, {dur / 60:.1f}min, motor={motor}, unidade={args.unit}\n")
    sys.stderr.write(f"-> {args.out}\n")


if __name__ == "__main__":
    main()
