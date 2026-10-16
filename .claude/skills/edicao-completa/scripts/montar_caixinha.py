#!/usr/bin/env python3
"""
Monta uma caixinha de perguntas no estilo da casa (ver o design-system-video.md do
cliente): tela cheia, adesivo nativo, cortes a cada 2-5 s alternando salto parado e
aproximação lenta, flash branco só no primeiro corte, legenda Montserrat de 1 a 3
palavras com as frases-chave em Playfair Display Italic, trilha ~19 dB abaixo da voz
e efeito sonoro em um corte a cada quatro. Sem cartão final.

Uso: montar_caixinha.py <pasta>/plano.json [--rascunho]
"""
import argparse, difflib, json, re, subprocess, sys
from pathlib import Path
import numpy as np

BS = chr(92)

ap = argparse.ArgumentParser()
ap.add_argument("plano")
ap.add_argument("--rascunho", action="store_true")
a = ap.parse_args()

PLANO = Path(a.plano).resolve()
BASE = PLANO.parent
p = json.loads(PLANO.read_text(encoding="utf-8"))
TR = json.loads((BASE / p["transcricao"]).read_text(encoding="utf-8"))
FONTE = BASE / p["fonte"]
SAIDA = BASE / p["saida"]
SONS = (BASE / p["sons"]).resolve() if p.get("sons") else None
FONTES = (BASE / p["fontes"]).resolve() if p.get("fontes") else None
VEL = float(p.get("velocidade", 1.0))
W, H, FPS = 1080, 1920, 30
lg = p.get("legenda", {})
SANS, ITAL = lg.get("fonte_sans", "Montserrat"), lg.get("fonte_italica", "Playfair Display")


def ts(t):
    t = max(0.0, t)
    hh, r = divmod(t, 3600)
    mm, ss = divmod(r, 60)
    return f"{int(hh)}:{int(mm):02d}:{ss:05.2f}"


def norm(s):
    return re.sub(r"[^\w]", "", s.lower())


def retangulo_simples(w, h):
    # coordenadas positivas: o libass alinha o desenho pela caixa a partir de (0,0),
    # e com negativas a caixa vai parar no canto
    return f"m 0 0 l {w} 0 {w} {h} 0 {h}"


def quebra(txt, maxc):
    linhas, atual = [], ""
    for pal in txt.split():
        if atual and len(atual) + 1 + len(pal) > maxc:
            linhas.append(atual); atual = pal
        else:
            atual = f"{atual} {pal}".strip()
    return linhas + ([atual] if atual else [])


EV, SFX = [], []


def ev(camada, ini, fim, texto):
    if fim > ini:
        EV.append((camada, f"Dialogue: {camada},{ts(ini)},{ts(fim)},Base,,0,0,0,,{texto}"))


# ---------------------------------------------------------------- fonte e linha do tempo
info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                       "stream=width,height", "-of", "csv=p=0", str(FONTE)], capture_output=True,
                      text=True, check=True).stdout.strip().split(",")
SW, SH = int(info[0]), int(info[1])

trechos = p["trechos"]
pos, t = [], 0.0
for tr in trechos:
    pos.append(t)
    t += (tr["fim"] - tr["ini"]) / VEL
DUR_FALA = t
DUR = DUR_FALA + 0.25

grupos = []
for tr in trechos:
    if grupos and abs(grupos[-1][1] - tr["ini"]) < 1e-6:
        grupos[-1][1] = tr["fim"]
    else:
        grupos.append([tr["ini"], tr["fim"]])


