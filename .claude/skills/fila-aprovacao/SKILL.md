---
name: fila-aprovacao
description: Duas filas de conteúdo no chat do ClickUp, numa mensagem única em lista agrupada por cliente. Modo aprovação (padrão) lista o que está pronto pra enviar aos clientes (status "disponível para aprovação"), sem as CAPAS (capa só vai junto com o vídeo), no canal "Fila de Aprovação", atribuída ao Francisco. Modo revisão lista o que a Marina precisa revisar (status "revisão de social media"), capas incluídas, no canal "Fila de Revisão", atribuída à Marina. Roda sozinha às 10h e às 16h30 (rotinas na nuvem) e à mão. Use quando o usuário chamar /fila-aprovacao, pedir "o que tem pra enviar pros clientes", "fila de aprovação", "o que tá disponível pra aprovação", "manda a fila", "fila de revisão", "o que a Marina tem pra revisar". Com o argumento "rascunho", só mostra a lista no chat, sem postar.
---

# /fila-aprovacao · o que está pronto pra andar

Modos:
- `/fila-aprovacao` · fila de aprovação: monta e posta no canal Fila de Aprovação
- `/fila-aprovacao revisao` · fila de revisão da Marina: monta e posta no canal Fila de Revisão
- acrescentar `rascunho` a qualquer um · monta e mostra aqui, sem postar

Só leitura no ClickUp. A única escrita é a mensagem no chat. Nunca comentar em tarefa, nunca mudar status.

## O que muda entre os modos

| | aprovação (padrão) | revisão |
|---|---|---|
| Status lido | `disponível para aprovação` | `revisão de social media` |
| Capas | **fora** (capa só vai ao cliente junto com o vídeo) | **entram** (a Marina revisa a capa também) |
| Canal | "Fila de Aprovação" `2ky5cpep-5553` | "Fila de Revisão" `2ky5cpep-5533` |
| Membros do canal | Francisco, Júlia, Victoria, Admin | Francisco, Marina, Victoria, Admin |
| Assignee da mensagem | Francisco `158419961` | Marina `81994084` |
| Título | `📤 **Fila de aprovação · DD/MM HHh** · N peças pra enviar` | `🔎 **Fila de revisão · DD/MM HHh** · N peças pra revisar` |
| Fila vazia | `... · nada pra enviar agora.` | `... · nada pra revisar agora.` |

Os dois canais são privados. Se um sumir, procurar por nome em `clickup_get_chat_channels`. Membro novo
só entra pela tela do ClickUp (a API só define membros na criação do canal; mudar a visibilidade derruba
todo mundo menos o criador).

## Referências fixas

| o quê | valor |
|---|---|
| Listas de conteúdo | Calendário Editorial `901325858184` · Lince & Co. (Cliente 00) `901325858587` · Peças de Design `901325858360` |
| Campo cliente | 👔 Clientes `35443fa6-1e27-466f-9a6b-a2d132237079` (dropdown; o valor vem como orderindex, traduzir pelas opções do próprio campo) |
| Campo data | Data de Postagem `d4806a40-74c1-45fb-9c36-972aca497d00` (sem valor: usar o `due_date` da tarefa) |

O conector posta como Admin Lince & Co, por isso a mensagem notifica quem está no assignee. O token do `.env`
(`CLICKUP_API_TOKEN`) é do próprio Francisco: o que ele posta não notifica o Francisco. Use o token só
como plano B, pra rodar à mão quando o conector bater o limite diário. Nesse caso, `GET /api/v2/list/{id}/task`
já traz os custom_fields e dispensa uma leitura por peça.

## Passo a passo

1. `clickup_filter_tasks` com as três listas, `statuses: [<status do modo>]`, `subtasks: true`, paginando até `has_more` ser false.
2. Ignorar as tarefas-mãe "[Cliente] Calendário Editorial" (são contêineres). **Só no modo aprovação:** descartar toda tarefa cujo nome, sem acento e em minúsculo, contém `capa` (pega "CAPA - ...", "[CAPA DE REELS] ...").
3. Para cada peça restante, `clickup_get_task` com `include: ["custom_fields"]`:
   - cliente = nome da opção do 👔 Clientes cujo `orderindex` é o valor. Sem valor: tirar do nome da tarefa-mãe (o que está entre colchetes) ou de um `[Nome]` no início do nome da peça. Sem nada disso: "Sem cliente".
   - data = Data de Postagem, ou `due_date`. Converter de ms para data em America/Sao_Paulo.
4. Montar a mensagem (formato abaixo). Ordem: primeiro o bloco de urgentes, depois os clientes em ordem alfabética e, dentro de cada cliente, as peças por data (sem data por último).
   - **Urgente** = data de postagem já passou ou cai em até 2 dias. A peça aparece só no bloco de urgentes, não se repete no cliente.
5. Postar com `clickup_send_chat_message` no canal do modo, `content_format: "text/md"`, `assignee` do modo. Uma mensagem só, nunca uma por peça.
6. Canal não encontrado: postar no canal "Calendário Editorial" `6-901325858184-8` com a primeira linha "⚠️ Canal <nome> não encontrado". Nunca deixar de avisar.

## Formato da mensagem

```
<título do modo>

**⚠️ Postagem vencida ou em até 2 dias**
- Cliente · [Nome da peça](url) · posta DD/MM

**Cliente A** (N)
- [Nome da peça](url) · posta DD/MM
- [Nome da peça](url) · sem data

**Cliente B** (N)
- ...
```

- Nome da peça como está no ClickUp, sem cortar. Link sempre no nome.
- "posta DD/MM" quando a data vem da Data de Postagem; "prazo DD/MM" quando vem do `due_date`; "sem data" quando não há nenhuma.
- Fila vazia: só o título com "nada pra enviar/revisar agora." (posta mesmo assim, é o sinal de que a rotina rodou)
- Sem texto extra: sem saudação, sem resumo no fim.
