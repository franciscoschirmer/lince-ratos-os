# Estilo Visual — Ratos de IA

Calibração pra geração de imagem com gpt-image-2. Ler **antes** de sugerir conceitos ou escrever prompts.

---

## Referência-âncora

Capa do episódio 12 (Richard do Silicon Valley no hacker-basement com boné preto do rato):

- Personagem: cara nerd tipo Richard Hendricks (Silicon Valley HBO)
- Wardrobe: boné preto com logo pequeno do rato branco, plaid shirt, hoodie cinza zip
- Cenário: 4 monitores (dois com VSCode, dois com dashboards fictícios), teclado mecânico, abajur de banqueiro dourado à esquerda, cabos à mostra, café em caneca branca
- Lighting: abajur dourado warm key + backlight azulado frio dos monitores
- Expressão: meio perdido, meio concentrado, humanamente ansioso
- Color grade: filmic, saturado, warm highlights + cool shadows
- Mood: indie film, basement-coded, tongue-in-cheek nerd

**Isso é o Norte.** Todo prompt que a gente escrever deve puxar pra essa direção, não pra Monocle/Kinfolk.

---

## Três estéticas-mãe

Misturar conforme o tema. Nunca limpo corporativo.

### 1. Cinematic pop-nerd (default)

Referências: **Silicon Valley (HBO), Severance (Apple), Mr. Robot, The Social Network, Pied Piper storyline**.

- Basement hackers, garage startups, open-space caóticos com 5 monitores
- Pessoas reais com expressões ansiosas, concentradas, meio awkward
- Roupas casuais bagunçadas: hoodie, plaid, t-shirt velha, óculos
- Props: teclado mecânico, CRT ocasional, post-its, energy drinks, fones dependurados
- Lighting: practical lights (abajur, monitor, fita LED), nunca luz neutra de janela
- Color: filmic/muted warm + cool backlight

**Quando usar:** capas de episódio, ads de curso de dev/técnico, criativos sobre Claude Code

### 2. Lab de química / Breaking Bad

Referências: **Breaking Bad (opening scenes, RV, superlab), Dexter's Laboratory, Rick & Morty lab**.

- Tubos de ensaio, béqueres, fumaça, líquidos coloridos
- Óculos de proteção, jalecos, hazmat suits (irreverente, não sério)
- Cenário: bancada de lab improvisada, químico DIY, quadro-negro com equações rabiscadas
- Etiquetas fictícias em produtos: "GPT-5.4 PURO", "IA de rua", "Claude Code 99.8%"
- Lighting: fluorescente verde-azulada + one warm practical (isqueiro, lamparina)
- Mascote: rato de laboratório branco pode aparecer (referência DobraLabs)

**Quando usar:** ads sobre experimentação com IA, testes, "cientista de IA", comparação de modelos

### 3. Lego-diorama / miniatura

Referências: **The Lego Movie, Wes Anderson miniatures, indie stop-motion**.

- Cenas em miniatura com bonequinhos Lego ou tipo-Lego
- Cenários construídos: escritório em chamas, mesa de trabalho, sala de guerra
- Tilt-shift photography (parece brinquedo mesmo sendo foto real)
- Tudo ligeiramente exagerado, humor visual
- Cores saturadas mas naturais de plástico

**Quando usar:** humor, metáfora visual, comparação "antes/depois", ads zoando concorrência

---

## Regras visuais sempre

### Sempre

- **Practical lighting** (abajur, monitor, lamparina, lâmpada exposta), nunca softbox corporativo
- **Filmic color grade**: warm highlights + cool shadows, saturação média-alta
- **Imperfeição intencional**: cabos à mostra, bagunça, post-its peeling
- **Humor visual** ou tongue-in-cheek
- **Referências pop específicas** (nunca "cinematic" genérico)
- **Texto em PT com acentos** sempre entre aspas no prompt: `reads "a IA não sabe de nada"`

### Accent color

Amarelo #FFD600 da DobraLabs **quando aparece**, aparece como:
- Cor de abajur (light prática)
- Uma peça de roupa (t-shirt, capuz)
- Etiqueta/post-it
- Single-word highlight no texto overlay
- Cursor ou 1 linha destacada no terminal

