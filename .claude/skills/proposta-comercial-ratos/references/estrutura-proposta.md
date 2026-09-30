# Estrutura da proposta

As seções, o que cada uma resolve e o que muda conforme o tipo de venda.

---

## Estrutura base (serve pra todo mundo)

```
1. Capa               quem, o quê, quando, validade
2. Entendimento       o problema do cliente, nas palavras dele
3. Objetivo           o que muda quando o projeto terminar
4. Escopo             o que vai ser feito
5. Incluso / não      a fronteira do trabalho
6. Investimento       valor, forma de pagamento, prazo
7. Próximo passo      a ação concreta pra aceitar
8. Rodapé             marca de quem assina
```

Essa ordem não é decorativa. Ela existe pra o cliente chegar no preço já convencido do valor.
Inverter isso (preço na frente) transforma a proposta em tabela, e tabela se compara por
número.

---

## Seção a seção

### 1. Capa

Curta. Nome do cliente, título do projeto (o nome que **ele** usaria, não o técnico), data e
validade. Se houver, o nome de quem assina.

O `.briefing-grid` do design system serve bem aqui: 4 campos de uma linha cada (cliente,
projeto, prazo estimado, validade).

Nunca abrir com "Sobre nós".

### 2. Entendimento

A seção que vende. Devolve o problema do cliente com as palavras dele, tiradas da
transcrição. Usar `.quote-block` pra pelo menos uma frase literal da reunião.

Três parágrafos bastam:
1. A situação de hoje (o que acontece, com número se ele deu número)
2. Por que isso custa caro (tempo, dinheiro, oportunidade, risco)
3. O que ele já tentou, se tiver aparecido na conversa

Se o cliente ler essa seção e pensar "é exatamente isso", o resto da proposta é formalidade.

### 3. Objetivo

Uma frase de estado final, mais uma lista curta de critérios de sucesso. Estado final é o
mundo depois do projeto, não a lista de tarefas.

Ruim: "implementar um chatbot de atendimento".
Bom: "toda pergunta repetida de cliente responde sozinha, e o time só entra no que é exceção".

### 4. Escopo

A seção mais variável. Formato depende do tipo de venda (ver abaixo). Regras que valem sempre:

- Cada item de escopo é uma **entrega verificável**, não uma atividade. "3 fluxos de
  automação no ar" é entrega; "desenvolvimento" não é.
- Escopo implícito (o que ele não pediu mas precisa) entra marcado como **opcional**, com
  valor separado. Nunca embutir escondido no preço.
- Se o projeto tem fases, deixar claro que o cliente pode parar entre uma e outra, se for
  verdade. Isso derruba risco percebido.

### 5. Incluso / não incluso

Duas colunas (`.includes-grid`). **Obrigatória.**

A coluna do que não está incluso é a mais valiosa das duas. É ela que evita a conversa
desagradável no mês dois. Ser específico: "não inclui custo de API da OpenAI", "não inclui
produção de conteúdo", "não inclui suporte fora do horário comercial".

Se a lista do "não incluso" tem menos de 3 itens, ela está mal feita.

### 6. Investimento

- Um valor só, ou cenários (`.scenario-section` com `.diff-tag` marcando o incremento)
- Forma de pagamento em lista (`.payment-item`)
- Prazo, e **a partir de quando conta** (assinatura? primeira reunião? pagamento da entrada?)
- Reajuste e condições, se for recorrência

Preço em `--ok`, nunca no accent da marca.

Três cenários é o máximo. Mais que isso vira paralisia de escolha.

### 7. Próximo passo

Uma ação concreta e uma só. "Responder este e-mail confirmando o cenário 2" é ação.
"Estamos à disposição" não é.

Se houver data de kickoff possível, colocar. Data cria urgência sem pressão.

### 8. Rodapé

Marca, uma linha do que a empresa faz, contato. Sem frase de efeito.

---

## Variações por tipo de venda

### Projeto fechado (software, site, automação)

Estrutura base, com o escopo em **fases numeradas** (`.entrega`). Cada fase com: o que
entrega, o que o cliente precisa fornecer, e quanto tempo leva.

Acrescentar cronograma (`.timeline`) se o projeto passar de 4 semanas.

### Consultoria ou mentoria

Trocar "escopo" por **formato**: quantos encontros, de quanto tempo, com quem, com que
frequência, e o que fica de material entre um e outro.

O que mais gera dúvida aqui é o intervalo. Deixar explícito o que acontece entre as sessões
(canal de dúvida? revisão de material? nada?).

Acrescentar "o que esperar em 30/60/90 dias" quando for acompanhamento longo.

### Recorrência (retainer, tráfego, suporte, conteúdo)

Seções extras que a base não cobre:

- **O que entra por mês** (volume: quantas peças, quantas horas, quantos relatórios)
- **O que acontece se sobrar ou faltar** volume no mês
- **Prazo mínimo de contrato** e como se cancela
- **Reajuste** (quando e por qual índice)
- **Verba de mídia separada do fee**, quando for tráfego. Deixar claríssimo que uma coisa não
  é a outra.

O investimento vira mensal, com o valor do primeiro mês destacado se houver setup.

### Workshop ou treinamento

- **Formato**: presencial ou online, quantas horas, quantos dias, quantas pessoas
- **Conteúdo programático** (`.feature-list` por módulo)
- **O que o participante leva** (material, gravação, certificado, acesso posterior)
- **O que o contratante precisa fornecer** (sala, projetor, internet, máquinas)
- **Deslocamento e hospedagem**: incluso ou não, com todas as letras

Preço costuma variar por número de participantes. Se variar, usar cenários.

### Escopo por fases com decisão no meio

Quando o projeto tem descoberta antes do desenvolvimento, e o valor da fase 2 depende do que
a fase 1 achar:

- Fase 1 com valor fechado
- Fase 2 com **faixa** estimada e a frase explícita de que o valor final sai no fim da fase 1
- Deixar claro que o cliente pode parar na fase 1 e levar o material embora

Isso é honesto e vende mais do que fingir precisão que não existe.

---

## O que não entra numa proposta

- Currículo da empresa antes do problema do cliente
- Explicação de tecnologia que o cliente não perguntou
- Cláusula jurídica longa (isso é contrato, e vem depois)
- Desconto oferecido antes do cliente reclamar do preço
- Prazo apertado pra parecer eficiente (atrasar depois custa mais caro que ter dito a verdade)
- Prova social inventada