def filtro_voz(rot, limpa=True):
    f = []
    for i, (ini, fim) in enumerate(grupos):
        d = fim - ini
        f.append(f"[0:a]atrim={ini}:{fim},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,"
                 f"afade=t=out:st={d - 0.012:.3f}:d=0.012[g{i}]")
    tempo = f",atempo={VEL}" if abs(VEL - 1) > 1e-6 else ""
    if limpa and p.get("voz") == "limpa-sem-rnnoise":
        cadeia = ("apad=pad_dur=2,aformat=sample_rates=48000:channel_layouts=mono,highpass=f=90,afftdn=nf=-28:tn=1,"
                  "agate=threshold=-37dB:ratio=2.2:attack=5:release=160:knee=5,"
                  "equalizer=f=280:t=q:w=1.4:g=-3.5,equalizer=f=3200:t=q:w=1.0:g=2,deesser=i=0.3,"
                  "acompressor=threshold=-20dB:ratio=2.5:attack=6:release=100:makeup=2")
    elif limpa and p.get("voz") == "limpa":
        # medido em 2026-10-14: RNNoise + afftdn + gate curto derrubam a cauda de eco em
        # 300 ms de -14 pra -23 dB; o corte em 280 Hz tira o "caixote" da sala
        modelo = str(Path(__file__).resolve().parent.parent / "modelos" / "sh.rnnn").replace(BS, "/").replace(":", BS + ":")
        # acolchoa 2 s com ruído a -70 dB ANTES da cadeia e corta depois: RNNoise/afftdn cospem NaN
        # ao esvaziar o buffer no fim do fluxo, e assim esse lixo cai fora do corte
        cadeia = (f"aformat=sample_rates=48000:channel_layouts=mono,apad=pad_dur=2,aeval=val(0)+0.0003*random(0):c=same,highpass=f=90,arnndn=m='{modelo}',"
                  "afftdn=nf=-25:tn=1,agate=threshold=-37dB:ratio=2.2:attack=5:release=160:knee=5,"
                  "equalizer=f=280:t=q:w=1.4:g=-3.5,equalizer=f=3200:t=q:w=1.0:g=2,deesser=i=0.3,"
                  "acompressor=threshold=-20dB:ratio=2.5:attack=6:release=100:makeup=2")
    else:
        cadeia = ("apad=pad_dur=2,highpass=f=80,afftdn=nf=-30,equalizer=f=3500:t=q:w=1.2:g=1.5,"
                  "acompressor=threshold=-22dB:ratio=2.2:attack=8:release=120:makeup=1.5")
    f.append("".join(f"[g{i}]" for i in range(len(grupos))) + f"concat=n={len(grupos)}:v=0:a=1{tempo},"
             f"{cadeia},loudnorm=I=-16:TP=-2:LRA=9,aresample=48000,"
             f"atrim=0:{DUR:.3f}{rot}")
    return f


# ---------------------------------------------------------------- transcrição do corte
# sempre do áudio SEM limpeza: a redução de ruído confunde o whisper ("Deletratação")
WAV = BASE / "corte.wav"
TR_CORTE = BASE / "transcricao-corte.json"
assinatura = json.dumps([trechos, VEL, str(FONTE.name)])
marca = BASE / ".corte-assinatura"
if not TR_CORTE.exists() or not marca.exists() or marca.read_text(encoding="utf-8") != assinatura:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(FONTE), "-filter_complex",
                    ";".join(filtro_voz("[v]", limpa=False)), "-map", "[v]", "-t", f"{DUR_FALA:.3f}", str(WAV)], check=True)
    print("transcrevendo o áudio cortado...", file=sys.stderr)
    subprocess.run([sys.executable, str(Path(__file__).with_name("transcrever.py")), str(WAV),
                    "-o", str(TR_CORTE), "--modelo", p.get("modelo_legenda", "large-v3")], check=True)
    marca.write_text(assinatura, encoding="utf-8")
TRC = json.loads(TR_CORTE.read_text(encoding="utf-8"))
palavras = [dict(w) for w in TRC["palavras"] if w["ini"] < DUR_FALA]

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
# rabo alucinado: palavra que não existe no bruto depois da última que existe ("obrigada", "Patrícia")
ultima = max((i for i in range(len(palavras)) if i in casadas), default=len(palavras) - 1)
for w in palavras[ultima + 1:]:
    print(f"descartada (rabo sem par no bruto): '{w['txt']}' em {w['ini']:.2f}s", file=sys.stderr)
