#!/usr/bin/env python3
"""
AI Visibility tracker — mede se a tua marca aparece nas respostas das IAs.

Reproduz os paineis de "AI Visibility / Brand Performance" (tipo os de ferramentas
pagas) usando o endpoint AI Optimization do DataForSEO (ChatGPT/Gemini/Perplexity
com web search real) + classificacao simples por texto.

Mede, pras queries de comprador de um site:
  - Share of Voice por marca e por plataforma (quem a IA cita, e quanto)
  - Top Domains by Citations (fontes que a IA usa)
  - Breakdown by Question (presenca e posicao de cada concorrente por pergunta)
  - salva o JSON cru de todas as respostas, pra camada de sentimento/estrategia
    ser gerada por cima pelo Claude.

E a metrica de GEO do playbook (Pilar 4): "aqui nao tem clique, tem mencao".
Custo ~US$ 0,03 por (prompt x plataforma). Tudo derivado de perguntar pros LLMs.

--------------------------------------------------------------------------------
PROMPTS: sao especificos do teu site (o que um comprador digitaria pra achar um
servico/produto como o teu). Passa eles com --prompts-file (um por linha) ou
--prompts "p1||p2". O Claude gera esses prompts pra ti na sessao de /seo-ranking.

CREDENCIAIS: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD. O script procura, em ordem:
  1. variaveis de ambiente
  2. ./.env  (no diretorio atual)
  3. ~/.config/seo-ranking-ratos/.env
Pega as credenciais em https://app.dataforseo.com/api-access

SEM CREDENCIAL / SEM GASTAR: usa --dry-run pra imprimir os prompts e rodar na mao
nas IAs (modo manual). Nao chama a API, nao precisa de credencial.
--------------------------------------------------------------------------------

Uso (medindo de verdade):
    python3 ai-visibility.py --brand "Minha Marca" --domain minhamarca.com \\
      --competitors "Concorrente A=a.com,Concorrente B=b.com" \\
      --platforms chatgpt,perplexity \\
      --prompts-file prompts.txt \\
      --out-json panels.json --out ai-visibility-log.csv

Uso (modo manual, sem gastar):
    python3 ai-visibility.py --brand "Minha Marca" --prompts-file prompts.txt --dry-run
"""

import argparse
import base64
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date

API = "https://api.dataforseo.com"

# plataformas suportadas no AI Optimization do DataForSEO
PLATFORMS = {
    "chatgpt":    {"models": "/v3/ai_optimization/chat_gpt/llm_responses/models",
                   "live":   "/v3/ai_optimization/chat_gpt/llm_responses/live"},
    "gemini":     {"models": "/v3/ai_optimization/gemini/llm_responses/models",
                   "live":   "/v3/ai_optimization/gemini/llm_responses/live"},
    "perplexity": {"models": "/v3/ai_optimization/perplexity/llm_responses/models",
                   "live":   "/v3/ai_optimization/perplexity/llm_responses/live"},
}


def load_prompts(args):
    if args.prompts:
        prompts = [p.strip() for p in args.prompts.split("||") if p.strip()]
    elif args.prompts_file:
        prompts = [l.strip() for l in open(args.prompts_file)
                   if l.strip() and not l.startswith("#")]
    else:
        sys.exit(
            "Erro: nenhum prompt fornecido.\n"
            "Os prompts sao especificos do teu site (o que um comprador digitaria\n"
            "pra achar um servico/produto como o teu). Passa com:\n"
            "  --prompts-file prompts.txt   (um prompt por linha)\n"
            "  --prompts \"p1||p2||p3\"\n"
            "Na sessao de /seo-ranking o Claude gera esses prompts pra ti."
        )
    if not prompts:
        sys.exit("Erro: arquivo/lista de prompts vazio.")
    return prompts


