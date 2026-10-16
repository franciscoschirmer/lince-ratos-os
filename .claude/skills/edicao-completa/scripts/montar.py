#!/usr/bin/env python3
"""
Monta o vídeo final a partir de um plano.json (formato v3, ver SKILL.md):
corta e acelera, troca de enquadramento a cada 2-3s (jump cut com clique), alterna
tela cheia e tela dividida com flash de câmera, legenda palavra a palavra com peso
por palavra, inserções animadas na ID do cliente (ASS/libass), tratamento de cor
com vinheta e grão, voz tratada + trilha com ducking + efeitos, cartão final animado.

Uso: montar.py <pasta>/plano.json [--rascunho]

  --rascunho  render rápido (ultrafast, crf 28) pra conferir posição e tempo

Toda marcação de tempo das artes vem da transcrição do ÁUDIO JÁ CORTADO
(transcricao-corte.json), refeita sozinha quando os trechos mudam.
"""
import argparse, difflib, json, re, subprocess, sys
from pathlib import Path
import numpy as np

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
SONS = (BASE / p["sons"]).resolve() if p.get("sons") else None
VEL = float(p.get("velocidade", 1.0))
W, H, FPS = 1080, 1920, 30
ft, fa = ID["fonte_titulo"], ID["fonte_apoio"]


# ---------------------------------------------------------------- utilidades
def hexcor(nome):
    return ID["cores"].get(nome, nome).lstrip("#")


def cor_tag(nome):
    h = hexcor(nome)
    return f"&H{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def cor_estilo(nome, alfa=0):
    h = hexcor(nome)
    return f"&H{alfa:02X}{h[4:6]}{h[2:4]}{h[0:2]}".upper()


def ts(t):
    t = max(0.0, t)
    hh, r = divmod(t, 3600)
    mm, ss = divmod(r, 60)
    return f"{int(hh)}:{int(mm):02d}:{ss:05.2f}"


