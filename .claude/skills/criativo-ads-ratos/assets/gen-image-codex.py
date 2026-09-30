#!/usr/bin/env python3
"""Gera UMA imagem via gpt-image-2 (OAuth do plano ChatGPT, ~/.codex/auth.json).
Uso:  python3 gen-image.py <saida.png> "<prompt em ingles>" [WxH]
Ex:   python3 gen-image.py assets/img/AD03.png "a pixelated rat astronaut ... {STYLE}" 1024x1792
Default size 1024x1792 (9:16). Feed pode usar o mesmo (o CSS recorta pra 4:5).
Reusa o proxy openai-oauth na porta 10531 se ja estiver de pe. Latencia ~40-90s.
"""
import json, base64, pathlib, sys, time, subprocess, urllib.request, urllib.error

PORT = 10531
if len(sys.argv) < 3:
    print(__doc__); sys.exit(1)
DEST = pathlib.Path(sys.argv[1]); DEST.parent.mkdir(parents=True, exist_ok=True)
PROMPT = sys.argv[2]
SIZE = sys.argv[3] if len(sys.argv) > 3 else "1024x1792"

def log(m): print(f"[gen] {m}", flush=True)

def proxy_up():
    try: urllib.request.urlopen(f"http://127.0.0.1:{PORT}/v1/models", timeout=3); return True
    except urllib.error.HTTPError: return True
    except Exception: return False

def ensure_proxy():
    if proxy_up(): return
    log("subindo proxy openai-oauth...")
    subprocess.Popen(["npx","-y","openai-oauth","--port",str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i in range(60):
        if proxy_up(): log(f"proxy UP ({i}s)"); return
        time.sleep(1)
    log("ERRO: proxy nao subiu (checar `test -f ~/.codex/auth.json`)"); sys.exit(1)

def main():
    if not pathlib.Path.home().joinpath(".codex/auth.json").exists():
        log("ERRO: ~/.codex/auth.json nao existe. Rode `npx @openai/codex login` uma vez."); sys.exit(2)
    ensure_proxy()
    payload = {"model":"gpt-5.4-mini","input":[
        {"role":"developer","content":"You are an image generation assistant. Your sole function is to invoke the image_generation tool. Never respond with plain text."},
        {"role":"user","content":f"Generate an image: {PROMPT}"}],
        "tools":[{"type":"image_generation","quality":"medium","size":SIZE,"moderation":"low"}],
        "tool_choice":"auto","stream":True}
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/responses",
        data=json.dumps(payload).encode(),
        headers={"Content-Type":"application/json","Accept":"text/event-stream"})
    log(f"gerando {DEST.name} ({SIZE})..."); t0=time.time()
    raw = urllib.request.urlopen(req, timeout=300).read().decode()
    img=None
    for block in raw.split("\n\n"):
        data="".join(l[6:] for l in block.split("\n") if l.startswith("data: "))
        if not data or data=="[DONE]": continue
        try: e=json.loads(data)
        except json.JSONDecodeError: continue
        if e.get("type")=="response.output_item.done":
            it=e.get("item",{})
            if it.get("type")=="image_generation_call" and it.get("result"): img=it["result"]
    if not img:
        log(f"ERRO: sem imagem no SSE. tail: {raw[-300:]}"); sys.exit(3)
    DEST.write_bytes(base64.b64decode(img))
    log(f"salvo {DEST} ({DEST.stat().st_size}b, {int(time.time()-t0)}s)")

if __name__ == "__main__":
    main()