palavras = palavras[:ultima + 1]

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
    elif re.search(r"[.?!]$", ant) or i == 0 or w["ini"] - palavras[i - 1]["fim"] >= 0.5:
        w["txt"] = w["txt"][:1].upper() + w["txt"][1:]
    elif not w["txt"].isupper():
        w["txt"] = w["txt"][:1].lower() + w["txt"][1:]

FRONTEIRAS = [0.0]
for i in range(1, len(palavras)):
    ant, w = palavras[i - 1], palavras[i]
    if w["ini"] - ant["fim"] >= 0.10 or re.search(r"[.,?!]$", ant["txt"]):
        FRONTEIRAS.append(w["ini"] - 0.02)

# ---------------------------------------------------------------- inserções (vídeo de banco)
def acha(alvo, depois=0.0):
    a_ = norm(alvo)
    for w in palavras:
        if w["ini"] >= depois - 1e-6 and (norm(w["txt"]) == a_ or norm(w["txt"]).startswith(a_)):
            return w
    sys.exit(f"não achei '{alvo}' depois de {depois:.2f}s na transcrição do corte")


INS, cursor = [], 0.0
for ins in p.get("insercoes", []):
    desde = acha(ins["depois_de"], cursor)["fim"] if ins.get("depois_de") else cursor
    w0 = acha(ins["gatilho"], desde)
    t0 = max(0.0, w0["ini"] - 0.08)
    MIN = p.get("insercao_minima", 2.2)
    if INS and t0 < INS[-1]["t1"]:
        # a anterior ainda está na tela: se já cumpriu o mínimo, corta nela e emenda
        # (vira montagem); se não, espera ela terminar, desde que a espera seja curta
        if t0 - INS[-1]["t0"] >= MIN:
            INS[-1]["t1"] = t0
        elif INS[-1]["t1"] - t0 <= 1.2:
            t0 = INS[-1]["t1"]
        else:
            print(f"inserção '{ins['gatilho']}' pulada: colada na anterior", file=sys.stderr)
            cursor = w0["ini"]; continue
    t1 = min(DUR_FALA - 0.3, t0 + ins.get("dur", 3.0))
    modo_ins = "cartao" if ins.get("tipo") == "cartao" else ins.get("modo", "baixo")  # baixo = metade de baixo; cheia = tela inteira
    INS.append(dict(ins, t0=t0, t1=t1, modo=modo_ins))
    cursor = w0["ini"]
INS = [i_ for i_ in INS if i_["t1"] - i_["t0"] >= 1.2]
DIVIDIDA = [(i_["t0"], i_["t1"]) for i_ in INS if i_["modo"] == "baixo"]
CHEIAS = [(i_["t0"], i_["t1"]) for i_ in INS if i_["modo"] in ("cheia", "cartao")]  # sem legenda corrida nos dois
# as linhas de texto de cada inserção entram na palavra-gatilho delas
for ins in INS:
    for ln in ins.get("texto", []):
        w_ = acha(ln["gatilho"], ins["t0"] - 0.3)
        ln["t"] = max(ins["t0"], w_["ini"] - 0.05)


def modo(tt):
    if any(x <= tt < y for x, y in CHEIAS):
        return "inteira"
    return "dividida" if any(x <= tt < y for x, y in DIVIDIDA) else "cheia"


si = p.get("som_insercao")
if si and SONS:
    for ins in INS:
        x, y = ins["t0"], ins["t1"]
        SFX.append((x - 0.05, si.get("entrada", "whoosh"), si.get("ganho_entrada_db", -13) + (2 if ins["modo"] == "cheia" else 0)))
        if si.get("saida"):
            SFX.append((y, si["saida"], si.get("ganho_saida_db", -20)))
        for ln in ins.get("texto", []):
            if ln["t"] > x + 0.15:
                SFX.append((ln["t"] - 0.03, si.get("linha", "clique"), si.get("ganho_linha_db", -17)))

# ---------------------------------------------------------------- cortes e enquadramento
rit = p.get("ritmo", {})
INTERV = rit.get("intervalos", [3.4, 2.2, 4.2, 2.8])
TIPOS = rit.get("tipos", ["push", 1.0, 1.09, 1.0, "push", 1.0, 1.12, 1.0])
TAXA, PMAX = rit.get("push_por_seg", 0.045), rit.get("push_max", 1.15)

