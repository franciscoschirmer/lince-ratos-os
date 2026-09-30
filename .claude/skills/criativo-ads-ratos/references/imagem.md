# Imagem na peça

A imagem é **cena, textura, personagem** — nunca o texto do anúncio. Texto renderizado por modelo de
imagem sai torto, quebra acento e não dá pra editar. Todo texto vem do HTML.

Layouts que usam imagem: `l-bleed`, `l-card`, `l-split`. Os outros seis rodam sem nenhuma.

## Perguntar antes de gerar

**Sempre perguntar se o user quer conectar um gerador**, e qual. São três, e ele provavelmente já
tem um instalado:

| Backend | O que é | Custo | Quando |
|---|---|---|---|
| `codex` | gpt-image-2 pelo OAuth do plano ChatGPT | zero (usa o plano) | tem ChatGPT pago. 40-90s por imagem |
| `fal` | gpt-image-2 via FAL (skill `image-gen-ratos`) | ~$0.06 medium | quer velocidade e não paga ChatGPT |
| `nano` | Nano Banana / Gemini (skill `nanobanana-ratos`) | free tier | rascunho rápido, cena sem texto |

```bash
bash assets/gen-image.sh assets/img/AD03.png "<prompt em ingles>" 9x16 [backend]
```

Sem backend, ele escolhe o primeiro disponível. Se não tem nenhum configurado, ele diz como
configurar **e** lembra que dá pra seguir sem imagem. Seguir sem imagem é uma resposta legítima:
peça tipográfica boa bate peça com stock ruim.

Gera em **9x16 (1024×1792)** por padrão, mesmo que a peça seja 4:5 — o CSS recorta. Uma imagem
serve os três formatos.

## Prompt

Regras que mudam o resultado:

1. **Em inglês.** Os modelos foram treinados assim.
2. **Descreve a cena, não a intenção.** "a rat astronaut floating in a dark starry sky" funciona;
   "an image that conveys freedom" não.
3. **Trava a paleta** com os hex do `brand.yaml`. Sem isso a imagem sai de outra marca.
4. **Deixa espaço pro texto, e o espaço muda com o layout.** Diz no prompt onde o sujeito fica:
   - `l-bleed` (texto por cima da imagem) → *"subject in the LOWER HALF, top of frame empty"*
   - `l-split` (só a faixa de cima da imagem aparece) → *"subject in the UPPER HALF, centered"*
   - `l-card` (a imagem inteira aparece no cartão) → sujeito centralizado

   Errar isso é o erro mais comum: uma imagem feita pro `l-bleed` colada num `l-split` mostra só
   fundo vazio. Se já gerou e não quer regerar, dá pra salvar reenquadrando no HTML:
   `<img style="object-position:center 74%">` (0% mostra o topo da imagem, 100% mostra a base).
5. **Proíbe texto**: *"No text, no letters, no numbers, no logos, no watermark."*

Trava padrão pra colar no fim do prompt, trocando os hex pelos da marca:

> Strict palette: [BG_HEX], [ACCENT_HEX], [FG_HEX]. Subject in the lower half, top of frame empty
> and dark. No text, no letters, no numbers, no logos, no watermark. Vertical 9:16.

Se for gerar várias, roda em sequência num script e acompanha o log. Não abre uma por uma.

## A regra de leitura (a mais importante)

**O sujeito da imagem nunca fica atrás do texto.** Na ordem:

1. **Desce a imagem** até o sujeito sair de baixo do texto:
   `<div class="bg" style="--shift:300px;--zoom:1.15">`
   9:16 costuma pedir 250-330px, 4:5 uns 180-210px, 1:1 uns 140-170px. Ajusta olhando o render.
   `--zoom` cobre a borda que o deslocamento abre.
2. **Fundo cheio ou claro?** soma leitura:
   - `.lens` — véu uniforme `rgba(0,0,0,.28)` sobre a imagem toda
   - `.scrim.suave` — escurece só o topo, some antes do sujeito
   - `.sombra` no texto, quando ele cai sobre área clara
3. **Fundo já escuro e vazio** (céu, sala escura): o `.scrim` padrão basta, não precisa véu.

Se depois de tudo o texto ainda briga com a imagem, o problema é a imagem. Gera outra com o sujeito
mais embaixo em vez de empilhar véu — véu demais mata a arte e o anúncio fica cinza.

## Foto real, print e mockup

Nem toda imagem é gerada. Foto do cliente, print de tela, mockup de produto:

- **foto de pessoa** → `l-split` (imagem em cima, texto embaixo). Rosto no terço superior.
- **print de tela** → `l-card`. O cartão dá moldura e some com o amador.
- **packshot com fundo transparente** → `l-bleed` com fundo liso do tema.

Print de conversa e review funcionam melhor **recriados no HTML** (`l-quote`) do que colados como
imagem: fica legível em qualquer tamanho e não parece screenshot borrado.
