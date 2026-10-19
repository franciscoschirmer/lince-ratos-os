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

| Fase | Subtarefa | Dono padrão | Prazo a partir do D1 |
| --- | --- | --- | --- |
| F1 | Insumos da cliente recebidos | Henri | semana 1 |
| F2 | Setup técnico de tráfego | Jenifer | semana 2 |
| F3 | Opus pronto pra apresentar | Marina (Victoria gera) | semana 3, véspera da reunião |
| F3 | Reunião de apresentação + aprovação | Francisco | semana 3 |
| F4 | Calendário + roteiros do 1º ciclo | Marina | até 4 dias úteis depois da aprovação |
| F4 | Gravação dirigida | Marina | dia seguinte aos roteiros |
| F4 | Perfil ativado | Marina (Pâmela nos templates) | semana 4 |
| F4 | Landing page no ar (se no escopo) | Francisco | antes da campanha |
| F5 | Go Live | Francisco (Jenifer na campanha) | semana 5 a 6 |

Cliente com comercial no escopo ganha uma subtarefa F5 de comercial (Ivan). Cliente sem tráfego perde a F2 e os itens de campanha.

## Como criar o próximo
1. Copiar `specs/mariana-fontana.json` pra `specs/<cliente>.json` e trocar nome, datas, donos, escopo e especificidades.
2. Conferir: `node operacao/onboarding/criar-onboarding.mjs operacao/onboarding/specs/<cliente>.json --seco`
3. Criar: o mesmo comando sem `--seco`. Se parar no meio, pôr `"id"` da mãe em `mae` e rodar de novo: o script pula o que já existe.
