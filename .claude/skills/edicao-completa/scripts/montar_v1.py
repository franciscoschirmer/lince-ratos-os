#!/usr/bin/env python3
"""
Monta o vídeo final a partir de um plano.json: corta, dá zoom, trata o áudio,
desenha legenda e artes na ID do cliente (ASS/libass, sem dependência além do
ffmpeg) e fecha com o cartão final.

Uso: montar.py <pasta-do-video>/plano.json [--rascunho]

  --rascunho  renderiza rápido (ultrafast, crf 28) pra conferir posição de arte

O plano tem os caminhos relativos à pasta dele. Formato: ver SKILL.md.
"""
import argparse, json, re, subprocess, sys, unicodedata
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("plano")
ap.add_argument("--rascunho", action="store_true")
a = ap.parse_args()

PLANO = Path(a.plano).resolve()
BASE = PLANO.parent
p = json.loads(PLANO.read_text(encoding="utf-8"))
ID = json.loads((BASE / p["id"]).read_text(encoding="utf-8"))
TR = json.loads((BASE / p["transcricao"]).read_text(encoding="utf-8"))
FONTE = BASE / p["fonte"]
SAIDA = BASE / p["saida"]

W, H = 1080, 1920


def sonda(arq):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0", str(arq)],
                         capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split(",")[:2]
    return int(w), int(h)


SW, SH = sonda(FONTE)
K = W / SW  # escala das caixas, que vêm em pixels do bruto


def cor(nome_ou_hex, alfa=0):
    """#RRGGBB (ou nome da paleta) -> &HAABBGGRR do ASS"""
    h = ID["cores"].get(nome_ou_hex, nome_ou_hex).lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alfa:02X}{b}{g}{r}".upper()


def cor_tag(nome):
    h = ID["cores"].get(nome, nome).lstrip("#")
    return f"&H{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def ts(t):
    t = max(0, t)
    hh, r = divmod(t, 3600)
    mm, ss = divmod(r, 60)
    return f"{int(hh)}:{int(mm):02d}:{ss:05.2f}"


def retangulo(x, y, w, h, r):
    """caminho de desenho ASS de um retângulo de cantos arredondados"""
    x, y, w, h, r = (round(v) for v in (x, y, w, h, r))
    return (f"m {x+r} {y} l {x+w-r} {y} b {x+w} {y} {x+w} {y} {x+w} {y+r} "
            f"l {x+w} {y+h-r} b {x+w} {y+h} {x+w} {y+h} {x+w-r} {y+h} "
            f"l {x+r} {y+h} b {x} {y+h} {x} {y+h} {x} {y+h-r} "
            f"l {x} {y+r} b {x} {y} {x} {y} {x+r} {y}")


def quebra(txt, maxc):
    linhas, atual = [], ""
    for pal in txt.split():
        if atual and len(atual) + 1 + len(pal) > maxc:
            linhas.append(atual)
            atual = pal
        else:
            atual = f"{atual} {pal}".strip()
    if atual:
        linhas.append(atual)
    return linhas


def norm(s):
    s = re.sub(r"[^\w]", "", s.lower())
    return s


# ---------- linha do tempo: trecho da fonte -> tempo de saída ----------
trechos = p["trechos"]
pos, t = [], 0.0
for tr in trechos:
    pos.append(t)
    t += tr["fim"] - tr["ini"]
DUR_FALA = t
CARTAO = float(p.get("cartao_final_seg", 0))
DUR = DUR_FALA + CARTAO


# ---------- palavras: transcrição do ÁUDIO JÁ CORTADO ----------
# Mapear o tempo da transcrição do bruto pro corte erra justo nas emendas (o whisper
# data a palavra uns 100ms fora e ela some ou sobra). Transcrever o corte resolve as
# duas coisas: a legenda nasce sincronizada e a transcrição serve de conferência.
def grupos_audio():
    g = []
    for tr in trechos:
        if g and abs(g[-1][1] - tr["ini"]) < 1e-6:
            g[-1][1] = tr["fim"]
        else:
            g.append([tr["ini"], tr["fim"]])
    return g

def filtro_audio(rotulo_saida):
    f = []
    gs = grupos_audio()
    for i, (ini, fim) in enumerate(gs):
        d = fim - ini
        f.append(f"[0:a]atrim={ini}:{fim},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,"
                 f"afade=t=out:st={d - 0.012:.3f}:d=0.012[a{i}]")
    f.append("".join(f"[a{i}]" for i in range(len(gs))) + f"concat=n={len(gs)}:v=0:a=1[ac]")
    f.append("[ac]highpass=f=80,afftdn=nf=-30,loudnorm=I=-14:TP=-1.5:LRA=11,"
             f"aresample=48000,apad,atrim=0:{DUR:.3f}{rotulo_saida}")
    return f

