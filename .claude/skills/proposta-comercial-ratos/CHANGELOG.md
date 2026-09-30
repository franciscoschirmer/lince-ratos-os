# Changelog — proposta-comercial-ratos

## Regras pra aplicar uma atualização

Quem aplica é o Claude do usuário, e o estado local de cada instalação diverge. Então:

1. **Nunca tocar** em `design.md`, `proposta-comercial.config.json` nem em nada dentro da
   pasta de saída das propostas. Esses arquivos são do usuário.
2. **Backup antes de editar:** copiar o arquivo pra `.bak` antes de qualquer mudança.
3. **Se o bloco local não bater com o "ANTES"** descrito aqui, é customização do usuário.
   Não sobrescrever cego: mostrar a diferença e perguntar.
4. **Aplicar as versões em ordem**, da atual (ver `VERSION`) até a mais nova.
5. No fim, atualizar o `VERSION` e conferir que o `check-quebras.js` ainda roda
   (`node --check scripts/check-quebras.js`).

Rótulos de risco: `ADITIVO` (só acrescenta) · `SUBSTITUIÇÃO` (troca bloco existente) ·
`BREAKING` (muda comportamento ou formato de arquivo).

---

## 1.0.1 — 2026-08-24

Busca de marca melhorada. Saiu de uma rodada real da skill num projeto que **tinha** a marca
toda escrita e mesmo assim caiu no "não achei nada", porque os arquivos tinham outro nome.

**`references/setup.md`** · `SUBSTITUIÇÃO` · Passo 2

- ANTES: duas listas curtas de caminho exato (`marca/design-guide.md`, `design.md`,
  `.claude/design.md`), com a instrução de **parar no primeiro que achar**.
- DEPOIS: três blocos que se somam em vez de se excluir. O primeiro manda **listar a pasta de
  marca** (`marca/`, `brand/`, `identidade/`, `identity/`, `design/`) com `ls` e ler o que
  tiver dentro, em vez de adivinhar nome de arquivo. Inclui `brand-dna.md`, `tom-de-voz/`,
  `STYLEGUIDE.md` e outros nomes comuns. Acrescenta: se o `CLAUDE.md`/`AGENTS.md` apontar pra
  um guia de marca, seguir o ponteiro.
- Motivo: cor, tom e logo quase nunca estão no mesmo arquivo. "Parar no primeiro" garantia
  encontrar um terço da marca.

**`references/setup.md`** · `ADITIVO` · novo Passo 2b, "Achar o logo"

- Procura em `marca/logo/`, `marca/`, `brand/`, `assets/`, `public/`, `static/`, `img/`,
  `images/` e raiz, por nome contendo `logo`, `logotipo`, `marca`, `wordmark`, `brand`.
- Regra de escolha: descartar `-branco`/`-negativo`/`-invertido`/`reverse` (são pra fundo
  escuro), preferir SVG, preferir horizontal, e **abrir o arquivo pra olhar antes de usar**.
- Motivo, e é o ponto todo: a proposta tem fundo claro. Logo claro em fundo claro **não gera
  erro**. O HTML valida, o navegador abre, e o logo simplesmente não aparece. Aconteceu numa
  rodada de teste e só foi pego olhando a tela.

**`references/setup.md`** · `SUBSTITUIÇÃO` · Cenários A e B

- O bloco de confirmação passa a citar **a origem de cada campo** (qual arquivo deu a cor,
  qual deu o tom), pro usuário corrigir sem adivinhar o que foi lido.
- Novo caso explícito de "achou parte, faltou parte", que é o mais comum e antes caía errado
  no Cenário B.
- O Cenário B ganha uma trava: conferir que a busca foi completa antes de assumir que o
  projeto não tem marca.

**`SKILL.md`** · `SUBSTITUIÇÃO` · resumo da Fase 0 (5 passos em vez de 4) e `ADITIVO` · duas
linhas no checklist da Fase 6 (o logo aparece de verdade; a pasta `assets/` está junto).

---

## 1.0.0 — 2026-08-24

Primeira versão pública.

- Setup guiado na primeira execução, aproveitando `_contexto/empresa.md`,
  `marca/design-guide.md`, `design.md` e `CLAUDE.md` quando existirem
- Config em dois arquivos: `design.md` (visual e tom, compartilhado com a
  `apresentacao-comercial`) e `proposta-comercial.config.json` (operacional)
- Fluxo em 7 fases: insumos, entendimento, o que falta, esqueleto em texto, HTML,
  verificação, publicação opcional
- Transcrição por delegação: usa `transcribe` / `transcrever-audio` se estiverem
  instaladas, e segue por entrevista se não estiverem
- Design system inteiro por variáveis CSS, com fallback neutro que roda sem configuração
- `check-quebras.js` com detecção de Chrome em macOS, Linux e Windows, e skip elegante
  quando não acha o navegador
- Publicação opcional delegada pra `cloudflare-ratos`, sempre perguntando antes