**Nunca** como fundo chapado ou elemento decorativo. Se não couber, deixar de fora.

### Mascote — rato DobraLabs

O rato (logo branco/preto) aparece como:
- Stencil em boné preto
- Sticker em laptop
- Patch em jaqueta
- Pelúcia/boneca na estante
- Rato de laboratório real no cenário (lab estética)

Mantém a marca sem forçar "ad obvio".

---

## Anti-estética (NUNCA)

- ❌ **Monocle/Kinfolk editorial minimalista** — corporate clean
- ❌ **Stock photography** — people in suits smiling at cameras
- ❌ **Iconografia flat/Dribbble** — gradient, ícones coloridos
- ❌ **Luz natural neutra de janela grande** sem lighting practical
- ❌ **Emoji em imagem** — nunca
- ❌ **Fundo chapado colorido** — exceto se for estética lab/diagrama explícita
- ❌ **"Cinematic" genérico** — sempre referência pop específica (Silicon Valley, Breaking Bad, Severance, não "movie-style")
- ❌ **AI-art óbvio** — rosto derretendo, dedos errados, anatomia quebrada

---

## Padrões de composição

### Medium shot com personagem

- 3/4 profile ou front-facing, peito pra cima
- Personagem no centro ou regra dos terços
- Background preenchido mas em soft focus (f/2.0-2.8 equivalent)
- Props ao redor contam história do mundo

### Overhead still life

- Top-down, workstation
- Laptop + café + caderno + objetos pessoais
- Warm wood ou concreto bagunçado
- Luz de abajur entrando da lateral

### Split-screen ou comparison

- Divisão vertical 50/50 com linha clean
- Dois mundos distintos em lighting
- Headline cruzando se necessário

### Close-up detail

- Mãos em teclado, olhos vistos pela tela, dedo clicando
- Macro lens feel
- Depth of field radical

---

## Cheat sheet de termos pro prompt (em EN)

Colar conforme contexto:

**Lighting:**
- "moody practical lighting, warm banker lamp key light from left, cool blue monitor backlight, filmic color grade"
- "chiaroscuro lighting, single practical light source, deep shadows, Rembrandt-style"
- "fluorescent overhead with one warm practical accent, slightly unflattering but intentional"

**Color grade:**
- "teal and orange filmic grade, saturated but not oversaturated, Kodak Portra film emulation"
- "muted desaturated grade with one saturated accent color (#FFD600 yellow)"
- "slightly greenish monitor glow, warm highlights, Breaking Bad desert palette when outdoor"

**Camera:**
- "shot on mirrorless with 50mm prime f/2.0, shallow depth of field, slight film grain"
- "anamorphic lens flare on practical lights, 2.39:1 cinematic feel forced into 4:5 crop"
- "phone camera candid feel, slightly off-center framing, motion blur light in background"

**Character direction:**
- "anxious concentrated nerd expression, Richard Hendricks coded, slight slouch at desk"
- "tongue-in-cheek mad scientist energy, goggles pushed up on forehead, mid-laugh"
- "overwhelmed startup founder at 3am, coffee in hand, monitor glow on face"

**Environment:**
- "cluttered basement hacker den, 4 monitors, exposed cables, energy drink cans, post-its"
- "makeshift chemistry lab on kitchen counter, beakers bubbling, periodic table poster"
- "tilt-shift Lego diorama of startup office, miniature figures, controlled chaos"

---

## Fluxo de sugestão (quando usar modo assistido)

Ao receber um tema, estruturar 3 conceitos assim:

```
**1. [nome do conceito]** — [estética-mãe]
Uma linha descrevendo a cena + referência pop.
Mood + 1 prop ou detalhe marcante.

**2. [nome]** — [estética-mãe]
...

**3. [nome]** — [estética-mãe]
...

Qual vai? Pode misturar 1 e 3, trocar personagem, mudar ângulo.
```

Os 3 conceitos devem ser **visualmente distintos** (não 3 variações do mesmo). Se o tema pede personagem, pelo menos 1 sem personagem. Se pede interior, pelo menos 1 exterior. Cobrir espectro.
