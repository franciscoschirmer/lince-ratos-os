# Exemplos de estilo

Esta pasta tem exemplos reais de "DNA visual" pra calibrar o gpt-image-2.

**Não são obrigatórios.** A skill funciona sem nenhum deles. Eles servem pra:

1. Te inspirar quando tu não sabe que estilo quer
2. Te mostrar o nível de detalhe que faz diferença no output (referências cinematográficas, lighting, paleta, props, mood)
3. Servir de modelo se tu quiser criar o próprio (pro teu canal, marca, projeto)

## Como usar um exemplo

Quando o Claude perguntar o estilo no começo da geração, tu pode falar:

> "usa o estilo do exemplo Ratos"

Ele vai ler o arquivo e aplicar.

## Como criar o teu próprio

Copia um exemplo, renomeia, edita pra refletir o teu mundo:

```bash
cp ~/.claude/skills/gpt-image2-ratos/examples/estilo-ratos.md ~/.claude/skills/gpt-image2-ratos/examples/estilo-meu.md
```

Depois é só falar: "usa o estilo meu".

Tu também pode colar um brand guide direto no chat na hora — não precisa virar arquivo se for one-shot.

## Exemplos disponíveis

- **`estilo-ratos.md`** — DNA visual do canal Ratos de IA. Cinematic pop-nerd, referências Silicon Valley / Breaking Bad / lab. Personagem nerd com boné do mascote rato. Bom pra ver como um estilo bem específico fica documentado.