WAV = BASE / "corte.wav"
TR_CORTE = BASE / "transcricao-corte.json"
assinatura = json.dumps(trechos)
marca = BASE / ".corte-assinatura"
if not TR_CORTE.exists() or not marca.exists() or marca.read_text(encoding="utf-8") != assinatura:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(FONTE), "-filter_complex",
                    ";".join(filtro_audio("[aout]")), "-map", "[aout]", str(WAV)], check=True)
    print("transcrevendo o áudio cortado...", file=sys.stderr)
    subprocess.run([sys.executable, str(Path(__file__).with_name("transcrever.py")), str(WAV),
                    "-o", str(TR_CORTE), "--modelo", p.get("modelo_legenda", "large-v3")], check=True)
    marca.write_text(assinatura, encoding="utf-8")
TRC = json.loads(TR_CORTE.read_text(encoding="utf-8"))
palavras = [{"txt": w["txt"], "ini": w["ini"], "fim": w["fim"]} for w in TRC["palavras"]
            if w["ini"] < DUR_FALA]

# o whisper inventa palavra em respiração e silêncio ("E", "né"); palavra cujo pico de
# volume não passa do limiar não foi falada e não vira legenda
import numpy as np
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(WAV), "-ac", "1", "-ar", "16000",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
sinal = np.frombuffer(pcm, dtype=np.float32)
LIMIAR = p.get("limiar_fala_db", -22)

