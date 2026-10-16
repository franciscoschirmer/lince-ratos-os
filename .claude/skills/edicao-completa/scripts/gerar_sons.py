#!/usr/bin/env python3
"""
Gera os efeitos sonoros e a trilha de teste da edição, sintetizados do zero
(numpy + ffmpeg pra reverb). Sem download e sem direito autoral.

Uso: gerar_sons.py <pasta-saida> [--trilha-seg 70] [--bpm 84]

Sai: whoosh.wav, pop.wav, sino.wav, subida.wav, impacto.wav, trilha.wav (48 kHz estéreo)

A trilha é um piano elétrico suave sobre pad, em 4 acordes que se repetem. Serve
pra teste e pra vídeo sem música definida; música de verdade o Francisco escolhe
(biblioteca do Instagram ou faixa livre que ele mandar).
"""
import argparse, subprocess, wave
from pathlib import Path
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def salva(caminho, sinal, reverb=None):
    sinal = np.asarray(sinal, dtype=np.float64)
    if sinal.ndim == 1:
        sinal = np.stack([sinal, sinal], axis=1)
    sinal = sinal / (np.abs(sinal).max() + 1e-9) * 0.89
    bruto = Path(str(caminho) + ".tmp.wav") if reverb else Path(caminho)
    with wave.open(str(bruto), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((sinal * 32767).astype("<i2").tobytes())
    if reverb:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af", reverb, str(caminho)], check=True)
        bruto.unlink()


def t(seg):
    return np.arange(int(seg * SR)) / SR


def passa_banda(ruido, centro, largura):
    """filtro passa-banda variável no tempo, por FFT em blocos curtos"""
    out = np.zeros_like(ruido)
    bloco = 1024
    for i in range(0, len(ruido), bloco // 2):
        seg = ruido[i:i + bloco]
        if len(seg) < bloco:
            seg = np.pad(seg, (0, bloco - len(seg)))
        janela = np.hanning(bloco)
        f = np.fft.rfft(seg * janela)
        freqs = np.fft.rfftfreq(bloco, 1 / SR)
        c = centro[min(i, len(centro) - 1)]
        f *= np.exp(-((freqs - c) / largura) ** 2)
        y = np.fft.irfft(f)
        fim = min(i + bloco, len(out))
        out[i:fim] += y[:fim - i]
    return out


def whoosh(dur=0.5):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    centro = 300 + 2600 * np.sin(np.pi * x) ** 1.5
    s = passa_banda(rng.standard_normal(n), centro, 900)
    env = np.sin(np.pi * x) ** 2
    pan = x  # passa da esquerda pra direita
    return np.stack([s * env * (1 - pan * 0.7), s * env * (0.3 + pan * 0.7)], axis=1)


def pop():
    tt = t(0.09)
    f = 950 * np.exp(-tt * 25) + 380
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45)
    s[:60] += rng.standard_normal(60) * 0.3 * np.linspace(1, 0, 60)
    return s


def sino():
    tt = t(1.2)
    s = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d)
            for f, a, d in ((1318.5, 1, 4.5), (2637, 0.35, 7), (3955, 0.15, 10), (1975.5, 0.25, 6)))
    return s * (1 - np.exp(-tt * 400))


def subida(dur=1.1):
    n = int(dur * SR); x = np.linspace(0, 1, n)
    centro = 200 + 5000 * x ** 2
    s = passa_banda(rng.standard_normal(n), centro, 700) * x ** 2
    tom = np.sin(2 * np.pi * np.cumsum(220 + 660 * x ** 2) / SR) * x ** 3 * 0.3
    return s + tom


def impacto():
    tt = t(1.4)
    grave = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tt * 6) + 42) / SR) * np.exp(-tt * 3.2)
    ar = passa_banda(rng.standard_normal(len(tt)), np.full(len(tt), 2500.0), 2500) * np.exp(-tt * 9) * 0.35
    return grave + ar