def retangulo(w, h, r, x=0, y=0):
    x, y, w, h, r = (round(v) for v in (x, y, w, h, r))
    r = max(0, min(r, w // 2, h // 2))
    return (f"m {x+r} {y} l {x+w-r} {y} b {x+w} {y} {x+w} {y} {x+w} {y+r} "
            f"l {x+w} {y+h-r} b {x+w} {y+h} {x+w} {y+h} {x+w-r} {y+h} "
            f"l {x+r} {y+h} b {x} {y+h} {x} {y+h} {x} {y+h-r} "
            f"l {x} {y+r} b {x} {y} {x} {y} {x+r} {y}")


def circulo(r):
    k = 0.5523 * r
    return (f"m 0 {-r} b {k} {-r} {r} {-k} {r} 0 b {r} {k} {k} {r} 0 {r} "
            f"b {-k} {r} {-r} {k} {-r} 0 b {-r} {-k} {-k} {-r} 0 {-r}")


def quebra(txt, maxc):
    linhas, atual = [], ""
    for pal in txt.split():
        if atual and len(atual) + 1 + len(pal) > maxc:
            linhas.append(atual); atual = pal
        else:
            atual = f"{atual} {pal}".strip()
    return linhas + ([atual] if atual else [])


def norm(s):
    return re.sub(r"[^\w]", "", s.lower())


EV = []  # (camada, texto do Dialogue)


def ev(camada, ini, fim, texto):
    if fim > ini:
        EV.append((camada, f"Dialogue: {camada},{ts(ini)},{ts(fim)},Base,,0,0,0,,{texto}"))


def forma(camada, ini, fim, cx, cy, w, h, r, cor, extra=""):
    """retângulo arredondado centrado em (cx, cy)"""
    ev(camada, ini, fim, f"{{\\an5\\pos({cx:.0f},{cy:.0f})\\p1\\1c{cor_tag(cor)}{extra}}}{retangulo(w, h, r)}")


def ponto(camada, ini, fim, cx, cy, r, cor, extra=""):
    ev(camada, ini, fim, f"{{\\an5\\pos({cx:.0f},{cy:.0f})\\p1\\1c{cor_tag(cor)}{extra}}}{circulo(r)}")


def pop(dur=140, de=82, ate=100):
    """entra pequeno, passa do tamanho e assenta: o 'overshoot' que dá vida"""
    meio = int(dur * 0.65)
    return f"\\fscx{de}\\fscy{de}\\t(0,{meio},\\fscx{ate + 8}\\fscy{ate + 8})\\t({meio},{dur},\\fscx{ate}\\fscy{ate})"


SFX = []  # (tempo, nome, ganho_db)


def som(tt, nome, g):
    if nome:
        SFX.append((max(0.0, tt), nome, g))


# ---------------------------------------------------------------- linha do tempo
trechos = p["trechos"]
pos, t = [], 0.0
for tr in trechos:
    pos.append(t)
    t += (tr["fim"] - tr["ini"]) / VEL
DUR_FALA = t
CARTAO = float(p.get("cartao_final_seg", 0))
DUR = DUR_FALA + CARTAO

grupos = []  # trechos contínuos na fonte viram um bloco só de áudio
for tr in trechos:
    if grupos and abs(grupos[-1][1] - tr["ini"]) < 1e-6:
        grupos[-1][1] = tr["fim"]
    else:
        grupos.append([tr["ini"], tr["fim"]])


def filtro_voz(rot):
    f = []
    for i, (ini, fim) in enumerate(grupos):
        d = fim - ini
        f.append(f"[0:a]atrim={ini}:{fim},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,"
                 f"afade=t=out:st={d - 0.012:.3f}:d=0.012[g{i}]")
    tempo = f",atempo={VEL}" if abs(VEL - 1) > 1e-6 else ""
    f.append("".join(f"[g{i}]" for i in range(len(grupos))) + f"concat=n={len(grupos)}:v=0:a=1{tempo},"
             "highpass=f=80,afftdn=nf=-30,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3800:t=q:w=1.2:g=2.5,"
             "acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2,"
             f"loudnorm=I=-16:TP=-2:LRA=9,aresample=48000,apad,atrim=0:{DUR:.3f}{rot}")
    return f


# ---------------------------------------------------------------- transcrição do corte
WAV = BASE / "corte.wav"
TR_CORTE = BASE / "transcricao-corte.json"
assinatura = json.dumps([trechos, VEL])
marca = BASE / ".corte-assinatura"
if not TR_CORTE.exists() or not marca.exists() or marca.read_text(encoding="utf-8") != assinatura:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(FONTE), "-filter_complex",
                    ";".join(filtro_voz("[v]")), "-map", "[v]", "-t", f"{DUR_FALA:.3f}", str(WAV)], check=True)
    print("transcrevendo o áudio cortado...", file=sys.stderr)
    subprocess.run([sys.executable, str(Path(__file__).with_name("transcrever.py")), str(WAV),
                    "-o", str(TR_CORTE), "--modelo", p.get("modelo_legenda", "large-v3")], check=True)
    marca.write_text(assinatura, encoding="utf-8")
TRC = json.loads(TR_CORTE.read_text(encoding="utf-8"))
palavras = [dict(w) for w in TRC["palavras"] if w["ini"] < DUR_FALA]

# palavra fantasma: não existe no bruto E está sem voz (o whisper inventa em respiração)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(WAV), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
sinal = np.frombuffer(pcm, dtype=np.float32)


