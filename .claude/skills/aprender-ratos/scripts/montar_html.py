#!/usr/bin/env python3
"""
Transforma o `aprendizado.md` num HTML de uma página só, pronto pra ler.

Uso:
    python3 montar_html.py Aprendizados/<slug>/aprendizado.md
    python3 montar_html.py Aprendizados/<slug>/aprendizado.md --out outro.html

O que o HTML ganha em cima do markdown:

- **Citação vira link.** No md, "(fontes 1, 3, 4)" é texto morto. Aqui vira um chip
  clicável que leva pra fonte lá embaixo, com título e URL. É a rastreabilidade que a
  skill promete, só que utilizável.
- **As fontes entram no documento.** Lê o frontmatter de `fontes/*.md` e monta a lista
  no fim, com link pro original. Não precisa abrir outro arquivo pra saber o que é a
  "fonte 6".
- **Índice lateral** pra pular direto pro bloco que interessa.
- **Blocos com peso visual diferente.** Consenso, divergência e ouro de fonte única
  são coisas com grau de confiança diferente, e o md achata tudo em texto corrido.

Arquivo único, sem link externo: abre offline, sobrevive a mandar por email ou
WhatsApp. Sem dependência além da stdlib, igual ao resto da skill.
"""
import argparse
import html
import os
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------- fontes


def ler_fontes(base: Path) -> dict:
    """Lê o frontmatter das fichas em `fontes/` e devolve {numero: {...}}.

    Usa as fichas e não o `fontes.md` porque o frontmatter tem formato fixo
    (definido no SKILL.md), enquanto o índice é prosa e varia.
    """
    dir_fontes = base / "fontes"
    if not dir_fontes.is_dir():
        return {}

    achadas = {}
    for arq in sorted(dir_fontes.glob("*.md")):
        texto = arq.read_text(encoding="utf-8", errors="replace")
        if not texto.startswith("---"):
            continue
        fim = texto.find("\n---", 3)
        if fim == -1:
            continue
        meta = {}
        for linha in texto[3:fim].strip().split("\n"):
            if ":" in linha:
                k, _, v = linha.partition(":")
                meta[k.strip()] = v.strip().strip("\"'")
        num = meta.get("fonte", "").lstrip("0") or meta.get("fonte")
        if not num or not num.isdigit():
            continue
        achadas[int(num)] = {
            "titulo": meta.get("titulo") or arq.stem,
            "url": meta.get("url", ""),
            "tipo": meta.get("tipo", ""),
            "autor": meta.get("autor", ""),
            "status": meta.get("status", ""),
        }
    return achadas


# ------------------------------------------------------- markdown -> html

INLINE = [
    (re.compile(r"`([^`]+)`"), lambda m: f"<code>{html.escape(m.group(1))}</code>"),
    (re.compile(r"\*\*([^*]+)\*\*"), r"<strong>\1</strong>"),
    (re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)"), r"<em>\1</em>"),
    (re.compile(r"\[([^\]]+)\]\(([^)]+)\)"), r'<a href="\2">\1</a>'),
]

# "(fonte 3)", "(fontes 1, 3, 4)", "fontes 1 e 2" — a skill escreve de vários jeitos
CITACAO = re.compile(r"\(?\bfontes?\s+((?:\d+)(?:\s*(?:,|e)\s*\d+)*)\)?", re.I)


def inline(txt: str, fontes: dict) -> str:
    guardados = []

    def guardar(m):
        guardados.append(f"<code>{html.escape(m.group(1))}</code>")
        return f"\x00{len(guardados)-1}\x00"

    txt = INLINE[0][0].sub(guardar, txt)
    txt = html.escape(txt)
    for rx, rep in INLINE[1:]:
        txt = rx.sub(rep, txt)

    def chips(m):
        nums = [int(n) for n in re.findall(r"\d+", m.group(1))]
        saida = []
        for n in nums:
            f = fontes.get(n)
            titulo = html.escape(f["titulo"]) if f else f"fonte {n}"
            saida.append(f'<a class="cit" href="#fonte-{n}" title="{titulo}">{n}</a>')
        rotulo = "fonte" if len(nums) == 1 else "fontes"
        return f'<span class="cits">{rotulo} {"".join(saida)}</span>'

    txt = CITACAO.sub(chips, txt)
    for i, g in enumerate(guardados):
        txt = txt.replace(f"\x00{i}\x00", g)
    return txt