cortes = []
for c in sorted(set([0.0] + pos[1:] + [x for x, _ in DIVIDIDA + CHEIAS] + [y for _, y in DIVIDIDA + CHEIAS])):
    if not cortes or c - cortes[-1] >= 0.9:  # edição e inserção já são saltos; colados viram um só
        cortes.append(c)
fixos = cortes + [DUR_FALA]
extras, k = [], 0
for ca, cb in zip(fixos, fixos[1:]):
    c = ca
    while True:
        alvo = c + INTERV[k % len(INTERV)]; k += 1
        if alvo > cb - 1.4:
            break
        cand = [f for f in FRONTEIRAS if alvo - 0.6 <= f <= alvo + 0.8 and f - c >= 1.6 and cb - f >= 1.4]
        if not cand:
            cand = [w["ini"] - 0.02 for w in palavras
                    if alvo - 0.4 <= w["ini"] - 0.02 <= alvo + 0.5 and w["ini"] - c >= 1.6 and cb - w["ini"] >= 1.4]
        if not cand:
            c = alvo; continue
        c = min(cand, key=lambda f: abs(f - alvo))
        extras.append(c)
marcos = sorted(set(cortes + extras + [DUR]))
SEG = []  # (t0, t1, z0, z1): zoom linear de z0 a z1 dentro do segmento
for i, (m0, m1) in enumerate(zip(marcos, marcos[1:])):
    tipo = TIPOS[i % len(TIPOS)]
    if tipo == "push":
        SEG.append((m0, m1, 1.0, min(PMAX, 1.0 + TAXA * (m1 - m0))))
    else:
        SEG.append((m0, m1, float(tipo), float(tipo)))
ENF = []
for e in p.get("enfase", []):
    w_ = acha(e["palavra"])
    ENF.append((w_["ini"] - 0.03, min(w_["ini"] + e.get("dur", 0.8), DUR_FALA), e.get("zoom", 1.14)))
    if SONS and e.get("som"):
        SFX.append((w_["ini"] - 0.03, e["som"], e.get("ganho_db", -9)))
if ENF:
    novo = []
    for s0, s1, z0, z1 in SEG:
        for e0, e1, ez in ENF:
            if s0 < e0 < s1:
                novo.append((s0, e0, z0, z0 + (z1 - z0) * (e0 - s0) / (s1 - s0)))
                novo.append((e0, min(e1, s1), ez, ez))
                if e1 < s1:
                    novo.append((e1, s1, z0 + (z1 - z0) * (e1 - s0) / (s1 - s0), z1))
                break
        else:
            novo.append((s0, s1, z0, z1))
    SEG = novo
TODOS_CORTES = marcos[1:-1]

sc = p.get("som_corte")
if sc and SONS:
    for i, c in enumerate(TODOS_CORTES):
        if i % sc.get("a_cada", 4) == 1:
            SFX.append((c, sc["nome"], sc.get("ganho_db", -18)))

if p.get("flash_no_primeiro_corte") and len(pos) > 1:
    tf = pos[1]
    # 5 frames subindo até o branco, corte no pico, 6 frames voltando: o flash da casa
    ev(60, tf - 5 / FPS, tf, "{\\an7\\pos(0,0)\\p1\\1c&HFFFFFF&\\alpha&HFF&\\t(0,167,\\alpha&H00&)}" + f"m 0 0 l {W} 0 {W} {H} 0 {H}")
    ev(60, tf, tf + 6 / FPS, "{\\an7\\pos(0,0)\\p1\\1c&HFFFFFF&\\alpha&H40&\\t(0,200,\\alpha&HFF&)}" + f"m 0 0 l {W} 0 {W} {H} 0 {H}")
    if SONS:
        SFX.append((tf - 0.08, "flash", -12))