def pico_db(ini, fim, jan=320):
    m = (fim - ini) * 0.2
    a0, a1 = int((ini + m) * 16000), max(int((fim - m) * 16000), int((ini + m) * 16000) + jan)
    seg = sinal[a0:a1]
    if len(seg) < jan:
        return -99
    return 20 * np.log10(max(np.sqrt((seg[i:i + jan] ** 2).mean()) for i in range(0, len(seg) - jan + 1, jan // 2)) + 1e-9)


orig = [norm(w["txt"]) for w in TR["palavras"]]
casadas = set()
for b in difflib.SequenceMatcher(None, orig, [norm(w["txt"]) for w in palavras], autojunk=False).get_matching_blocks():
    casadas.update(range(b.b, b.b + b.size))
fantasmas = [w for i, w in enumerate(palavras) if i not in casadas and pico_db(w["ini"], w["fim"]) < p.get("limiar_fala_db", -22)]
for w in fantasmas:
    print(f"descartada (sem voz): '{w['txt']}' em {w['ini']:.2f}s", file=sys.stderr)
palavras = [w for w in palavras if w not in fantasmas]
TODAS = list(palavras)  # pra achar gatilhos, antes da limpeza da legenda

MULETAS = {norm(m) for m in p.get("remover_da_legenda", ["né"])}
limpas = []
for w in palavras:
    if norm(w["txt"]) in MULETAS:
        continue
    if limpas and norm(limpas[-1]["txt"]) == norm(w["txt"]):
        limpas[-1]["fim"] = w["fim"]; continue
    limpas.append(w)
palavras = limpas
SIGLAS = {norm(d) for d in p.get("manter_maiuscula", [])}
for i, w in enumerate(palavras):
    ant = palavras[i - 1]["txt"] if i else "."
    if norm(w["txt"]) in SIGLAS:
        w["txt"] = w["txt"].upper().rstrip(",.")
    elif not re.search(r"[.?!]$", ant) and not w["txt"].isupper():
        w["txt"] = w["txt"][:1].lower() + w["txt"][1:]


def acha(alvo, depois=0.0):
    a_ = norm(alvo)
    for w in TODAS:
        if w["ini"] >= depois - 1e-6 and (norm(w["txt"]) == a_ or norm(w["txt"]).startswith(a_)):
            return w
    sys.exit(f"não achei '{alvo}' depois de {depois:.2f}s na transcrição do corte")


# fronteiras de frase: onde um corte de ritmo pode entrar sem quebrar palavra
FRONTEIRAS = [0.0]
for i in range(1, len(TODAS)):
    ant, w = TODAS[i - 1], TODAS[i]
    if w["ini"] - ant["fim"] >= 0.10 or re.search(r"[.,?!]$", ant["txt"]):
        FRONTEIRAS.append(w["ini"] - 0.02)

# ---------------------------------------------------------------- inserções e modos
INS, cursor = [], 0.0
for ins in p.get("insercoes", []):
    desde = acha(ins["depois_de"], cursor)["fim"] if ins.get("depois_de") else cursor
    w0 = acha(ins["de"], desde)
    t0 = max(0.0, w0["ini"] - 0.1)
    t1 = DUR_FALA if ins["ate"] == "fim" else acha(ins["ate"], w0["ini"])["fim"] + 0.2
    INS.append(dict(ins, t0=t0, t1=min(t1, DUR_FALA)))
    cursor = w0["ini"]
for i in range(len(INS) - 1):  # buraco curto entre duas inserções vira uma só tela dividida
    if INS[i + 1]["t0"] - INS[i]["t1"] < 1.2:
        INS[i]["t1"] = INS[i + 1]["t0"]
DIVIDIDA = [(i_["t0"], i_["t1"]) for i_ in INS]


def modo(tt):
    return "dividida" if any(x <= tt < y for x, y in DIVIDIDA) else "cheia"


CHEIA, ult = [], 0.0
for x, y in DIVIDIDA:
    if x > ult:
        CHEIA.append((ult, x))
    ult = y
if ult < DUR_FALA:
    CHEIA.append((ult, DUR_FALA))

# ---------------------------------------------------------------- transições: flash de câmera
tr_cfg = p.get("transicao", {"tipo": "flash", "som": "flash"})
TRANSICOES = [x for x, y in DIVIDIDA] + [y for x, y in DIVIDIDA if y < DUR_FALA - 0.1]
for tt in TRANSICOES:
    if tr_cfg.get("tipo") == "flash":
        # frame claro que some em 220ms: o "flash" que esconde a troca de enquadramento
        forma(60, tt - 0.03, tt + 0.26, W / 2, H / 2, W + 4, H + 4, 0, "claro",
              "\\alpha&H10&\\t(0,40,\\alpha&H00&)\\t(40,290,\\alpha&HFF&)")
    som(tt - 0.06, tr_cfg.get("som"), -8)
som(0.0, tr_cfg.get("som"), -9)
forma(60, 0, 0.3, W / 2, H / 2, W + 4, H + 4, 0, "claro", "\\alpha&H00&\\t(0,300,\\alpha&HFF&)")

# ---------------------------------------------------------------- ritmo: jump cuts em tela cheia
# a cada 2-3s o enquadramento muda num salto seco, sempre em fronteira de frase. Os
# cortes de trecho já são saltos; o ritmo preenche os buracos entre eles
rit = p.get("ritmo", {})
ZOOMS = rit.get("zooms", [1.0, 1.14, 1.06, 1.22])
INTERV = rit.get("intervalo", [2.4, 3.4])
cortes_fixos = sorted(set([0.0] + pos[1:] + [x for x, _ in DIVIDIDA] + [y for _, y in DIVIDIDA]))
RITMO = []
for i0, i1 in CHEIA:
    fixos = [c for c in cortes_fixos if i0 <= c <= i1] + [i1]
    for ca, cb in zip(fixos, fixos[1:]):
        c, alterna = ca, 0
        while True:
            alvo = c + INTERV[alterna % 2]
            alterna += 1
            if alvo > cb - 1.1:
                break
            cand = [f for f in FRONTEIRAS if alvo - 0.5 <= f <= alvo + 0.7 and f - c >= 1.4 and cb - f >= 1.1]
            if not cand:  # fala corrida, sem fronteira: corta no começo de uma palavra mesmo
                cand = [w["ini"] - 0.02 for w in TODAS
                        if alvo - 0.4 <= w["ini"] - 0.02 <= alvo + 0.5 and w["ini"] - c >= 1.4 and cb - w["ini"] >= 1.1]
            if not cand:
                c = alvo; continue
            c = min(cand, key=lambda f: abs(f - alvo))
            RITMO.append(c)
            som(c, rit.get("som", "clique"), rit.get("ganho_db", -15))

# segmentos de zoom constante em tela cheia: trecho a trecho, cortados pelo ritmo e pela ênfase
ENF = []
for e in p.get("enfase", []):
    w_ = acha(e["palavra"])
    ENF.append((w_["ini"] - 0.03, min(w_["ini"] + e.get("dur", 0.8), DUR_FALA), e.get("zoom", 1.3)))
    som(w_["ini"] - 0.03, e.get("som", "boom"), -7)

marcos = sorted(set([0.0, DUR] + pos[1:] + RITMO + [x for x, _ in DIVIDIDA] + [y for _, y in DIVIDIDA]
                    + [e0 for e0, _, _ in ENF] + [e1 for _, e1, _ in ENF]))
SEG, zi = [], 0
for m0, m1 in zip(marcos, marcos[1:]):
    if m1 - m0 < 1e-3:
        continue
    enf = next((z for e0, e1, z in ENF if e0 - 1e-3 <= m0 < e1 - 1e-3), None)
    if enf:
        z = enf
    else:
        z = ZOOMS[zi % len(ZOOMS)]; zi += 1
    SEG.append((m0, m1, z))

# ---------------------------------------------------------------- tela cheia: caixinha
# a caixa é desenhada por segmento, no lugar exato em que o adesivo queimado cai naquele
# zoom. Assim ela acompanha o salto de enquadramento, como se estivesse na cena
enq = p["enquadramento"]
rx, ry, rw, rh = enq["cheia"]["recorte"]
czx, czy = enq["cheia"].get("centro_zoom", [0.5, 0.5])
K = W / rw


def para_saida(x, y, z):
    ox, oy = (rw - rw / z) * czx, (rh - rh / z) * czy
    return (x - rx - ox) * z * K, (y - ry - oy) * z * K


cq = p.get("cobrir", {}).get("pergunta")
if cq:
    sx, sy, sw, sh = cq["caixa_bruto"]
    PAD = cq.get("folga", 36)
    for (s0, s1, z) in SEG:
        if modo(s0) != "cheia" or s0 >= DUR_FALA:
            continue
        s1 = min(s1, DUR_FALA)
        x0, y0 = para_saida(sx, sy, z); x1, y1 = para_saida(sx + sw, sy + sh, z)
        x0, y0, x1, y1 = x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD
        x0, y0 = max(x0, -14), max(y0, -14); x1, y1 = min(x1, W + 14), min(y1, H)
        if x1 - x0 < 700:  # a caixa tem um mínimo pra o texto caber
            cx_ = (x0 + x1) / 2; x0, x1 = max(-14, cx_ - 350), min(W + 14, cx_ + 350)
        if y1 - y0 < 300:
            y1 = y0 + 300
        w, h = x1 - x0, y1 - y0
        cx, cy = x0 + w / 2, y0 + h / 2
        anima = pop(140, 90) if s0 < 0.05 else ""
        forma(10, s0, s1, cx, cy, w, h, 34, "claro", anima)
        ev(11, s0, s1, f"{{\\an8\\pos({cx:.0f},{y0 + 36:.0f})\\fn{fa}\\b1\\fs26\\fsp6\\1c{cor_tag('vermelho')}}}{cq.get('rotulo', '')}")
        forma(11, s0, s1, cx, y0 + 88, 90, 4, 2, "vermelho")
        ev(11, s0, s1, f"{{\\an5\\pos({cx:.0f},{y0 + 98 + (h - 98) / 2:.0f})\\fn{ft}\\fs54\\1c{cor_tag('vinho')}}}"
                       + "\\N".join(quebra(cq["texto"], 28)))

# ---------------------------------------------------------------- tela dividida: inserções
ALT_TOPO = H - enq["dividida"]["altura_video"]
for x, y in DIVIDIDA:
    forma(10, x, y, W / 2, ALT_TOPO, W, 6, 0, "vermelho")

for ins in INS:
    t0, t1 = ins["t0"], ins["t1"]
    if ins.get("titulo") and ins["tipo"] != "mitocondria":
        ev(12, t0, t1, f"{{\\an5\\move(540,100,540,120,0,220)\\fn{ft}\\fs64\\1c{cor_tag('vermelho')}\\fad(180,0)}}{ins['titulo']}")
        forma(12, t0, t1, W / 2, 182, 80, 4, 2, "amarelo", "\\fscx0\\t(120,420,\\fscx100)")
    if ins["tipo"] == "lista":
        itens = ins["itens"]
        tempos, c = [], t0
        for rot, gat in itens:
            w_ = acha(gat, c)
            tempos.append(w_["ini"]); c = w_["ini"]
        for i, ((rot, _), ti) in enumerate(zip(itens, tempos)):
            col, lin = i % 2, i // 2
            cx = 540 if (i == len(itens) - 1 and len(itens) % 2) else (290 if col == 0 else 790)
            cy = 268 + lin * 112
            prox = tempos[i + 1] if i + 1 < len(tempos) else t1
            forma(13, ti, t1, cx, cy, 470, 96, 48, "vinho", pop())
            forma(14, ti, prox, cx, cy, 470, 96, 48, "vermelho", pop())
            ponto(15, ti, t1, cx - 196, cy, 9, "amarelo", pop(200, 0))
            ev(15, ti, t1, f"{{\\an5\\pos({cx + 12},{cy})\\fn{fa}\\b1\\fs40\\1c{cor_tag('claro')}{pop()}}}{rot}")
            som(ti, "pop", -10)
    elif ins["tipo"] == "cartoes":
        c = t0
        for i, (grande, gat, sub) in enumerate(ins["itens"]):
            ti = acha(gat, c)["ini"]; c = ti
            cx = 290 if i == 0 else 790
            forma(13, ti, t1, cx, 470, 430, 440, 34, "vinho", pop(200, 78))
            ev(14, ti, t1, f"{{\\an5\\pos({cx},420)\\fn{ft}\\fs130\\1c{cor_tag('claro')}{pop(200, 78)}}}{grande}")
            forma(14, ti, t1, cx, 520, 60, 4, 2, "amarelo", "\\fscx0\\t(150,450,\\fscx100)")
            ev(14, ti, t1, f"{{\\an8\\pos({cx},548)\\fn{fa}\\fs34\\1c{cor_tag('claro')}\\fad(300,0)}}"
                           + "\\N".join(quebra(sub, 20)))
            som(ti, "ding", -9)
    elif ins["tipo"] == "mitocondria":
        cx, cy, cw, ch = 540, 400, 640, 300
        anima = "\\fad(250,0)" + pop(320, 70)
        forma(13, t0, t1, cx, cy, cw, ch, ch / 2, "vermelho", anima)
        forma(14, t0, t1, cx, cy, cw - 44, ch - 44, (ch - 44) / 2, "claro", anima)
        n, larg = 8, 26  # cristas: dedos alternados de cima e de baixo
        for k in range(n):
            fx = cx - (cw - 140) / 2 + k * (cw - 140) / (n - 1)
            topo = k % 2 == 0
            fy = cy - (ch - 44) / 2 + 62 if topo else cy + (ch - 44) / 2 - 62
            forma(15, t0, t1, fx, fy, larg, 150, larg / 2, "vermelho", anima)
        g = acha(ins.get("gatilho", ins["de"]), t0)["ini"]
        for k, (dx, dy) in enumerate(((-150, -20), (-30, 30), (90, -30), (200, 20))):  # faíscas de energia
            ponto(16, g + 0.12 * k, t1, cx + dx, cy + dy, 13, "amarelo", pop(260, 0))
        ev(16, g, t1, f"{{\\an5\\pos({W/2:.0f},120)\\fn{ft}\\fs72\\1c{cor_tag('vinho')}{pop(220, 80)}}}{ins['titulo']}")
        ev(16, g, t1, f"{{\\an5\\pos({W/2:.0f},640)\\fn{fa}\\fs40\\1c{cor_tag('vinho')}\\fad(250,0)}}{ins['texto']}")
        som(g, "ding", -7)

# ---------------------------------------------------------------- legenda palavra a palavra
lg = p.get("legenda", {})
MAXC, MAXP = lg.get("max_caracteres", 14), lg.get("max_palavras", 3)
DEST = {norm(d) for d in p.get("destaques", [])}
GRANDES = {norm(d) for d in lg.get("grandes", [])}
blocos, atual = [], []
for i, w in enumerate(palavras):
    atual.append(w)
    txt = " ".join(x["txt"] for x in atual)
    prox = palavras[i + 1] if i + 1 < len(palavras) else None
    if (prox is None or len(atual) >= MAXP or len(txt) + 1 + len(prox["txt"]) > MAXC
            or re.search(r"[.,?!]$", w["txt"]) or prox["ini"] - w["fim"] > 0.35
            or modo(prox["ini"]) != modo(atual[0]["ini"]) or norm(prox["txt"]) in GRANDES
            or norm(w["txt"]) in GRANDES):
        blocos.append(atual); atual = []

for bi, b in enumerate(blocos):
    e0 = b[0]["ini"]
    e1 = blocos[bi + 1][0]["ini"] if bi + 1 < len(blocos) else DUR_FALA
    if e1 - b[-1]["fim"] > 0.6:
        e1 = b[-1]["fim"] + 0.3
    m = modo(e0)
    grande = any(norm(x["txt"]) in GRANDES for x in b)
    if m == "cheia":
        y_, base_c, ativa_c = lg.get("y_cheia", 1420), "claro", "amarelo"
        estilo = f"\\fn{ft}\\fs{130 if grande else 84}\\bord3\\3c{cor_tag('vinho')}\\3a&H30&\\shad4\\4c&H000000&\\4a&H70&"
        if grande:
            y_ = lg.get("y_grande", 1180)
    else:
        y_, base_c, ativa_c = lg.get("y_dividida", 812), "vinho", "vermelho"
        estilo = f"\\fn{ft}\\fs{84 if grande else 72}\\bord0\\shad0"
    runs = []
    for j, w in enumerate(b):
        txt = re.sub(r"[.,!]+$", "", w["txt"])
        wk = max(0, int((w["ini"] - e0) * 1000))
        wn = int((b[j + 1]["ini"] - e0) * 1000) if j + 1 < len(b) else None
        chave = norm(txt) in DEST or norm(txt) in GRANDES
        fim_esc = 114 if chave else 100
        tags = (f"\\alpha&HFF&\\fscx60\\fscy60\\t({wk},{wk + 1},\\alpha&H00&)"
                f"\\t({wk},{wk + 90},\\fscx{fim_esc + 10}\\fscy{fim_esc + 10})"
                f"\\t({wk + 90},{wk + 170},\\fscx{fim_esc}\\fscy{fim_esc})\\1c{cor_tag(ativa_c)}")
        if wn is not None and not chave:  # quando a próxima entra, esta volta pra cor base
            tags += f"\\t({wn},{wn + 1},\\1c{cor_tag(base_c)})"
        runs.append(f"{{{tags}}}{txt}")
    entrada = f"\\move(540,{y_ + 16},540,{y_},0,110)" + ("\\frz-2.5\\t(0,160,\\frz0)" if grande else "")
    ev(30, e0, e1, f"{{\\an5{entrada}{estilo}\\fad(50,0)}}" + " ".join(runs))
    if grande:
        som(e0, lg.get("som_grande", "ding"), -8)

# ---------------------------------------------------------------- cartão final
if CARTAO > 0:
    cf = ID.get("cartao_final", {})
    t0, t1 = DUR_FALA, DUR + 0.1
    forma(40, t0, t1, W / 2, H / 2, W + 4, H + 4, 0, "vinho", "\\fad(300,0)")
    ev(41, t0 + 0.25, t1, f"{{\\an5\\move(540,{H*0.45 + 40:.0f},540,{H*0.45:.0f},0,600)\\fn{ft}\\fs100"
                           f"\\1c{cor_tag('claro')}\\fad(500,0)}}{cf.get('titulo', '')}")
    forma(41, t0 + 0.6, t1, W / 2, H * 0.45 + 92, 320, 4, 2, "amarelo", "\\fscx0\\t(0,600,\\fscx100)")
    ev(41, t0 + 0.9, t1, f"{{\\an8\\pos(540,{H*0.45 + 140:.0f})\\fn{fa}\\fs40\\fsp1\\1c{cor_tag('claro')}\\fad(500,0)}}"
                          + "\\N".join(quebra(cf.get("chamada", ""), 30)))
    som(t0 - 1.0, "subida", -14)
    som(t0 + 0.25, "impacto", -9)

# ---------------------------------------------------------------- ASS
ass = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "ScaledBorderAndShadow: yes",
       "WrapStyle: 2", "", "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
       "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
       "MarginR, MarginV, Encoding",
       f"Style: Base,{fa},40,{cor_estilo('claro')},{cor_estilo('claro')},&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1",
       "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
ass += [e for _, e in sorted(EV, key=lambda e: e[0])]
ARQ_ASS = BASE / (Path(p["saida"]).stem + ".ass")
ARQ_ASS.write_text("\n".join(ass) + "\n", encoding="utf-8")

# ---------------------------------------------------------------- vídeo
T = f"(in/{FPS})"
Z = "(" + "+".join(f"gte({T},{s0:.3f})*lt({T},{s1 + (1 if s1 >= DUR else 0):.3f})*{z}" for s0, s1, z in SEG) + ")"

fc = []
for i, tr in enumerate(trechos):
    fc.append(f"[0:v]trim={tr['ini']}:{tr['fim']},setpts=(PTS-STARTPTS)/{VEL},fps={FPS}[t{i}]")
fc.append("".join(f"[t{i}]" for i in range(len(trechos))) + f"concat=n={len(trechos)}:v=1:a=0,split=2[ca][cb]")
# tela cheia: recorte que deixa de fora o texto queimado, sobe 1.5x da saída e dá o zoom por segmento
fc.append(f"[ca]crop={rw}:{rh}:{rx}:{ry},scale={int(W*1.5)}:{int(H*1.5)}:flags=lanczos,"
          f"zoompan=z='{Z}':x='(iw-iw/zoom)*{czx}':y='(ih-ih/zoom)*{czy}':d=1:s={W}x{H}:fps={FPS},"
          f"unsharp=5:5:0.6,setsar=1,setpts=N/({FPS}*TB)[A]")  # o zoompan devolve pts torto; sem isso o tpad do fim some
dx, dy, dw, dh = enq["dividida"]["recorte"]
alt = enq["dividida"]["altura_video"]
fc.append(f"[cb]crop={dw}:{dh}:{dx}:{dy},scale={W}:{alt}:flags=lanczos,unsharp=5:5:0.6,"
          f"pad={W}:{H}:0:{H - alt}:color=0x{hexcor('claro')},setsar=1,setpts=N/({FPS}*TB)[B]")
if DIVIDIDA:
    en = "+".join(f"between(t,{x:.3f},{y - 1/FPS:.3f})" for x, y in DIVIDIDA)
    fc.append(f"[A][B]overlay=0:0:enable='{en}'[vm]")
else:
    fc.append("[A]null[vm]")
vis = p.get("visual", {})
cor = (f"curves=master='0/0 0.22/0.19 0.78/0.81 1/1',eq=saturation={vis.get('saturacao', 1.08)}:contrast=1.03,"
       f"colorbalance=rm=0.04:gm=0.0:bm=-0.04:rs=0.0:bs=-0.02,"
       f"vignette=angle={vis.get('vinheta', 0.62)},noise=alls={vis.get('grao', 5)}:allf=t")
ass_arg = str(ARQ_ASS).replace("\\", "/").replace(":", "\\:")
fc.append(f"[vm]tpad=stop_mode=clone:stop_duration={CARTAO + 0.2},setpts=N/({FPS}*TB),trim=0:{DUR:.3f},{cor},"
          f"ass='{ass_arg}'[vout]")

# ---------------------------------------------------------------- áudio: voz + trilha + efeitos
entradas = ["-i", str(FONTE)]
fc += filtro_voz("[voz]")
fc.append("[voz]asplit=2[voz1][vozsc]")
mix = ["[voz1]"]
idx = 1
mus = p.get("musica")
if mus:
    entradas += ["-stream_loop", "-1", "-i", str((BASE / mus["arquivo"]).resolve())]
    fc.append(f"[{idx}:a]atrim=0:{DUR:.3f},asetpts=PTS-STARTPTS,aresample=48000,volume={mus.get('volume_db', -20)}dB,"
              f"volume='if(gte(t,{DUR_FALA:.3f}),2.5,1)':eval=frame,"  # no cartão final a trilha sobe (+8 dB)
              f"afade=t=in:d=1.2,afade=t=out:st={DUR - 1.5:.3f}:d=1.5[mus0]")
    fc.append("[mus0][vozsc]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=500[mus]")
    mix.append("[mus]"); idx += 1
else:
    fc.append("[vozsc]anullsink")
if SONS and SFX:
    por_som = {}
    for tt, nome, g in SFX:
        if (SONS / f"{nome}.wav").exists():
            por_som.setdefault(nome, []).append((tt, g))
        else:
            print(f"aviso: som '{nome}' não existe em {SONS}", file=sys.stderr)
    for nome, lista in por_som.items():
        entradas += ["-i", str(SONS / f"{nome}.wav")]
        rots = [f"[s{idx}_{k}]" for k in range(len(lista))]
        fc.append(f"[{idx}:a]aresample=48000,asplit={len(lista)}" + "".join(rots) if len(lista) > 1
                  else f"[{idx}:a]aresample=48000,anull{rots[0]}")
        for k, (tt, g) in enumerate(lista):
            ms = int(max(0, tt) * 1000)
            fc.append(f"{rots[k]}adelay={ms}|{ms},volume={g}dB[e{idx}_{k}]")
            mix.append(f"[e{idx}_{k}]")
        idx += 1
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first,"
          f"loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,atrim=0:{DUR:.3f}[aout]")

enc = (["-c:v", "libx264", "-preset", "ultrafast", "-crf", "28"] if a.rascunho
       else ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high"])
saida = SAIDA.with_name(SAIDA.stem + "-rascunho.mp4") if a.rascunho else SAIDA
cmd = ["ffmpeg", "-v", "error", "-stats", "-y", *entradas, "-filter_complex", ";".join(fc),
       "-map", "[vout]", "-map", "[aout]", *enc, "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(saida)]
(BASE / (Path(p["saida"]).stem + "-ffmpeg.txt")).write_text(" ".join(cmd), encoding="utf-8")
print(f"fala {DUR_FALA:.2f}s + cartão {CARTAO}s = {DUR:.2f}s | dividida: "
      + ", ".join(f"{x:.1f}-{y:.1f}" for x, y in DIVIDIDA)
      + f" | {len(SEG)} enquadramentos ({len(RITMO)} de ritmo) | {len(blocos)} blocos | {len(SFX)} sons", file=sys.stderr)
subprocess.run(cmd, check=True)
print(saida)