def load_creds():
    login = os.environ.get("DATAFORSEO_LOGIN")
    pwd = os.environ.get("DATAFORSEO_PASSWORD")
    paths = [
        os.path.join(os.getcwd(), ".env"),
        os.path.expanduser("~/.config/seo-ranking-ratos/.env"),
    ]
    for path in paths:
        if (login and pwd) or not os.path.exists(path):
            continue
        for line in open(path):
            line = line.strip()
            if line.startswith("DATAFORSEO_LOGIN="):
                login = login or line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("DATAFORSEO_PASSWORD="):
                pwd = pwd or line.split("=", 1)[1].strip().strip('"')
    if not login or not pwd:
        sys.exit(
            "Erro: credenciais DataForSEO nao encontradas.\n"
            "Cria um .env (ver .env.example) com DATAFORSEO_LOGIN e DATAFORSEO_PASSWORD,\n"
            "ou roda com --dry-run pra fazer no modo manual (sem gastar)."
        )
    return login, pwd


def make_caller(login, pwd):
    auth = base64.b64encode(f"{login}:{pwd}".encode()).decode()

    def call(path, body=None, method="POST"):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            API + path, data=data,
            headers={"Authorization": "Basic " + auth, "Content-Type": "application/json"},
            method=method)
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            return {"_http_error": e.code, "_body": e.read().decode()[:600]}
    return call


def pick_model(call, platform):
    cfg = PLATFORMS[platform]
    models = call(cfg["models"], method="GET")
    try:
        items = models["tasks"][0]["result"]
        cand = [m["model_name"] for m in items
                if m.get("web_search_supported") and m.get("task_post_supported")]
        if not cand:
            cand = [m["model_name"] for m in items if m.get("task_post_supported")]
        if not cand:
            return None
        minis = [m for m in cand if "mini" in m and "nano" not in m]
        return (minis or cand)[0]
    except Exception:
        return None


URL_RE = re.compile(r"https?://([^/\s)\]\"']+)")


