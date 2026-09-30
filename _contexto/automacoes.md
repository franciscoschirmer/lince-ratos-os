<!-- quem alimenta: o /atualizar, quando uma automação é ligada, desligada ou mudada. Inventário do que roda sozinho: rotina que não está aqui não deveria estar rodando. -->
# Automações

| rotina | o que faz | onde roda | quando | origem que assina | como saber se quebrou |
|---|---|---|---|---|---|
| Captura de reuniões → ClickUp (`/captura-reunioes`) | lê as Anotações do Gemini do dia, cria subtarefas no container semanal da Planning (tag captura-ia), conclui o que foi dito como feito e marca os responsáveis | nuvem Anthropic, rotina `trig_01CAbBiJSpNHeqNZVYvZB8am` (claude.ai/code/routines), conectores Drive, Agenda e ClickUp | seg-sex 18h (Brasília) | conta Lince & Co. no claude.ai | falta o comentário "🤖 Captura DD/MM" marcando o Francisco no container da semana, ou erro no histórico da rotina |
| Resumo de reunião no WhatsApp (n8n, do Cláudio) | manda resumo das reuniões pro WhatsApp e marca o doc do Gemini com "Resumo enviado ao WhatsApp" | n8n do Cláudio | depois de cada reunião | Cláudio | detalhes a confirmar com o Cláudio |

Ligada em 2026-09-30 (captura de reuniões). A do n8n já existia; registrada em 2026-09-30.