def slugificar(txt: str) -> str:
    t = re.sub(r"<[^>]+>", "", txt).lower()
    t = re.sub(r"[^a-z0-9à-ÿ]+", "-", t).strip("-")
    return t or "secao"


# cada H2 vira um bloco com peso próprio, pelo que o título sinaliza
TOM = [
    (("consenso", "princípio", "principio", "fundamento"), "solido"),
    (("divergência", "divergencia", "decisõe", "decisoe", "aberto"), "tensao"),
    (("ouro", "única", "unica", "insight"), "aposta"),
    (("lacuna", "dúvida", "duvida"), "lacuna"),
    (("aplicar", "checklist", "prática", "pratica"), "acao"),
]


def tom_do(titulo: str) -> str:
    t = titulo.lower()
    for chaves, nome in TOM:
        if any(c in t for c in chaves):
            return nome
    return "neutro"


def render(md: str, fontes: dict):
    linhas = md.split("\n")
    out, indice = [], []
    i, aberto = 0, False

    def fechar():
        nonlocal aberto
        if aberto:
            out.append("</section>")
            aberto = False

    while i < len(linhas):
        ln = linhas[i]

        if ln.startswith("```"):
            i += 1
            buf = []
            while i < len(linhas) and not linhas[i].startswith("```"):
                buf.append(linhas[i])
                i += 1
            i += 1
            out.append(f"<pre><code>{html.escape(chr(10).join(buf))}</code></pre>")
            continue

        m = re.match(r"^(#{1,4})\s+(.*)", ln)
        if m:
            nivel, texto = len(m.group(1)), m.group(2).strip()
            if nivel == 1:
                fechar()
                out.append(f"<h1>{inline(texto, fontes)}</h1>")
            elif nivel == 2:
                fechar()
                sl = slugificar(texto)
                indice.append((sl, texto))
                out.append(f'<section class="bloco {tom_do(texto)}" id="{sl}">')
                aberto = True
                out.append(f"<h2>{inline(texto, fontes)}</h2>")
            else:
                out.append(f"<h{nivel}>{inline(texto, fontes)}</h{nivel}>")
            i += 1
            continue

        if re.match(r"^\s*(---|\*\*\*|___)\s*$", ln):
            out.append("<hr>")
            i += 1
            continue

        if ln.startswith(">"):
            buf = []
            while i < len(linhas) and linhas[i].startswith(">"):
                buf.append(linhas[i].lstrip("> ").rstrip())
                i += 1
            out.append(f"<blockquote>{inline(' '.join(buf), fontes)}</blockquote>")
            continue

        if ln.lstrip().startswith("|") and i + 1 < len(linhas) and re.match(
            r"^\s*\|[\s:|-]+\|\s*$", linhas[i + 1]
        ):
            cabec = [c.strip() for c in ln.strip().strip("|").split("|")]
            i += 2
            corpo = []
            while i < len(linhas) and linhas[i].lstrip().startswith("|"):
                corpo.append([c.strip() for c in linhas[i].strip().strip("|").split("|")])
                i += 1
            th = "".join(f"<th>{inline(c, fontes)}</th>" for c in cabec)
            trs = "".join(
                "<tr>" + "".join(f"<td>{inline(c, fontes)}</td>" for c in r) + "</tr>"
                for r in corpo
            )
            out.append(f"<div class='rolar'><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>")
            continue

        m = re.match(r"^\s*(\d+)[.)]\s+(.*)", ln)
        if m:
            itens = []
            while i < len(linhas) and re.match(r"^\s*\d+[.)]\s+", linhas[i]):
                itens.append(re.sub(r"^\s*\d+[.)]\s+", "", linhas[i]))
                i += 1
            lis = "".join(f"<li>{inline(x, fontes)}</li>" for x in itens)
            out.append(f"<ol>{lis}</ol>")
            continue

        if re.match(r"^\s*[-*+]\s+", ln):
            itens = []
            while i < len(linhas) and re.match(r"^\s*[-*+]\s+", linhas[i]):
                itens.append(re.sub(r"^\s*[-*+]\s+", "", linhas[i]))
                i += 1
            lis = "".join(f"<li>{inline(x, fontes)}</li>" for x in itens)
            out.append(f"<ul>{lis}</ul>")
            continue

        if ln.strip():
            buf = []
            while i < len(linhas) and linhas[i].strip() and not re.match(
                r"^\s*(#{1,4}\s|[-*+]\s|\d+[.)]\s|>|\||```|---\s*$)", linhas[i]
            ):
                buf.append(linhas[i].strip())
                i += 1
            out.append(f"<p>{inline(' '.join(buf), fontes)}</p>")
            continue

        i += 1

    fechar()
    return "\n".join(out), indice