# ---------------------------------------------------------------- legenda
CHAVES = [[norm(x) for x in fr.split()] for fr in p.get("frases_chave", [])]
MAXP, MAXC = lg.get("max_palavras", 3), lg.get("max_caracteres", 14)
blocos, i = [], 0
while i < len(palavras):
    chave = None
    for seq in CHAVES:
        if [norm(w["txt"]) for w in palavras[i:i + len(seq)]] == seq:
            chave = seq; break
    if chave:
        blocos.append({"p": palavras[i:i + len(chave)], "italico": True}); i += len(chave); continue
    bloco = [palavras[i]]; i += 1
    while i < len(palavras):
        w = palavras[i]
        if any([norm(x["txt"]) for x in palavras[i:i + len(seq)]] == seq for seq in CHAVES):
            break
        txt = " ".join(x["txt"] for x in bloco)
        if (len(bloco) >= MAXP or len(txt) + 1 + len(w["txt"]) > MAXC
                or re.search(r"[.,?!]$", bloco[-1]["txt"]) or w["ini"] - bloco[-1]["fim"] > 0.3):
            break
        bloco.append(w); i += 1
    blocos.append({"p": bloco, "italico": False})

sk = p.get("som_chave")
for bi, b in enumerate(blocos):
    if modo(b["p"][0]["ini"]) == "inteira":
        continue  # a inserção de tela inteira traz o próprio texto
    Y = lg.get("y_dividida", 870) if modo(b["p"][0]["ini"]) == "dividida" else lg.get("y", 1230)
    if b["italico"] and sk and SONS and modo(b["p"][0]["ini"]) == "cheia":
        SFX.append((b["p"][0]["ini"] - 0.05, sk["nome"], sk.get("ganho_db", -18)))
    e0 = b["p"][0]["ini"] - 0.04
    prox = blocos[bi + 1]["p"][0]["ini"] - 0.04 if bi + 1 < len(blocos) else DUR_FALA
    e1 = min(prox, b["p"][-1]["fim"] + (0.9 if b["italico"] else 0.5))
    if b["italico"]:
        e1 = max(e1, min(prox, e0 + 0.9))
    for x, y in CHEIAS:  # bloco que atravessa uma inserção de tela inteira termina na entrada dela
        if e0 < x < e1:
            e1 = x - 0.02
    txt = " ".join(re.sub(r"[.!]+$", "", w["txt"]) for w in b["p"])
    if b["italico"]:
        txt = "\\N".join(quebra(re.sub(r",$", "", txt), 17))
        estilo = f"\\fn{ITAL}\\i1\\fs{lg.get('tam_italica', 86)}"
    else:
        estilo = f"\\fn{SANS}\\fs{lg.get('tam_sans', 52)}"
    # entrada com desfoque curto e saída por fade, como nos vídeos da casa
    anima = "\\blur14\\fscx96\\fscy96\\t(0,130,\\blur0\\fscx100\\fscy100)\\fad(40,60)"
    ev(30, e0, e1, f"{{\\an5\\pos({W//2},{Y}){estilo}\\1c&HFFFFFF&\\bord0\\shad3\\4c&H000000&\\4a&H60&\\blur0{anima}}}{txt}")

