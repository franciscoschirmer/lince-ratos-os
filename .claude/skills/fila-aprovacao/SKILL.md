---
name: fila-aprovacao
description: Lista tudo que está pronto pra enviar aos clientes (status "disponível para aprovação" nas listas de conteúdo do ClickUp), sem as CAPAS (capa só vai junto com o vídeo), e manda uma mensagem única, em lista agrupada por cliente, no canal de chat "Fila de Aprovação" do ClickUp, atribuída ao Francisco. Roda sozinha às 10h e às 16h30 (rotinas na nuvem) e à mão. Use quando o usuário chamar /fila-aprovacao, pedir "o que tem pra enviar pros clientes", "fila de aprovação", "o que tá disponível pra aprovação", "manda a fila". Com o argumento "rascunho", só mostra a lista no chat, sem postar.
---

# /fila-aprovacao · o que está pronto pra ir pro cliente

Modos:
- `/fila-aprovacao` · monta a lista e posta no canal (padrão das rotinas)
- `/fila-aprovacao rascunho` · monta a lista e mostra aqui, sem postar

Só leitura no ClickUp. A única escrita é a mensagem no chat. Nunca comentar em tarefa, nunca mudar status.

## Referências fixas

| o quê | valor |
|---|---|
| Listas de conteúdo | Calendário Editorial `901325858184` · Lince & Co. (Cliente 00) `901325858587` · Peças de Design `901325858360` |
| Status lido | `disponível para aprovação` |
| Campo cliente | 👔 Clientes `35443fa6-1e27-466f-9a6b-a2d132237079` (dropdown; o valor vem como orderindex, traduzir pelas opções do próprio campo) |
| Campo data | Data de Postagem `d4806a40-74c1-45fb-9c36-972aca497d00` (sem valor: usar o `due_date` da tarefa) |
| Canal de destino | chat "Fila de Aprovação" (achar o id por nome em `clickup_get_chat_channels`) |
| Quem recebe | Francisco `158419961` (assignee da mensagem) |

O conector posta como Admin Lince & Co, por isso a mensagem notifica o Francisco.

## Passo a passo

1. `clickup_filter_tasks` com as três listas, `statuses: ["disponível para aprovação"]`, `subtasks: true`, paginando até `has_more` ser false.
2. **Tirar as capas:** descartar toda tarefa cujo nome, sem acento e em minúsculo, contém `capa` (pega "CAPA - ...", "[CAPA DE REELS] ..."). Capa só vai junto com o vídeo. Ignorar também as tarefas-mãe "[Cliente] Calendário Editorial" (são contêineres).
3. Para cada peça restante, `clickup_get_task` com `include: ["custom_fields"]`:
   - cliente = nome da opção do 👔 Clientes cujo `orderindex` é o valor. Sem valor: tirar do nome da tarefa-mãe (o que está entre colchetes) ou de um `[Nome]` no início do nome da peça. Sem nada disso: "Sem cliente".
   - data = Data de Postagem, ou `due_date`. Converter de ms para data em America/Sao_Paulo.
4. Montar a mensagem (formato abaixo). Ordem: primeiro o bloco de urgentes, depois os clientes em ordem alfabética e, dentro de cada cliente, as peças por data (sem data por último).
   - **Urgente** = data de postagem já passou ou cai em até 2 dias. A peça aparece só no bloco de urgentes, não se repete no cliente.
5. Postar com `clickup_send_chat_message` no canal "Fila de Aprovação", `content_format: "text/md"`, `assignee: "158419961"`. Uma mensagem só, nunca uma por peça.
6. Canal não encontrado: postar no canal "Calendário Editorial" `6-901325858184-8` com a primeira linha "⚠️ Canal Fila de Aprovação não encontrado". Nunca deixar de avisar.

## Formato da mensagem

```
📤 **Fila de aprovação · DD/MM HHh** · N peças pra enviar

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
- Fila vazia: `📤 **Fila de aprovação · DD/MM HHh** · nada pra enviar agora.` (posta mesmo assim, é o sinal de que a rotina rodou)
- Sem texto extra: sem saudação, sem resumo no fim.