def bloco_fontes(fontes: dict) -> str:
    if not fontes:
        return ""
    itens = []
    for n in sorted(fontes):
        f = fontes[n]
        titulo = html.escape(f["titulo"])
        alvo = (
            f'<a href="{html.escape(f["url"])}" target="_blank" rel="noopener">{titulo}</a>'
            if f["url"]
            else titulo
        )
        meta = " · ".join(x for x in (f["autor"], f["tipo"]) if x)
        aviso = (
            '<span class="aviso">não capturada</span>'
            if f["status"] == "falhou"
            else ""
        )
        itens.append(
            f'<li id="fonte-{n}"><span class="num">{n}</span>'
            f"<div>{alvo}{aviso}"
            + (f'<div class="meta">{html.escape(meta)}</div>' if meta else "")
            + "</div></li>"
        )
    return (
        '<section class="bloco fontes" id="as-fontes"><h2>As fontes</h2>'
        f'<ol class="lista-fontes">{"".join(itens)}</ol></section>'
    )


CSS = """
:root{--bg:#fbfbfa;--card:#fff;--tinta:#1a1a1a;--fraca:#666;--linha:#e6e4e0;
--solido:#2f7d5d;--tensao:#b8762a;--aposta:#7a5bb5;--lacuna:#8a8a8a;--acao:#2b6cb0;--chip:#eeece7}
@media(prefers-color-scheme:dark){:root{--bg:#141414;--card:#1c1c1c;--tinta:#ececec;--fraca:#9a9a9a;
--linha:#2e2e2e;--chip:#2a2a2a;--solido:#5fb98a;--tensao:#e0a355;--aposta:#a98ae0;
--lacuna:#8a8a8a;--acao:#6ba9e8}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tinta);
font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:48px 24px 96px;display:grid;
grid-template-columns:200px 1fr;gap:48px;align-items:start}
@media(max-width:820px){.wrap{grid-template-columns:1fr;gap:24px;padding:28px 18px 64px}}
nav{position:sticky;top:32px;font-size:13px}
@media(max-width:820px){nav{position:static;border-bottom:1px solid var(--linha);padding-bottom:16px}}
nav p{margin:0 0 10px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--fraca)}
nav a{display:block;padding:5px 0;color:var(--fraca);text-decoration:none;border-left:2px solid transparent;padding-left:10px}
nav a:hover{color:var(--tinta);border-left-color:var(--tinta)}
h1{font-size:34px;line-height:1.2;margin:0 0 6px;letter-spacing:-.02em}
h2{font-size:15px;letter-spacing:.07em;text-transform:uppercase;margin:0 0 14px;color:var(--acento,var(--fraca))}
h3{font-size:18px;margin:26px 0 8px}
h4{font-size:15px;margin:20px 0 6px;color:var(--fraca)}
p,li{overflow-wrap:anywhere}
.bloco{background:var(--card);border:1px solid var(--linha);border-radius:12px;
padding:24px 26px;margin:0 0 18px;border-top:3px solid var(--acento,var(--linha))}
.solido{--acento:var(--solido)}.tensao{--acento:var(--tensao)}.aposta{--acento:var(--aposta)}
.lacuna{--acento:var(--lacuna)}.acao{--acento:var(--acao)}.fontes{--acento:var(--fraca)}
blockquote{margin:0 0 22px;padding:12px 18px;border-left:3px solid var(--linha);
color:var(--fraca);font-size:14px;background:var(--card);border-radius:0 8px 8px 0}
ul,ol{padding-left:22px;margin:0 0 14px}li{margin:7px 0}
a{color:inherit}
code{background:var(--chip);padding:1px 6px;border-radius:5px;font-size:.88em;
font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:var(--chip);padding:16px;border-radius:10px;overflow-x:auto}
pre code{background:none;padding:0}
hr{border:0;border-top:1px solid var(--linha);margin:26px 0}
.rolar{overflow-x:auto;margin:0 0 16px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--linha);vertical-align:top}
th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--fraca)}
.cits{white-space:nowrap;font-size:12px;color:var(--fraca)}
.cit{display:inline-block;min-width:19px;height:19px;line-height:19px;text-align:center;
margin-left:3px;background:var(--chip);border-radius:5px;font-size:11px;font-weight:700;
text-decoration:none;color:var(--fraca)}
.cit:hover{background:var(--acento,var(--tinta));color:var(--card)}
.lista-fontes{list-style:none;padding:0}
.lista-fontes li{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--linha)}
.lista-fontes li:last-child{border-bottom:0}
.lista-fontes li:target{background:var(--chip);border-radius:8px;padding-left:10px;padding-right:10px}
.num{flex:0 0 22px;height:22px;line-height:22px;text-align:center;background:var(--chip);
border-radius:6px;font-size:11px;font-weight:700;color:var(--fraca)}
.meta{font-size:12px;color:var(--fraca);margin-top:2px}
.aviso{font-size:11px;color:var(--tensao);margin-left:8px}
.rodape{grid-column:1/-1;margin-top:36px;padding-top:18px;border-top:1px solid var(--linha);
font-size:12px;color:var(--fraca)}
@media print{
  body{background:#fff}
  .wrap{display:block;max-width:none;padding:0}
  nav{display:none}
  .bloco{break-inside:avoid;border-radius:0;border-left:0;border-right:0;padding:12px 0}
  .cit{border:1px solid var(--linha)}
  a{text-decoration:none}
}
"""


