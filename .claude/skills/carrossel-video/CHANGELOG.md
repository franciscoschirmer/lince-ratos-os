# Changelog — carrossel-video-ratos

Como aplicar uma atualização (pro Claude do aluno):

- **Nunca tocar** em `marca/design-guide.md` já preenchido, nem no `.env`. São
  dados/customização de quem instalou.
- Fazer backup `.bak` antes de editar qualquer arquivo.
- Se o bloco local divergir do "ANTES" de uma mudança, é customização do aluno:
  **não sobrescrever cego** — mostrar e perguntar.
- Aplicar da versão mais antiga pra mais nova, olhando o `VERSION` local.
- No fim, validar (`python3 -m py_compile scripts/*.py`,
  `node --check scripts/*.js templates/*.js exemplo/*.js`) e atualizar o `VERSION`.

Rótulos de risco: `ADITIVO` (só acrescenta) · `SUBSTITUIÇÃO` (troca bloco) ·
`BREAKING` (muda contrato/uso).

---

## 1.0.0 — 2026-08-06

Primeira versão pública. Derivada da `carrossel-video` interna da Ratos de IA
(via `carrossel-video-generica`), com a identidade do canal removida.

- `ADITIVO` — **três fontes de vídeo**: link do YouTube, link de outra
  plataforma (yt-dlp, 1000+ sites) e arquivo local. Antes só YouTube.
- `ADITIVO` — `scripts/transcrever.py`: gera o `.srt` na linha do tempo real
  quando não há legenda automática. Whisper local (grátis, padrão) ou AssemblyAI
  (opcional, `ASSEMBLYAI_API_KEY` no `.env`).
- `ADITIVO` — setup detecta design-guide já configurado (Ratos OS / Claude Code
  OS) antes de perguntar do zero.
- `ADITIVO` — **combina o CTA antes de montar**: pergunta se a pessoa dita o CTA,
  quer 2-3 opções pra escolher, ou deixa a skill escolher (mostrando as opções).
- `ADITIVO` — **preview padrão no fim** (`scripts/preview.js`): gera e abre uma
  página com os slides em ordem pra conferir antes de publicar.
- `ADITIVO` — **cross-language**: vídeo num idioma, carrossel em outro. Texto do
  slide sai no idioma alvo e o clipe embutido ganha legenda queimada traduzida.
- `ADITIVO` — `scripts/legendar.js`: queima legenda no clipe **sem depender de
  libass** (renderiza cada cue em PNG via Playwright e sobrepõe com `overlay`).
  Existe porque muita build de ffmpeg não tem o filtro `subtitles`.
- `ancorar.py` mais robusto (achado validando em vídeo real): trata legenda
  automática **rolling** do YouTube (dedup do trecho repetido) e casa frase com
  **contração/apóstrofo** ("you're", "I'm"), que antes zerava o match.
- Método de corte pelo sentido + ancoragem na respiração real, herdado e
  documentado (ver "Por que o corte mudou" no `SKILL.md`).