def registrable_domain(host):
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    if len(parts) >= 3 and parts[-2] in {"com", "net", "org", "gov", "edu"} and parts[-1] in {"br", "ar", "mx", "co", "uk", "au"}:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def walk_text(obj, acc):
    """Extrai todo campo 'text' de qualquer estrutura (robusto entre plataformas)."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "text" and isinstance(v, str):
                acc.append(v)
            else:
                walk_text(v, acc)
    elif isinstance(obj, list):
        for it in obj:
            walk_text(it, acc)


def run_prompt(call, platform, model, prompt, country):
    cfg = PLATFORMS[platform]
    body = {"user_prompt": prompt, "model_name": model, "web_search": True,
            "max_output_tokens": 1500}
    # só o ChatGPT aceita o país do web search; gemini/perplexity rejeitam o campo
    if platform == "chatgpt":
        body["web_search_country_iso_code"] = country
    resp = call(cfg["live"], [body])
    cost = resp.get("cost", 0) or 0
    try:
        result = resp["tasks"][0]["result"][0]
    except Exception:
        return {"error": json.dumps(resp)[:300], "cost": cost, "text": "", "domains": []}
    acc = []
    walk_text(result, acc)
    text = "\n".join(acc)
    seen, domains = set(), []
    for host in URL_RE.findall(text):
        d = registrable_domain(host)
        if d and d not in seen and "openai.com" not in d:
            seen.add(d)
            domains.append(d)
    return {"text": text, "domains": domains, "cost": cost}


def parse_brands(brand, domain, competitors_str):
    """Retorna lista [{name, domain, aliases:[...]}] do alvo + concorrentes."""
    brands = []

    def aliases(name, dom):
        al = set()
        if name:
            al.add(name.lower())
            al.add(name.lower().replace(" ", ""))
            al.add(name.lower().replace(".", ""))
        if dom:
            al.add(dom.lower())
            al.add(registrable_domain(dom))
            al.add(dom.lower().split(".")[0])
        return [a for a in al if len(a) >= 3]

    brands.append({"name": brand, "domain": domain, "aliases": aliases(brand, domain), "is_target": True})
    if competitors_str:
        for tok in competitors_str.split(","):
            tok = tok.strip()
            if not tok:
                continue
            if "=" in tok:
                nm, dm = tok.split("=", 1)
            elif ":" in tok:
                nm, dm = tok.split(":", 1)
            else:
                nm, dm = tok, tok
            brands.append({"name": nm.strip(), "domain": dm.strip(),
                           "aliases": aliases(nm.strip(), dm.strip()), "is_target": False})
    return brands


def first_pos(text_l, aliases):
    """Posicao (indice de caractere) da 1a mencao; None se ausente."""
    best = None
    for a in aliases:
        i = text_l.find(a)
        if i >= 0 and (best is None or i < best):
            best = i
    return best


def dry_run(args, prompts, platforms):
    """Modo manual: imprime os prompts pra rodar na mao nas IAs. Nao gasta nada."""
    print(f"# AI Visibility — modo manual (dry-run) — {args.brand}\n")
    print("Cola cada prompt abaixo no ChatGPT/Perplexity/Gemini (com busca ligada)")
    print("e anota: (1) a tua marca apareceu? (2) em que posicao vs concorrentes?")
    print("(3) que dominios a IA citou como fonte?\n")
    print(f"Plataformas sugeridas: {', '.join(platforms)}")
    print(f"Marca-alvo: {args.brand}" + (f" ({args.domain})" if args.domain else ""))
    if args.competitors:
        print(f"Concorrentes a observar: {args.competitors}")
    print("\n" + "=" * 60)
    for i, p in enumerate(prompts, 1):
        print(f"\n[Prompt {i}]\n{p}")
    print("\n" + "=" * 60)
    print(f"\n{len(prompts)} prompts. Custo: US$ 0,00 (modo manual).")
    print("Quando quiser medir automatico e acompanhar no tempo, roda sem --dry-run")
    print("com as credenciais DataForSEO configuradas.")


def main():
    ap = argparse.ArgumentParser(description="AI Visibility / Brand Performance via DataForSEO.")
    ap.add_argument("--brand", required=True)
    ap.add_argument("--domain", default="")
    ap.add_argument("--competitors", default="", help="'Nome=dominio,Nome=dominio' (concorrentes a rastrear)")
    ap.add_argument("--platforms", default="chatgpt", help="csv: chatgpt,gemini,perplexity")
    ap.add_argument("--prompts-file", default="", help="arquivo com um prompt por linha")
    ap.add_argument("--prompts", default="", help="prompts inline separados por ||")
    ap.add_argument("--country", default="BR")
    ap.add_argument("--out", default="ai-visibility-log.csv")
    ap.add_argument("--out-json", default="", help="salva respostas cruas + paineis (pra camada de sentimento)")
    ap.add_argument("--dry-run", action="store_true", help="modo manual: so imprime os prompts, nao chama a API")
    args = ap.parse_args()

    prompts = load_prompts(args)
    platforms = [p.strip() for p in args.platforms.split(",") if p.strip() in PLATFORMS]
    if not platforms:
        sys.exit("Erro: nenhuma plataforma válida em --platforms (use chatgpt,gemini,perplexity).")

    if args.dry_run:
        dry_run(args, prompts, platforms)
        return

    login, pwd = load_creds()
    call = make_caller(login, pwd)

    brands = parse_brands(args.brand, args.domain, args.competitors)
    today = date.today().isoformat()
    total_cost = 0.0
    raw = []  # {platform, prompt, text, domains}

    print(f"# AI Visibility — {args.brand}")
    print(f"Data {today} · Plataformas {platforms} · Prompts {len(prompts)} · Marcas rastreadas {len(brands)}\n")

    models = {}
    for p in platforms:
        m = pick_model(call, p)
        models[p] = m
        print(f"  {p}: modelo {m or 'INDISPONÍVEL'}")
    print()

    for p in platforms:
        if not models[p]:
            print(f"(pulando {p}: sem modelo)")
            continue
        for prompt in prompts:
            r = run_prompt(call, p, models[p], prompt, args.country)
            total_cost += r.get("cost", 0) or 0
            if r.get("error"):
                print(f"  [{p}] ERRO: {r['error'][:120]}")
                continue
            raw.append({"platform": p, "prompt": prompt, "text": r["text"], "domains": r["domains"]})

    if not raw:
        sys.exit("Nenhuma resposta obtida da API. Confere credenciais/saldo no DataForSEO.")

    # ---------- PAINEL 1: Share of Voice por marca x plataforma ----------
    print("## Painel 1 — Share of Voice (presença em % dos prompts)\n")
    header = "Marca".ljust(22) + "".join(p[:10].ljust(12) for p in platforms) + "geral"
    print(header)
    sov_rows = {}
    for b in brands:
        cells = []
        hits_total = n_total = 0
        for p in platforms:
            recs = [x for x in raw if x["platform"] == p]
            hits = sum(1 for x in recs if first_pos(x["text"].lower(), b["aliases"]) is not None)
            n = len(recs) or 1
            hits_total += hits
            n_total += n
            cells.append(f"{hits}/{n}")
        geral = f"{hits_total}/{n_total}"
        mark = "  ◀ MARCA" if b["is_target"] else ""
        print((b["name"][:20]).ljust(22) + "".join(c.ljust(12) for c in cells) + geral + mark)
        sov_rows[b["name"]] = {"per_platform": cells, "geral": geral, "is_target": b["is_target"]}

    # ---------- PAINEL 2: Top Domains by Citations ----------
    print("\n## Painel 2 — Top Domains by Citations (fontes que a IA usou)\n")
    dom_count = {}
    for x in raw:
        for d in set(x["domains"]):
            dom_count[d] = dom_count.get(d, 0) + 1
    target_doms = {registrable_domain(b["domain"]) for b in brands if b["domain"]}
    for d, c in sorted(dom_count.items(), key=lambda kv: kv[1], reverse=True)[:20]:
        tag = "  ◀" if d in target_doms else ""
        print(f"  {c:>3}  {d}{tag}")

    # ---------- PAINEL 3: Breakdown by Question ----------
    print("\n## Painel 3 — Breakdown by Question (posição de cada marca por pergunta)\n")
    for prompt in prompts:
        print(f"P: {prompt[:90]}")
        for p in platforms:
            rec = next((x for x in raw if x["platform"] == p and x["prompt"] == prompt), None)
            if not rec:
                continue
            tl = rec["text"].lower()
            ranking = []
            for b in brands:
                pos = first_pos(tl, b["aliases"])
                if pos is not None:
                    ranking.append((pos, b["name"], b["is_target"]))
            ranking.sort()
            line = " > ".join((f"*{nm}*" if tgt else nm) for _, nm, tgt in ranking) or "(nenhuma marca rastreada citada)"
            print(f"   [{p}] {line}")
        print()

    # ---------- saidas ----------
    print(f"Custo total: US$ {total_cost:.4f}\n")

    rows = []
    for x in raw:
        tl = x["text"].lower()
        for b in brands:
            pos = first_pos(tl, b["aliases"])
            rows.append({"date": today, "platform": x["platform"], "brand": b["name"],
                         "prompt": x["prompt"], "mentioned": int(pos is not None),
                         "cited_domains": "|".join(x["domains"])})
    write_header = not os.path.exists(args.out)
    with open(args.out, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["date", "platform", "brand", "prompt", "mentioned", "cited_domains"])
        if write_header:
            w.writeheader()
        w.writerows(rows)
    print(f"Log: {len(rows)} linhas em {args.out}")

    if args.out_json:
        out = {"date": today, "brand": args.brand, "platforms": platforms,
               "brands": [{"name": b["name"], "domain": b["domain"]} for b in brands],
               "sov": sov_rows, "top_domains": dict(sorted(dom_count.items(), key=lambda kv: kv[1], reverse=True)),
               "responses": raw}
        json.dump(out, open(args.out_json, "w"), ensure_ascii=False, indent=2)
        print(f"JSON (respostas cruas p/ camada de sentimento): {args.out_json}")


if __name__ == "__main__":
    main()
