# Onboarding · método enxuto (2026-10-19)

Modelo novo do onboarding no ClickUp (lista Onboardings em Andamento, `901325858469`). Primeiro uso: Dra. Mariana Fontana (tarefa-mãe `17trfwhnu88`).
Fonte dos prazos: manual do cliente (lince.company/?s=welcome) e os onboardings de Walter, Gabriel e Urocenter.

## O que tinha de errado no modelo antigo
Lido em 2026-10-19 nos onboardings do Walter (25 subtarefas), Urocenter (25), Gabriel (24) e Otorrinos (33).

- **Subtarefa demais pra pouca decisão.** Cerca de 25 por cliente, muitas de 5 minutos (criar grupo, criar Drive, enviar link) que já estavam feitas quando o quadro nascia.
- **Nome de estado, não de entrega.** "Acessos recebidos", "Opus gerado" não dizem o que é estar pronto nem quem destrava.
- **Datas soltas.** Várias sem prazo (reunião de onboarding, handoff, grupo). Na Urocenter os roteiros têm data de 20/07 e a estratégia aprovada de 21/08: a ordem das datas não segue a ordem das fases.
- **Numeração quebrada.** F3.5 e F4.5 não existem no manual. O manual tem 5 fases: boas-vindas, setup, estratégia, ativação, Go Live.
- **Produção contada duas vezes.** "Edição de vídeos", "Produção de design", "Aprovação + agendamento" repetem o que o Calendário Editorial já acompanha peça por peça. No Gabriel essas ficaram travadas e sem prazo meses.
- **Modelo copiado com gente que saiu.** Caio e Evandro seguiam nos nomes. Tarefas de comercial (Ivan) entravam mesmo quando o escopo não tinha.
- **HANDOFF Segundo Cérebro** sem prazo e sem dono real, pendente pra sempre.
- **Campo FASE ONBOARDING** existia e nunca foi usado.

## O modelo novo
- **Uma subtarefa por entregável**, cada uma com um dono, um prazo e um "pronto quando" na descrição. Os passos pequenos viram itens de checklist dentro dela.
- **Fases do manual, sem meia fase:** F1 boas-vindas e ativos, F2 setup técnico, F3 estratégia (Opus), F4 ativação, F5 Go Live. Campo FASE ONBOARDING preenchido.
- **Peça de conteúdo não entra no onboarding.** Ela vai pro Calendário Editorial. O onboarding só marca o Go Live.
- **Só o que está no escopo.** Sem comercial no contrato, sem tarefa de comercial.
- **Um responsável por tarefa** (o espaço não aceita dois). O segundo envolvido aparece no checklist.
- **Datas na ordem das dependências**: insumos, setup, Opus, reunião de aprovação, calendário e roteiros, gravação, perfil, LP, Go Live. Reunião e gravação caem no dia livre da cliente.
- **O que já foi feito na Planning entra como item marcado** na F1, pra não duplicar tarefa.

## Onboarding completo e módulos (2026-10-19)
O modelo completo mora em `modelo.json` e cada cliente recebe só os módulos do contrato. Quem cadastra é a skill `/onboarding`.

- **D0 = dia da reunião de onboarding**, conferido no registro da reunião (Gemini ou agenda). Todo prazo conta em dias úteis a partir dele, sem fim de semana e feriado nacional.
- **O contrato decide os módulos.** Base sempre; conteúdo, tráfego, Google, LP e comercial só quando contratados. Pedido do Francisco ("esse não tem tráfego") tira o módulo.

| Tarefa | Módulo | Dono padrão | Dias úteis após o D0 |
| --- | --- | --- | --- |
| F1 · Insumos da cliente | base | Henri | 5 |
| F2 · Setup técnico de tráfego | trafego (+google) | Jenifer | 7 |
| F2 · Setup comercial e diagnóstico | comercial | Ivan | 7 |
| F3 · Opus pronto | base | Marina (Victoria gera) | 9 |
| F3 · Reunião de aprovação do Opus | base | Francisco | 10, no dia livre do cliente |
| F4 · Calendário + roteiros | conteudo | Marina | 13 |
| F4 · Gravação dirigida | conteudo | Marina | 14, no dia livre do cliente |
| F4 · Perfil ativado | conteudo | Marina | 16 |
| F4 · Scripts e treinamento de atendimento | comercial | Ivan | 16 |
| F4 · Landing page no ar | lp | Francisco | 19 |
| F5 · Campanhas no ar | trafego | Jenifer | 24 |
| F5 · Comercial ativo + social selling | comercial | Ivan | 24 |
| F5 · Go Live + rotina mensal | base | Francisco | 24 |

Os prazos reproduzem o manual (semana 1 ativos, semana 2 setup, semana 3 estratégia, depois ativação e Go Live) e batem com o onboarding da Mariana Fontana (D0 14/10, Go Live 18/11).

## Como criar o próximo
Chamar `/onboarding` com o nome do cliente. A skill acha o D0, lê o contrato e a reunião, escreve `specs/<cliente>.json`, simula com `--seco` e cria.
