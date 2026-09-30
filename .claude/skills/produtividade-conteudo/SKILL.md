---
name: produtividade-conteudo
description: Mede a produção de conteúdo da Pâmela (design), do Mateus (edição) e do Victor (editor externo) a partir do ClickUp. Modo "foto" registra no Supabase cada mudança de status das peças (entrega pra revisão, aprovação da Marina, alteração interna, envio ao cliente, alteração do cliente, aprovação do cliente); modo "semana" fecha a semana e comenta o resumo no ClickUp marcando o Francisco; modo "retroativo" carrega semanas passadas. Roda sozinha (rotinas na nuvem) e à mão. Use quando o usuário chamar /produtividade-conteudo, pedir "produtividade da equipe", "quanto cada um produziu", "taxa de alteração", "aprovação de primeira", "custo por peça", "fecha a semana da produção".
---

# /produtividade-conteudo · quem produziu quanto, com quanto retrabalho

Modos:
- `/produtividade-conteudo foto` · registra os eventos novos (padrão da rotina diária)
- `/produtividade-conteudo semana` · resumo da semana (seg a qui) comentado no ClickUp
- `/produtividade-conteudo retroativo <N>` · carrega as últimas N semanas (aproximado: o ClickUp só guarda a última entrada em cada status)

O dashboard ao vivo (https://claude.ai/artifact/REKkC48cBCum7vLvXgDZv6, página privada do Francisco; fonte em operacao/produtividade/painel-producao.html) lê o que este registro grava. **Valor pago aos profissionais nunca passa por aqui**: fica só
no dashboard privado do Francisco (dado financeiro, confidencial).

## Referências fixas

| o quê | valor |
|---|---|
| Supabase | projeto `axilzquaqtppqjkbqqca` ("Lince"), schema `produtividade`, tabelas `pecas` e `eventos`. **Nunca tocar no schema public** (é do portal do Cláudio) |
| Listas de conteúdo | Calendário Editorial `901325858184` · Lince & Co. (Cliente 00) `901325858587` · Peças de Design `901325858360` |
| Campo cliente | 👔 Clientes `35443fa6-1e27-466f-9a6b-a2d132237079` (dropdown; vem como orderindex, traduzir pela lista de opções) |
| Container onde comentar o fechamento | tarefa `🔄 Review/Retro Semanal (Sexta-feira)` `86ahaqq7k` |

Pessoas no ClickUp: Pâmela `284651027` · Mateus `118126212` · Marina `81994084` · Francisco `158419961` ·
Giovanna `284462463` · Admin Lince & Co `266535331`. O Victor **não tem usuário** no ClickUp.

## Status → evento

O `clickup_get_bulk_tasks_time_in_status` devolve, por status, o `since` = momento da **entrada mais recente**
naquele status. Cada `since` novo é uma passagem. A foto diária guarda cada `since` como um evento; a chave única
`(task_id, evento, ocorrido_em)` faz a gravação ser idempotente (rodar duas vezes não duplica).

| status no ClickUp | evento |
|---|---|
| revisão de social media | `entrega_revisao` |
| disponível para aprovação | `aprovado_sm` |
| alteração interna | `alteracao_interna` |
| enviado para aprovação | `enviado_cliente` |
| alteração do cliente | `alteracao_cliente` |
| agendamento de postagem | `aprovado_cliente` |
| alteração necessária (antigo, em desuso) | `alteracao_cliente` se a peça tem `enviado para aprovação` com `since` anterior ao da alteração; senão `alteracao_interna` |

Limite conhecido: duas passagens pelo mesmo status no mesmo dia (entre duas fotos) contam como uma.

## Tipo da peça (pelo nome, sem acento e minúsculo)
`reels` (reels, video, vídeo) · `corte` · `roteiro` · `carrossel` · `card` · `capa` · `estatico` (estático, post) ·
`caixinha` · senão `outro`. Design = carrossel, card, capa, estatico, caixinha. Vídeo = reels, corte, roteiro.

## Quem produziu (ordem de decisão; guardar em `atribuicao` qual regra valeu)
1. Pâmela nos watchers ou responsável, e peça de design → `Pamela` (`watcher`)
2. Mateus nos watchers ou autor de comentário, e peça de vídeo → `Mateus` (`watcher` / `comentario`)
3. Peça de vídeo com comentário do Francisco contendo "repassado" (ou "VH"), sem Mateus → `Victor` (`repassado`)
4. Peça de vídeo em `revisão de social media`+ sem Mateus e sem Pâmela, só Francisco/Marina/Admin nos watchers → `Victor` (`sem-mateus`)
5. Giovanna nos watchers → `outro` (não é medida aqui)
6. Resto → `outro`

Watcher pode entrar por @menção sem ter feito a peça: por isso a regra de tipo vem junto. Dúvida vira `outro`,
nunca chute.

## Modo foto

1. Buscar peças atualizadas nos últimos 3 dias nas três listas: `clickup_filter_tasks` com `list_ids`,
   `include_closed: true`, `subtasks: true`, `order_by: updated`, paginando até `date_updated` sair da janela.
   Ignorar tarefas-mãe "[Cliente] Calendário Editorial" (são contêineres).
2. `clickup_get_bulk_tasks_time_in_status` de 100 em 100.
3. Para peça que ainda não está em `produtividade.pecas` (ou está com produtor `outro`): `clickup_get_task` com
   `include: ["watchers","custom_fields"]` e, se for vídeo, `clickup_get_task_comments`, e aplicar a atribuição.
4. Gravar com `execute_sql` (um lote por chamada):
   ```sql
   insert into produtividade.pecas (task_id,nome,lista,cliente,tipo,produtor,atribuicao,status_atual,url,atualizado_em)
   values (...) on conflict (task_id) do update set nome=excluded.nome, status_atual=excluded.status_atual,
     cliente=coalesce(excluded.cliente, produtividade.pecas.cliente),
     produtor=case when produtividade.pecas.produtor in ('Pamela','Mateus','Victor') then produtividade.pecas.produtor else excluded.produtor end,
     atribuicao=case when produtividade.pecas.produtor in ('Pamela','Mateus','Victor') then produtividade.pecas.atribuicao else excluded.atribuicao end,
     atualizado_em=now();
   insert into produtividade.eventos (task_id,evento,ocorrido_em,produtor,origem)
   values (...) on conflict do nothing;
   ```
   `ocorrido_em` = `to_timestamp(since/1000.0)`. Escapar aspas simples nos nomes.
5. Não comenta nada no ClickUp. Só registra.

## Modo semana (quinta 18h)

Janela: segunda 00h até quinta 18h da semana corrente (America/Sao_Paulo). Rodar um `foto` antes. Métricas por
produtor (Pamela, Mateus, Victor), a partir de `produtividade.eventos`:
- **entregas**: peças distintas com `entrega_revisao` na janela; **por dia útil** = entregas / dias úteis da janela
- **alterações internas**: eventos `alteracao_interna` na janela
- **aprovação de primeira (Marina)**: das peças entregues, % que tiveram `aprovado_sm` sem nenhum `alteracao_interna` entre a primeira entrega e a aprovação
- **aprovação de primeira (cliente)**: das peças com `enviado_cliente`, % com `aprovado_cliente` sem `alteracao_cliente` no meio
- **por cliente**: entregas e alterações internas por cliente

Comentar em `86ahaqq7k` com `clickup_create_comment`:
```
[@Francisco Schirmer](#user_mention#158419961) 📊 Produção da semana DD/MM a DD/MM
Pâmela · N entregas (X/dia) · aprovação de primeira Marina Y% · cliente Z% · N alterações internas
Mateus · ...
Victor · ...
Destaque: <cliente com mais retrabalho> · <peça que voltou mais vezes>
Dashboard: https://claude.ai/artifact/REKkC48cBCum7vLvXgDZv6
```
Sem valores em reais no comentário (custo por peça só no dashboard).

## Modo retroativo
Igual ao foto, sem limite de 3 dias: percorre as três listas por data de atualização até N semanas atrás, com
`origem = 'retroativo'`. Avisar no relatório que o passado é aproximado (só a última passagem de cada status).

## Regras
- Só leitura no ClickUp, exceto o comentário do modo semana.
- Supabase: só `insert`/`update` no schema `produtividade`. Nunca `delete`, `drop` ou qualquer coisa no `public`.
- Nunca gravar valor pago, senha, token ou CPF.