def pico_db(ini, fim, jan=320):
    # só o miolo da palavra: as bordas que o whisper reporta encostam na palavra vizinha
    m = (fim - ini) * 0.2
    ini, fim = ini + m, fim - m
    a0, a1 = int(ini * 16000), max(int(fim * 16000), int(ini * 16000) + jan)
    seg = sinal[a0:a1]
    if len(seg) < jan:
        return -99
    rms = [np.sqrt((seg[i:i + jan] ** 2).mean()) for i in range(0, len(seg) - jan + 1, jan // 2)]
    return 20 * np.log10(max(rms) + 1e-9)

# Volume sozinho não basta: palavra átona ("de", "com") também é baixa. Então só cai a
# palavra que NÃO existe na transcrição do bruto (o whisper inventou agora) E está sem voz.
import difflib
orig = [norm(w["txt"]) for w in TR["palavras"]]
novo = [norm(w["txt"]) for w in palavras]
casadas = set()
for bloco in difflib.SequenceMatcher(None, orig, novo, autojunk=False).get_matching_blocks():
    casadas.update(range(bloco.b, bloco.b + bloco.size))
fantasmas = [w for i, w in enumerate(palavras)
             if i not in casadas and pico_db(w["ini"], w["fim"]) < LIMIAR]
for w in fantasmas:
    print(f"descartada (sem voz): '{w['txt']}' em {w['ini']:.2f}s", file=sys.stderr)
palavras = [w for w in palavras if w not in fantasmas]

# legenda limpa: tira muleta ("né") e palavra repetida em sequência; o áudio fica como está
MULETAS = {norm(m) for m in p.get("remover_da_legenda", ["né"])}
limpas = []
for w in palavras:
    if norm(w["txt"]) in MULETAS:
        continue
    if limpas and norm(limpas[-1]["txt"]) == norm(w["txt"]):
        limpas[-1]["fim"] = w["fim"]
        continue
    limpas.append(w)
palavras = limpas

# o whisper abre cada segmento com maiúscula; no meio da frase vira minúscula
SIGLAS = {norm(d) for d in p.get("manter_maiuscula", [])}
for i, w in enumerate(palavras):
    ant = palavras[i - 1]["txt"] if i else "."
    if not re.search(r"[.?!]$", ant) and norm(w["txt"]) not in SIGLAS and not w["txt"].isupper():
        w["txt"] = w["txt"][:1].lower() + w["txt"][1:]

# blocos de legenda: até ~24 caracteres, quebra em pontuação e em pausa
blocos, atual = [], []
for i, w in enumerate(palavras):
    atual.append(w)
    texto = " ".join(x["txt"] for x in atual)
    prox = palavras[i + 1] if i + 1 < len(palavras) else None
    fecha = (prox is None or len(texto) + 1 + len(prox["txt"]) > 24
             or (re.search(r"[.,?!]$", w["txt"]) and len(atual) >= 2)
             or (prox["ini"] - w["fim"] > 0.45))
    if fecha:
        blocos.append(atual)
        atual = []

DESTAQUES = {norm(d) for d in p.get("destaques", [])}
cl = ID["legenda"]
eventos = []

# ---------- artes fixas (cobrem o que veio queimado no bruto) ----------
cob = p.get("cobrir", {})
fim_fala = ts(DUR_FALA)
if "legenda" in cob:
    x, y, w, h = (v * K for v in cob["legenda"]["caixa"])
    eventos.append((0, f"Dialogue: 0,{ts(0)},{fim_fala},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag(cl['fundo'])}}}{retangulo(x, y, w, h, 26)}"))
    LEG_Y = y + h / 2
else:
    LEG_Y = H * 0.74
    x, y, w, h = 0, LEG_Y - 60, W, 120

if "pergunta" in cob:
    q = cob["pergunta"]
    x, y, w, h = (v * K for v in q["caixa"])
    eventos.append((0, f"Dialogue: 0,{ts(0)},{fim_fala},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag('claro')}\\fad(200,0)}}{retangulo(x, y, w, h, 30)}"))
    # rótulo + fio + pergunta
    eventos.append((1, f"Dialogue: 1,{ts(0)},{fim_fala},Rotulo,,0,0,0,,"
                       f"{{\\an8\\pos({x + w/2:.0f},{y + 30:.0f})\\fad(200,0)}}{q.get('rotulo', '')}"))
    eventos.append((1, f"Dialogue: 1,{ts(0)},{fim_fala},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag('vermelho')}\\fad(200,0)}}"
                       f"{retangulo(x + w/2 - 40, y + 78, 80, 4, 2)}"))
    linhas = quebra(q["texto"], 26)
    eventos.append((1, f"Dialogue: 1,{ts(0)},{fim_fala},Pergunta,,0,0,0,,"
                       f"{{\\an5\\pos({x + w/2:.0f},{y + 82 + (h - 82)/2:.0f})\\fad(200,0)}}" + "\\N".join(linhas)))

# ---------- legenda ----------
for i, b in enumerate(blocos):
    ini = b[0]["ini"]
    fim = blocos[i + 1][0]["ini"] if i + 1 < len(blocos) else DUR_FALA  # a faixa nunca fica vazia
    partes = []
    for w in b:
        txt = re.sub(r"[.,!]+$", "", w["txt"])
        if norm(txt) in DESTAQUES:
            partes.append(f"{{\\1c{cor_tag(cl['destaque'])}}}{txt}{{\\1c{cor_tag(cl['texto'])}}}")
        else:
            partes.append(txt)
    eventos.append((2, f"Dialogue: 2,{ts(ini)},{ts(fim)},Legenda,,0,0,0,,"
                       f"{{\\an5\\pos({W/2:.0f},{LEG_Y:.0f})\\fscx94\\fscy94\\t(0,90,\\fscx100\\fscy100)}}"
                       + " ".join(partes)))

# ---------- chamadas (etiqueta amarela acima da legenda) ----------
for c in p.get("chamadas", []):
    alvo = next((w for w in palavras if norm(w["txt"]) == norm(c["palavra"])), None)
    if not alvo:
        print(f"aviso: '{c['palavra']}' não está na fala cortada, chamada pulada", file=sys.stderr)
        continue
    txt = f"{c['palavra'].capitalize()}: {c['texto']}"
    fs = 44
    larg = len(txt) * fs * 0.52 + 60
    cy = LEG_Y - (cob.get('legenda', {}).get('caixa', [0, 0, 0, 80])[3] * K) / 2 - 52
    fim = DUR_FALA if c.get("ate_o_fim") else alvo["fim"] + 2.5
    eventos.append((3, f"Dialogue: 3,{ts(alvo['ini'])},{ts(fim)},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag('amarelo')}\\fad(150,0)}}"
                       f"{retangulo(W/2 - larg/2, cy - 38, larg, 76, 38)}"))
    eventos.append((3, f"Dialogue: 3,{ts(alvo['ini'])},{ts(fim)},Chamada,,0,0,0,,"
                       f"{{\\an5\\pos({W/2:.0f},{cy:.0f})\\fad(150,0)}}{txt}"))

# ---------- cartão final ----------
if CARTAO > 0:
    cf = ID.get("cartao_final", {})
    t0, t1 = ts(DUR_FALA), ts(DUR + 0.1)
    eventos.append((5, f"Dialogue: 5,{t0},{t1},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag('claro')}\\fad(250,0)}}{retangulo(0, 0, W, H, 0)}"))
    eventos.append((6, f"Dialogue: 6,{t0},{t1},Titulo,,0,0,0,,"
                       f"{{\\an5\\pos({W/2:.0f},{H*0.45:.0f})\\fad(350,0)}}{cf.get('titulo', '')}"))
    eventos.append((6, f"Dialogue: 6,{t0},{t1},Desenho,,0,0,0,,"
                       f"{{\\an7\\pos(0,0)\\p1\\1c{cor_tag('vermelho')}\\fad(350,0)}}{retangulo(W/2 - 60, H*0.45 + 80, 120, 4, 2)}"))
    eventos.append((6, f"Dialogue: 6,{t0},{t1},Apoio,,0,0,0,,"
                       f"{{\\an5\\pos({W/2:.0f},{H*0.45 + 160:.0f})\\fad(450,0)}}" + "\\N".join(quebra(cf.get('chamada', ''), 30))))

# ---------- arquivo ASS ----------
ft, fa = ID["fonte_titulo"], ID["fonte_apoio"]
estilos = [
    # nome, fonte, tamanho, cor, negrito, espaçamento
    ("Desenho", fa, 20, cor("claro"), 0, 0),
    ("Legenda", ft, 64, cor(cl["texto"]), 0, 0),
    ("Rotulo", fa, 28, cor("vermelho"), 1, 5),
    ("Pergunta", ft, 50, cor("vinho"), 0, 0),
    ("Chamada", fa, 44, cor("vinho"), 1, 0),
    ("Titulo", ft, 92, cor("vermelho"), 0, 0),
    ("Apoio", fa, 46, cor("vinho"), 0, 0),
]
ass = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}",
       "ScaledBorderAndShadow: yes", "WrapStyle: 2", "", "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
       "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
       "Alignment, MarginL, MarginR, MarginV, Encoding"]
