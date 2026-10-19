---
name: onboarding
description: Monta e cadastra no ClickUp o onboarding de um cliente novo da Lince no modelo enxuto, uma subtarefa por entregável com dono, prazo e checklist. Analisa o contrato pra saber o que entra (conteúdo, tráfego, Google Ads, LP, comercial), tira do onboarding completo os módulos que o cliente não contratou e conta todos os prazos em dias úteis a partir do D0, o dia da reunião de onboarding. Use quando o Francisco chamar /onboarding, disser "faz o onboarding do cliente X", "cadastra o onboarding", "monta o onboarding da Dra. Y", "cliente novo entrou", ou avisar que um cliente "não tem tráfego", "não tem comercial", "só conteúdo", pra montar sem esses módulos.
---

# /onboarding · do contrato ao quadro no ClickUp

O onboarding completo da Lince mora num modelo único, dividido em módulos. Cada cliente recebe o modelo
**menos o que não contratou**, com os prazos contados do D0. Quem decide o que entra é o **contrato**.

| o quê | onde |
|---|---|
| modelo completo (tarefas, donos, prazos, checklists) | `operacao/onboarding/modelo.json` |
| por que o modelo é assim | `operacao/onboarding/metodo.md` |
| ficha de cada cliente (spec) | `operacao/onboarding/specs/<cliente>.json` (exemplo: `mariana-fontana.json`) |
| gerador | `operacao/onboarding/criar-onboarding.mjs` (fala com o ClickUp pelo `operacao/clickup/cu.mjs`) |
| lista no ClickUp | Operações & Projetos › Onboarding › Onboardings em Andamento (`901325858469`) |
| manual do cliente (prazos que o cliente conhece) | lince.company/?s=welcome |

## Módulos

| módulo | entra quando o contrato tem | tarefas |
|---|---|---|
| `base` | sempre | F1 insumos (Henri) · F3 Opus (Marina) · F3 reunião de aprovação (Francisco) · F5 Go Live e rotina mensal (Francisco) |
| `conteudo` | conteúdos mensais | F4 calendário + roteiros · F4 gravação dirigida · F4 perfil ativado (Marina) |
| `trafego` | tráfego pago | F2 setup técnico · F5 campanhas no ar (Jenifer) |
| `google` | Google Ads além do Meta | só acrescenta itens no setup e nas campanhas |
| `lp` | landing page | F4 LP no ar (Francisco) |
| `comercial` | setup e processo comercial | F2 setup comercial · F4 scripts e treinamento · F5 comercial ativo + social selling (Ivan) |

Item de checklist que depende de outro módulo some sozinho (sem LP, some "link na bio pra LP"; sem
comercial, some "contato da secretária").

## Passo 1 · achar o D0

D0 é **o dia da reunião de onboarding com o cliente**, e é dele que todo prazo conta. Buscar o registro
da reunião, não confiar na memória:

1. Drive (operacional@): Anotações do Gemini com "Onboarding" e o nome do cliente no título. A data e a
   hora estão no próprio título.
2. Se não houver gravação: Google Agenda, o evento de onboarding com o cliente.
3. Reunião ainda não aconteceu: usar a data marcada na agenda e avisar que os prazos mudam se ela mudar.

Se o Francisco disser uma data ("foi quinta passada") e o registro mostrar outra, vale o registro: dizer
qual é, em uma linha, e seguir com ela.

## Passo 2 · analisar o contrato (obrigatório)

Sem escopo confirmado, não se cria nada. Procurar o contrato ou a proposta assinada:

1. a pasta do cliente em `clientes/<cliente>/` (se existir);
2. Drive: o nome do cliente com "contrato", "proposta" ou "CONTRATANTE" no texto;
3. ClickUp: tarefa de contrato do cliente (costuma ser da Júlia, na Planning);
4. não achou: pedir ao Francisco o PDF ou o escopo por escrito. Escopo dito por ele no chat vale e fica
   registrado no spec como fonte ("informado pelo Francisco em AAAA-MM-DD").

