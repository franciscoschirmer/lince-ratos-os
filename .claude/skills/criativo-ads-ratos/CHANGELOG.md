# Changelog — criativo-ads-ratos

## Como aplicar uma atualização

Cola no Claude Code: **"checa a atualização da skill criativo-ads-ratos e aplica"**. Ele lê este
arquivo, compara com o teu `VERSION` e aplica só o que falta, na ordem.

Regras que valem sempre:

- **Nunca tocar** no `brand.yaml`, no `copy.md`, na pasta `pecas/` nem em `assets/img/` de nenhum
  lote. É o teu trabalho, não é da skill
- **Nunca sobrescrever** `assets/theme.css` nem `assets/marca.json` de um lote: são gerados a
  partir do teu `brand.yaml`
- Fazer backup `.bak` antes de editar qualquer arquivo da skill
- Se o bloco local não bate com o "ANTES", é customização tua: **não sobrescreve**. Mostra a
  diferença e pergunta
- Lote antigo continua funcionando com o CSS que ele já tem. Pra levar melhoria de CSS pra um
  lote velho, copiar `assets/css/*.css` da skill por cima do `assets/css/` daquele lote e
  renderizar de novo

---

## 1.0.0 — 2026-08-25

Primeira versão.

- Engine agnóstica de marca: `brand.yaml` → `theme.css` (só CSS var). Nenhum layout tem cor ou
  fonte escrita dentro
- 9 layouts: `l-top`, `l-mid`, `l-quote`, `l-bleed`, `l-card`, `l-split`, `l-price`, `l-stat`,
  `l-list`. 3 temas derivados da mesma marca: `t-dark`, `t-light`, `t-accent`
- 3 formatos: 1:1 (1080×1080), 4:5 (1080×1350) e 9:16 (1080×1920), com as safe zones da Meta
  embutidas. O 9:16 tem por padrão o corte do Reels (35% da base), e `story-only` libera pra 330px
  quando a peça não roda em Reels
- 3 modos de entrada: copy pronta, só a ideia, ou anúncio de referência
- Descoberta de marca varrendo o projeto (guia de marca, `_contexto/`, `CLAUDE.md`, CSS do site),
  com pesquisa online e Q&A como saídas quando não acha nada
- Geração de ilustração opcional, plugada em três backends (plano do ChatGPT via Codex, FAL, ou
  Gemini), com detecção automática de qual está configurado
- `scaffold.sh` monta o lote auto-contido · `render.mjs` lê o formato do próprio HTML ·
  `variar.mjs` clona a peça pra outro formato · `contact-sheet.mjs` junta tudo num grid pra revisão