def transiente(dur, centro, largura, ganho=1.0):
    n = int(dur * SR)
    s = passa_banda(rng.standard_normal(n), np.full(n, float(centro)), largura)
    return s * np.exp(-np.arange(n) / SR * (6 / dur)) * ganho


def soma(*sinais):
    """soma sinais de tamanhos diferentes, alinhados no início"""
    n = max(len(x) for x in sinais)
    out = np.zeros(n)
    for x in sinais:
        out[:len(x)] += x
    return out


def coloca(base, s, t0):
    i = int(t0 * SR)
    fim = min(len(base), i + len(s))
    base[i:fim] += s[:fim - i]
    return base


def clique():
    """clique de mouse 'gordo': pressionar e soltar, com um toque de madeira"""
    out = np.zeros(int(0.16 * SR))
    tt = t(0.03)
    tock = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-tt * 90) + 900) / SR) * np.exp(-tt * 160)
    coloca(out, soma(transiente(0.012, 4200, 2500, 1.0), tock * 0.9), 0.0)
    tt = t(0.025)
    tock2 = np.sin(2 * np.pi * np.cumsum(1700 * np.exp(-tt * 90) + 700) / SR) * np.exp(-tt * 180)
    coloca(out, soma(transiente(0.009, 3200, 2200, 0.7), tock2 * 0.7), 0.062)
    return out


def flash():
    """obturador de câmera: 'ka-chik' mecânico e um brilho curto subindo"""
    out = np.zeros(int(0.55 * SR))
    tt = t(0.04)
    corpo = np.sin(2 * np.pi * 420 * tt) * np.exp(-tt * 120)
    coloca(out, soma(transiente(0.010, 5000, 3000, 1.0), corpo * 0.8), 0.0)
    coloca(out, transiente(0.008, 2600, 1800, 0.6), 0.028)
    coloca(out, soma(transiente(0.014, 6500, 3500, 1.0), corpo * 0.5), 0.075)
    tt = t(0.32)
    brilho = np.sin(2 * np.pi * np.cumsum(2800 + 5200 * (tt / 0.32) ** 2) / SR) * np.exp(-tt * 9) * 0.18
    brilho += passa_banda(rng.standard_normal(len(tt)), 6000 + 4000 * tt / 0.32, 2500) * np.exp(-tt * 10) * 0.25
    coloca(out, brilho, 0.09)
    return out


def boom():
    """soco grave curto pro punch-in"""
    tt = t(0.55)
    s = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 9) + 38) / SR) * np.exp(-tt * 6)
    return soma(s, transiente(0.01, 1800, 1500, 0.3))


def ding():
    """sino pequeno e brilhante, pra palavra-chave"""
    tt = t(0.7)
    s = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d)
            for f, a, d in ((2093, 1, 7), (4186, 0.3, 12), (5274, 0.12, 16), (3136, 0.2, 10)))
    return s * (1 - np.exp(-tt * 500))


NOTAS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(n):
    return 440 * 2 ** ((NOTAS[n[0]] + 12 * (int(n[1]) + 1) - 69) / 12)


def piano(f, dur):
    tt = t(dur)
    s = sum(a / (k + 1) * np.sin(2 * np.pi * f * (k + 1) * tt) * np.exp(-tt * (2.2 + k * 1.8))
            for k, a in enumerate((1, 0.5, 0.25, 0.12)))
    return s * (1 - np.exp(-tt * 300))