Tirar do contrato: produto (Boutique, Inside, Editorial), conteúdos por mês, LP (quantas), tráfego
(Meta, Google, verba se houver), comercial (setup, scripts, social selling, SDR), e qualquer entregável
fora do modelo (site, identidade visual, LinkedIn, GMN, evento). Entregável fora do modelo entra como
item extra no checklist da tarefa mais próxima (`ajustes.<chave>.checklist`) ou como nota; se for grande,
avisar o Francisco antes de inventar tarefa nova.

Se o Francisco disser "esse não tem tráfego" (ou comercial, ou LP), o módulo sai. Se isso contradiz o
contrato, avisar a divergência em uma linha e seguir com o que ele disse.

## Passo 3 · ler a reunião de onboarding e o que já foi feito

- Da transcrição da reunião (Passo 1): especificidades que mudam a operação (data de inauguração, dia
  livre do cliente pra reunião e gravação, resistência a formato, pedido de cobrança, marca existente,
  se tem site), em frases curtas.
- ClickUp: `node operacao/clickup/cu.mjs search <sobrenome> --fechadas`. O que a Planning já fez
  (contrato, grupo, formulários enviados, cobrança) entra em `feitos` e nasce marcado no checklist da F1,
  em vez de virar tarefa repetida.

## Passo 4 · escrever o spec e simular

Copiar `specs/mariana-fontana.json` pra `specs/<cliente>.json` (sem acento, minúsculas, hífen) e preencher:

- `cliente`, `produto`, `d0` (AAAA-MM-DD), `d0Fonte`, `contrato` (a fonte do escopo)
- `modulos`: só os contratados, além de `base` (que sempre entra)
- `conteudos`: por mês, se tem `conteudo`
- `diaLivre`: `seg` a `sex` quando o cliente só pode num dia; reunião e gravação vão pra ele
- `especificidades`: as frases do Passo 3
- `feitos`: começo do nome do item do checklist que já está feito (com `nota` opcional, ex. a data)
- `ajustes.<chave>`: `dias` (outro prazo em dias úteis), `data` (data fixa), `dono` (id), `nota`,
  `checklist` (itens extras), `fora: true` (tira a tarefa). Chaves: `insumos`, `setup-trafego`,
  `setup-comercial`, `opus`, `reuniao`, `calendario`, `gravacao`, `perfil`, `processo-comercial`, `lp`,
  `campanhas`, `comercial-ativo`, `golive`

Simular:

```bash
node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json --seco
```

Mostrar ao Francisco a tabela que sai (data, tarefa, dono), o D0 usado, o que ficou fora do contrato e
qualquer data que pede atenção (prazo já vencido porque o D0 ficou pra trás, feriado no meio, dia livre
que empurrou a reunião).

## Passo 5 · criar

Se o pedido foi claro ("faz o onboarding") e o escopo está confirmado, criar direto depois de mostrar a
simulação. Se o escopo ficou em dúvida, perguntar antes.

```bash
node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json
```

Parou no meio: pôr `"maeId": "<id da mãe>"` no spec e rodar de novo; ele pula o que já existe pelo nome.
Depois de criar, gravar no spec `"criadoEm": "AAAA-MM-DD (tarefa-mãe <id>)"`, que trava uma segunda
criação por engano.

## Passo 6 · fechar

- Conferir no ClickUp (`cu.mjs get <mãe>`): número de subtarefas, donos, datas.
- Campo **👔 Clientes**: a API não cria opção nova. Se o cliente não está na lista, pedir ao Francisco
  pra criar a opção à mão (e preencher na mãe depois).
- Se o cliente tem pasta em `clientes/`, anotar no `andamento.md` dela o link da tarefa-mãe. Sem pasta,
  sugerir o `/novo-projeto`.
- Responder com: link da mãe, tabela de prazos, o que ficou fora, e o que depende do Francisco.

## Regras

- O ClickUp desse espaço aceita **um responsável por tarefa**. O segundo envolvido vai no checklist.
- Peça de conteúdo nunca entra no onboarding: ela vive no Calendário Editorial.
- Nunca dividir nem atribuir edição pro Victor (quem divide a edição é o Francisco).
- Mudou o padrão da casa (tarefa nova pra todo cliente, prazo novo, dono novo)? Muda o `modelo.json`,
  não o spec, e registra o porquê no `metodo.md`.
- Compliance do conselho (CFM, OAB, CFO) aparece nos checklists de Opus, roteiro, script e LP.