# ---------------------------------------------------------------- textos das inserções
VINHO = "&H160B5A&"  # vinho da marca em BGR
tx = p.get("texto_insercao", {})
for ins in INS:
    fim = ins["t1"]
    linhas = ins.get("texto", [])
    if ins.get("tipo") == "cartao":
        # título em Playfair Black caixa alta + caixa vinho com o subtítulo em Montserrat caixa alta
        cy = tx.get("y_cartao", 1000)
        tit = ins.get("titulo", "").upper()
        sub = ins.get("subtitulo", "").upper()
        t0 = ins["t0"]
        ev(40, t0, fim, f"{{\\an2\\pos(540,{cy})\\fnPlayfair Display Black\\fs{tx.get('tam_titulo', 118)}\\1c&HFFFFFF&\\bord0\\shad4\\4c&H000000&\\4a&H60&"
                         f"\\fscx92\\fscy92\\t(0,140,\\fscx100\\fscy100)\\fad(60,80)}}" + "\\N".join(quebra(tit, 16)))
        if sub:
            larg = int(len(sub) * tx.get("tam_sub", 44) * 0.62 + 90)
            ev(40, t0 + 0.12, fim, f"{{\\an5\\pos(540,{cy + 62})\\p1\\1c{VINHO}\\fscx0\\t(0,180,\\fscx100)\\fad(0,80)}}{retangulo_simples(larg, 96)}")
            ev(41, t0 + 0.22, fim, f"{{\\an5\\pos(540,{cy + 62})\\fnMontserrat SemiBold\\fs{tx.get('tam_sub', 44)}\\fsp2\\1c&HFFFFFF&\\bord0\\shad0\\fad(120,80)}}{sub}")
        continue
    if not linhas:
        continue
    # linhas empilhadas em Playfair Italic caixa alta, alinhadas à esquerda, cada uma entra no seu gatilho
    x0, yb = tx.get("x_linhas", 70), tx.get("y_linhas", 1180)
    tam = tx.get("tam_linhas", 112)
    alt = int(tam * 1.08)
    n = len(linhas)
    for k, ln in enumerate(linhas):
        y = yb - (n - 1 - k) * alt if ins["modo"] == "cheia" else tx.get("y_linhas_baixo", 880) - (n - 1 - k) * alt
        ev(42, ln["t"], fim, f"{{\\an1\\pos({x0},{y})\\fnPlayfair Display\\i1\\fs{tam}\\1c&HFFFFFF&\\bord0\\shad4\\4c&H000000&\\4a&H50&"
                             f"\\blur12\\fscx95\\fscy95\\t(0,140,\\blur0\\fscx100\\fscy100)\\fad(40,80)}}{ln['linha'].upper()}")

# ---------------------------------------------------------------- ASS
ass = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "ScaledBorderAndShadow: yes",
       "WrapStyle: 2", "", "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
       "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
       "MarginR, MarginV, Encoding",
       f"Style: Base,{SANS},52,&H00FFFFFF,&H00FFFFFF,&H00000000,&H60000000,0,0,0,0,100,100,0,0,1,0,3,5,0,0,0,1",
       "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
ass += [e for _, e in sorted(EV, key=lambda e: e[0])]
ARQ_ASS = BASE / (Path(p["saida"]).stem + ".ass")
ARQ_ASS.write_text("\n".join(ass) + "\n", encoding="utf-8")

# ---------------------------------------------------------------- vídeo
T = f"(in/{FPS})"
Z = "(" + "+".join(f"gte({T},{s0:.3f})*lt({T},{s1 + (1 if s1 >= DUR else 0):.3f})*"
                   f"({z0}+({z1}-{z0})*min(1,({T}-{s0:.3f})/{max(s1 - s0, 0.01):.3f}))" for s0, s1, z0, z1 in SEG) + ")"
czx, czy = p.get("zoom_centro", [0.5, 0.45])
fc = []
for i, tr in enumerate(trechos):
    fc.append(f"[0:v]trim={tr['ini']}:{tr['fim']},setpts=(PTS-STARTPTS)/{VEL},fps={FPS}[t{i}]")
fc.append("".join(f"[t{i}]" for i in range(len(trechos))) + f"concat=n={len(trechos)}:v=1:a=0,"
          f"scale={int(W*1.5)}:{int(H*1.5)}:flags=lanczos,"
          f"zoompan=z='{Z}':x='(iw-iw/zoom)*{czx}':y='(ih-ih/zoom)*{czy}':d=1:s={W}x{H}:fps={FPS},"
          f"unsharp=5:5:0.4,setsar=1,setpts=N/({FPS}*TB),tpad=stop_mode=clone:stop_duration=0.5,"
          f"setpts=N/({FPS}*TB),trim=0:{DUR:.3f},"
          "curves=master='0/0 0.25/0.23 0.75/0.78 1/1',eq=saturation=1.05:contrast=1.02,"
          "colorbalance=rm=0.03:bm=-0.03,vignette=angle=0.35[vc]")