def trilha(seg, bpm):
    # Fmaj7 - Am7 - Dm9 - Bbmaj7 (meio tom): calmo, "clínica boutique"
    acordes = [["F3", "A3", "C4", "E4"], ["A2", "E3", "G3", "C4"],
               ["D3", "F3", "A3", "E4"], ["A2", "D3", "F3", "A3"]]
    baixos = ["F2", "A2", "D2", "A2"]
    batida = 60 / bpm
    compasso = batida * 4
    n = int(seg * SR)
    pad = np.zeros(n); pno = np.zeros(n); bx = np.zeros(n)
    i, k = 0, 0
    while i * compasso < seg:
        ac = acordes[k % 4]
        ini = int(i * compasso * SR)
        tt = t(compasso + 0.5)
        for nota in ac:  # pad: senos levemente desafinados, ataque lento
            f = hz(nota)
            s = (np.sin(2 * np.pi * f * tt) + np.sin(2 * np.pi * f * 1.003 * tt)) * 0.5
            env = np.minimum(1, tt / 0.8) * np.minimum(1, np.maximum(0, (compasso + 0.5 - tt) / 0.6))
            fim = min(n, ini + len(tt)); pad[ini:fim] += (s * env)[:fim - ini] * 0.18
        f = hz(baixos[k % 4])
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 0.9)
        fim = min(n, ini + len(tt)); bx[ini:fim] += s[:fim - ini] * 0.5
        # arpejo em colcheia, com pequena variação de força
        ordem = [0, 2, 1, 3, 2, 1, 3, 2]
        for j, o in enumerate(ordem):
            p0 = int((i * compasso + j * batida / 2) * SR)
            nota = ac[o]
            f = hz(nota) * 2
            s = piano(f, 1.6) * (0.55 if j % 2 else 0.8)
            fim = min(n, p0 + len(s))
            if p0 < n:
                pno[p0:fim] += s[:fim - p0] * 0.35
        i += 1; k += 1
    # pulso discreto: bumbo macio no 1 e no 3, chocalho nos contratempos. Dá andamento
    # sem virar "música de academia"; a voz fica por cima com folga
    bat = np.zeros(n)
    kick = np.sin(2 * np.pi * np.cumsum(95 * np.exp(-t(0.22) * 18) + 48) / SR) * np.exp(-t(0.22) * 14)
    chk = passa_banda(rng.standard_normal(int(0.05 * SR)), np.full(int(0.05 * SR), 7500.0), 2500) * np.exp(-t(0.05) * 90)
    nb = int(seg / batida) + 1
    for b_ in range(nb):
        p0 = int(b_ * batida * SR)
        if b_ % 2 == 0:
            coloca(bat, kick * 0.45, b_ * batida)
        coloca(bat, chk * (0.12 if b_ % 2 else 0.07), b_ * batida + batida / 2)
    mix = pad + pno + bx + bat
    x = np.linspace(0, 1, n)
    mix *= np.minimum(1, x * seg / 2.0)  # entra em 2s
    esq = mix + np.roll(pno, int(0.012 * SR)) * 0.25
    dir_ = mix + np.roll(pad, int(0.009 * SR)) * 0.25
    return np.stack([esq, dir_], axis=1)


ap = argparse.ArgumentParser()
ap.add_argument("saida")
ap.add_argument("--trilha-seg", type=float, default=70)
ap.add_argument("--bpm", type=float, default=84)
a = ap.parse_args()
out = Path(a.saida); out.mkdir(parents=True, exist_ok=True)

sala = "aecho=0.8:0.6:60|120:0.25|0.15"
salva(out / "whoosh.wav", whoosh())
salva(out / "pop.wav", pop())
salva(out / "sino.wav", sino(), reverb=sala)
salva(out / "subida.wav", subida())
salva(out / "impacto.wav", impacto(), reverb=sala)
salva(out / "clique.wav", clique())
salva(out / "flash.wav", flash(), reverb="aecho=0.8:0.4:40:0.18")
salva(out / "boom.wav", boom())
salva(out / "ding.wav", ding(), reverb=sala)
salva(out / "trilha.wav", trilha(a.trilha_seg, a.bpm),
      reverb="aecho=0.8:0.7:90|170|260:0.3|0.22|0.15,lowpass=f=6500,highpass=f=50")
print("\n".join(str(p) for p in sorted(out.glob("*.wav"))))