def montar(caminho_md: Path, saida: Path | None = None) -> Path:
    base = caminho_md.parent
    md = caminho_md.read_text(encoding="utf-8")
    fontes = ler_fontes(base)
    corpo, indice = render(md, fontes)

    titulo = "Aprendizado"
    m = re.search(r"^#\s+(.*)$", md, re.M)
    if m:
        titulo = re.sub(r"<[^>]+>", "", m.group(1)).strip()

    if fontes:
        indice.append(("as-fontes", "As fontes"))
    nav = "".join(f'<a href="#{s}">{html.escape(t)}</a>' for s, t in indice)

    doc = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(titulo)}</title>
<style>{CSS}</style></head><body>
<div class="wrap">
<nav><p>Neste aprendizado</p>{nav}</nav>
<main>{corpo}{bloco_fontes(fontes)}</main>
<div class="rodape">Gerado a partir de <code>{html.escape(caminho_md.name)}</code> pela skill
<strong>aprender-ratos</strong>. O markdown continua sendo a fonte de verdade: edite lá e gere de novo.</div>
</div></body></html>"""

    destino = saida or caminho_md.with_suffix(".html")
    destino.write_text(doc, encoding="utf-8")
    return destino


def main():
    ap = argparse.ArgumentParser(description="Gera o HTML do aprendizado.")
    ap.add_argument("markdown", help="caminho do aprendizado.md")
    ap.add_argument("--out", help="caminho do HTML (default: ao lado do md)")
    a = ap.parse_args()

    caminho = Path(a.markdown).expanduser()
    if not caminho.is_file():
        print(f"não achei {caminho}", file=sys.stderr)
        sys.exit(1)

    destino = montar(caminho, Path(a.out).expanduser() if a.out else None)
    n = len(ler_fontes(caminho.parent))
    print(f"{destino}  ({n} fonte(s) no rodapé)")


if __name__ == "__main__":
    main()