entradas_video = []
if INS:
    atual = "[vc]"
    idx_v = 0
    for k, ins in enumerate(INS):
        if ins.get("tipo") == "cartao":
            continue
        idx_v += 1  # entradas de vídeo vêm logo depois da fonte; os sons entram depois
        entradas_video += ["-ss", str(ins.get("de", 0)), "-t", f"{ins['t1'] - ins['t0'] + 0.5:.3f}", "-i", str(BASE / ins["clipe"])]
        if ins.get("tipo") == "cartao":
            continue  # só texto, desenhado no ASS
        d_ins = ins["t1"] - ins["t0"]
        if ins["modo"] == "cheia":
            # tela inteira com aproximação lenta (6 % ao longo da inserção)
            fc.append(f"[{idx_v}:v]fps={FPS},scale={int(W * 1.1)}:{int(H * 1.1)}:force_original_aspect_ratio=increase,"
                      f"crop={int(W * 1.1)}:{int(H * 1.1)},zoompan=z='1+0.06*min(1,on/{max(1, int(d_ins * FPS))})':"
                      f"x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s={W}x{H}:fps={FPS},"
                      f"setsar=1,setpts=PTS-STARTPTS+{ins['t0']:.3f}/TB[ins{k}]")
            fc.append(f"{atual}[ins{k}]overlay=0:0:enable='between(t,{ins['t0']:.3f},{ins['t1']:.3f})':eof_action=pass[ov{k}]")
        else:
            fc.append(f"[{idx_v}:v]fps={FPS},scale={W}:{H // 2}:force_original_aspect_ratio=increase,crop={W}:{H // 2},"
                      f"setsar=1,setpts=PTS-STARTPTS+{ins['t0']:.3f}/TB[ins{k}]")
            fc.append(f"{atual}[ins{k}]overlay=0:{H // 2}:enable='between(t,{ins['t0']:.3f},{ins['t1']:.3f})':eof_action=pass[ov{k}]")
        atual = f"[ov{k}]"
    fc.append(f"{atual}null[vc2]")
else:
    fc.append("[vc]null[vc2]")
ass_arg = str(ARQ_ASS).replace(BS, "/").replace(":", BS + ":")
fontes_arg = (":fontsdir='" + str(FONTES).replace(BS, "/").replace(":", BS + ":") + "'") if FONTES else ""
fc.append(f"[vc2]ass='{ass_arg}'{fontes_arg}[vout]")

# ---------------------------------------------------------------- áudio
# A voz é processada num ffmpeg à parte e saneada em numpy: o RNNoise/afftdn deste build
# cospe NaN (e às vezes derruba o processo) ao esvaziar o buffer dentro do grafo grande.
VOZ_WAV = BASE / "voz-tratada.wav"
assin_voz = BASE / ".voz-assinatura"
chave_voz = json.dumps([trechos, VEL, str(FONTE.name), p.get("voz")])
if not (VOZ_WAV.exists() and assin_voz.exists() and assin_voz.read_text(encoding="utf-8") == chave_voz):
    # o RNNoise deste build às vezes derruba o ffmpeg (violação de acesso) sem motivo
    # aparente: tenta duas vezes, e na terceira vai sem ele
    bruto_voz = None
    for tentativa in range(3):
        if tentativa == 2:
            print("voz: RNNoise instável, seguindo sem ele", file=sys.stderr)
            p["voz"] = "limpa-sem-rnnoise"
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(FONTE), "-filter_complex", ";".join(filtro_voz("[v]")),
                            "-map", "[v]", "-f", "f32le", "-ac", "1", "-ar", "48000", "-"], capture_output=True)
        if r.returncode == 0 and len(r.stdout) > 48000 * 4:
            bruto_voz = r.stdout; break
        print(f"voz: tentativa {tentativa + 1} falhou ({r.returncode})", file=sys.stderr)
    if bruto_voz is None:
        sys.exit("não consegui processar a voz")
    voz = np.frombuffer(bruto_voz, dtype=np.float32).copy()
    ruins = ~np.isfinite(voz)
    if ruins.any():
        print(f"voz: {int(ruins.sum())} amostras NaN/Inf zeradas", file=sys.stderr)
        voz[ruins] = 0.0
    voz = np.clip(voz, -1.0, 1.0)
    import wave
    with wave.open(str(VOZ_WAV), "wb") as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(48000)
        wv.writeframes((voz * 32767).astype("<i2").tobytes())
    assin_voz.write_text(chave_voz, encoding="utf-8")

