# apresentacao-comercial

Skill do Claude Code pra gerar apresentações comerciais (decks de venda) em HTML navegável, com arco de storytelling estruturado em 8 atos.

A skill **constrói a narrativa em texto contigo antes de gerar slides** — não joga um deck pronto. E adapta o visual à tua marca (lê do teu RatosOS, do teu `design.md`, ou faz um setup rápido contigo na primeira vez).

## O que ela faz

- Gera um arquivo HTML único, auto-contido, com slides navegáveis (teclado, clique, swipe)
- Suporta export pra PDF direto pelo navegador (Cmd+P → Save as PDF)
- Adapta o visual à tua marca (cores, fonte) via variáveis CSS
- Constrói o arco narrativo contigo antes de gerar HTML (8 atos: capa → chamado → descoberta → contexto → tensão → tese → solução → prova → investimento → fechamento)
- Funciona out-of-the-box com template neutro preto/branco se não tiveres design configurado
- Detecta automaticamente teu sistema visual (RatosOS, `design.md`, etc) e pergunta como proceder

## Instalação

Clona o repo dentro da pasta de skills global do Claude Code:

```bash
# baixe o zip de apresentacao-comercial na plataforma (Materiais) e descompacte em ~/.claude/skills/
```

Pronto. Em qualquer projeto, basta chamar a skill:

```
/apresentacao-comercial
```

Ou simplesmente pedir: "faz uma apresentação da proposta pro cliente X" — o Claude vai detectar a skill automaticamente.

## Como funciona

### Primeira vez que tu usas

Na primeira execução, a skill faz um mini-setup:

1. **Procura contexto existente** na ordem:
   - `_contexto/empresa.md` (padrão do Claude Code OS / RatosOS)
   - `marca/design-guide.md`
   - `design.md` ou `design-guide.md` na raiz
   - `.claude/design.md`
   - `~/.claude/design.md` (global)

2. **Se achou:** pergunta se queres usar como base ou montar do zero.

3. **Se não achou:** te dá 3 opções:
   - Setup rápido (~5 perguntas) e salva em `design.md`
   - Template neutro (preto/branco minimalista)
   - Tu passa um PDF/site de referência e a skill lê

### Construção do deck

Depois do setup, a skill:

1. Lê o contexto do projeto e da proposta
2. Pergunta o que faltar (valor, escopo, formato)
3. **Propõe um arco narrativo em texto**, beat por beat
4. Itera contigo até aprovar
5. **Só então gera o HTML**
6. Salva em `./apresentacao-{cliente}.html` (ou onde tu pedires)

## Estrutura do repo

```
apresentacao-comercial/
├── SKILL.md                    # entrada principal (lida pelo Claude)
├── references/
│   ├── storytelling.md         # arco de 8 atos com exemplos
│   ├── templates.md            # 10 templates HTML com variáveis CSS
│   └── design-fallback.md      # sistema visual neutro + como configurar custom
└── assets/
    └── base.html               # scaffold do container navegável
```

## Templates disponíveis

| # | Template | Uso típico |
|---|----------|-----------|
| 1 | Capa bookend | Abertura e fechamento |
| 2 | Stat dupla | Dois números grandes com descrição |
| 3 | Pergunta em box | A pergunta do cliente |
| 4 | Grid categórico | Setores × desafios |
| 5 | Punchline solta | Frase de virada, ponto de tensão |
| 6 | Comparação 2 cards | Hard + soft, antes + depois |
| 7 | Título de ato | Abertura de ato narrativo |
| 8 | Equação visual | A + B + C = resultado |
| 9 | Lista com cards | Conteúdo programático, depoimentos, tópicos |
| 10 | Preço / CTA | Investimento, simulações, fechamento |

Cada template usa variáveis CSS (`--color-accent`, `--font-main`, etc) que se ajustam ao teu design system.

## Customizando o design

Cria um arquivo `design.md` na raiz do teu projeto:

```markdown
# Design System

Marca/empresa: Tua Marca

## Cores

Cor de destaque principal: #006B3F
Cor de destaque suave: #E0F2E8

## Tipografia

Fonte principal: Inter
Import (CSS): https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap

## Tom de comunicação

Direto, sem jargão, em português com acentos.
```

A skill lê isso e adapta todos os templates automaticamente.

## Filosofia

Esta skill é uma **versão genérica** da skill `design-apresentacao-comercial` que uso na DobraLabs. Os templates foram simplificados, as referências DobraLabs foram removidas e o sistema visual virou configurável via variáveis CSS.

O que NÃO mudou:
- Arco de storytelling em 8 atos (validado em propostas reais)
- Filosofia "cliente como protagonista, tensão antes de solução"
- Antipadrões de escrita (evita texto com cara de IA)
- Arquitetura HTML navegável + PDF-ready

## Créditos

Skill criada por [@dobralabs](https://dobralabs.com.br), compartilhada com a comunidade de alunos da [Ratos de IA](https://ratosdeia.com.br).

## Licença

MIT — usa, modifica, compartilha. Se melhorar algo, abre um PR.