for n, f, s, c, b, sp in estilos:
    ass.append(f"Style: {n},{f},{s},{c},{c},&H00000000,&H00000000,{-1 if b else 0},0,0,0,100,100,{sp},0,1,0,0,5,0,0,0,1")
ass += ["", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
ass += [e for _, e in sorted(eventos, key=lambda e: e[0])]
ARQ_ASS = BASE / "artes.ass"
ARQ_ASS.write_text("\n".join(ass) + "\n", encoding="utf-8")

# ---------- ffmpeg ----------
cx, cy = p.get("zoom_centro", [0.5, 0.5])
fc = []
for i, tr in enumerate(trechos):
    z = tr.get("zoom", 1.0)
    cw, ch = W / z, H / z
    ox, oy = cx * W * (1 - 1 / z), cy * H * (1 - 1 / z)
    fc.append(f"[0:v]trim={tr['ini']}:{tr['fim']},setpts=PTS-STARTPTS,fps=30,"
              f"scale={W}:{H}:flags=lanczos,crop={cw:.0f}:{ch:.0f}:{ox:.0f}:{oy:.0f},"
              f"scale={W}:{H}:flags=lanczos,setsar=1[v{i}]")
fc.append("".join(f"[v{i}]" for i in range(len(trechos))) + f"concat=n={len(trechos)}:v=1:a=0[vc]")

fc += filtro_audio("[aout]")

ass_arg = str(ARQ_ASS).replace("\\", "/").replace(":", "\\:")
fc.append(f"[vc]tpad=stop_mode=clone:stop_duration={CARTAO + 0.1},trim=0:{DUR:.3f},"
          f"ass='{ass_arg}'[vout]")

enc = (["-c:v", "libx264", "-preset", "ultrafast", "-crf", "28"] if a.rascunho
       else ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high"])
saida = SAIDA.with_name(SAIDA.stem + "-rascunho.mp4") if a.rascunho else SAIDA
cmd = ["ffmpeg", "-v", "error", "-stats", "-y", "-i", str(FONTE), "-filter_complex", ";".join(fc),
       "-map", "[vout]", "-map", "[aout]", *enc, "-pix_fmt", "yuv420p", "-r", "30",
       "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(saida)]
(BASE / "ffmpeg-cmd.txt").write_text(" ".join(cmd), encoding="utf-8")
print(f"fala {DUR_FALA:.2f}s + cartão {CARTAO}s = {DUR:.2f}s, {len(blocos)} blocos de legenda", file=sys.stderr)
subprocess.run(cmd, check=True)
print(saida)