N_CLIPES = sum(1 for i_ in INS if i_.get("tipo") != "cartao")
entradas = ["-i", str(FONTE)] + entradas_video + ["-i", str(VOZ_WAV)]
fc.append(f"[{1 + N_CLIPES}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono,apad,atrim=0:{DUR:.3f}[voz]")
fc.append("[voz]asplit=2[voz1][vozsc]")
mix, idx = ["[voz1]"], 2 + N_CLIPES
mus = p.get("musica")
if mus:
    entradas += ["-stream_loop", "-1", "-i", str((BASE / mus["arquivo"]).resolve())]
    fc.append(f"[{idx}:a]atrim=0:{DUR:.3f},asetpts=PTS-STARTPTS,aresample=48000,volume={mus.get('volume_db', -27)}dB,"
              f"afade=t=in:d=1.0,afade=t=out:st={DUR - 1.0:.3f}:d=1.0[mus0]")
    fc.append("[mus0][vozsc]sidechaincompress=threshold=0.03:ratio=3:attack=40:release=600[mus]")
    mix.append("[mus]"); idx += 1
else:
    fc.append("[vozsc]anullsink")
if SONS and SFX:
    por_som = {}
    for tt, nome, g in SFX:
        if (SONS / f"{nome}.wav").exists():
            por_som.setdefault(nome, []).append((tt, g))
    for nome, lista in por_som.items():
        entradas += ["-i", str(SONS / f"{nome}.wav")]
        rots = [f"[s{idx}_{k}]" for k in range(len(lista))]
        fc.append(f"[{idx}:a]aresample=48000,asplit={len(lista)}" + "".join(rots) if len(lista) > 1
                  else f"[{idx}:a]aresample=48000,anull{rots[0]}")
        for k_, (tt, g) in enumerate(lista):
            ms = int(max(0, tt) * 1000)
            fc.append(f"{rots[k_]}adelay={ms}|{ms},volume={g}dB[e{idx}_{k_}]")
            mix.append(f"[e{idx}_{k_}]")
        idx += 1
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first,"
          f"loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=0:{DUR:.3f}[aout]")

enc = (["-c:v", "libx264", "-preset", "ultrafast", "-crf", "28"] if a.rascunho
       else ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high"])
saida = SAIDA.with_name(SAIDA.stem + "-rascunho.mp4") if a.rascunho else SAIDA
cmd = ["ffmpeg", "-v", "warning", "-stats", "-y", *entradas, "-filter_complex", ";".join(fc),
       "-map", "[vout]", "-map", "[aout]", *enc, "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(saida)]
(BASE / (Path(p["saida"]).stem + "-ffmpeg.txt")).write_text(" ".join(cmd), encoding="utf-8")
(BASE / (Path(p["saida"]).stem + "-ffmpeg.json")).write_text(json.dumps(cmd, ensure_ascii=False), encoding="utf-8")
print(f"fala {DUR_FALA:.2f}s | inserções: " + ", ".join(f"{i_['gatilho']}[{i_['modo'] if i_.get('tipo') != 'cartao' else 'cartão'}] {i_['t0']:.1f}-{i_['t1']:.1f}" for i_ in INS) + f" | {len(SEG)} enquadramentos: " + " · ".join(
    ("push" if z1 != z0 else f"{z0:.2f}") + f"({s1 - s0:.1f}s)" for s0, s1, z0, z1 in SEG)
    + f" | {len(blocos)} blocos ({sum(b['italico'] for b in blocos)} itálicos) | {len(SFX)} sons", file=sys.stderr)
subprocess.run(cmd, check=True)
print(saida)
