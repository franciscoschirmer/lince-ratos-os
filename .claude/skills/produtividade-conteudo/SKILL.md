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
| Supabase | projeto `mastlaemlelhtnefmdud` ("Chico", conta pessoal do Francisco, São Paulo), schema `produtividade`, tabelas `pecas`, `eventos` e `config`. No `public` só existe a função de leitura do painel; não criar mais nada lá |
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
| alteração cliente (nome real no ClickUp; "alteração do cliente" também vale) | `alteracao_cliente` |
| agendamento de postagem | `aprovado_cliente` |
| alteração necessária (antigo, em desuso) | `alteracao_cliente` se a peça tem `enviado para aprovação` com `since` anterior ao da alteração; senão `alteracao_interna` |

Limite conhecido: duas passagens pelo mesmo status no mesmo dia (entre duas fotos) contam como uma.

## Tipo da peça (pelo nome, sem acento e minúsculo)
`reels` (reels, rells, video, vídeo, extração, pergunta extra, sessão) · `corte` · `roteiro` · `carrossel` · `card` ·
`capa` · `estatico` (estático, post) · `caixinha` · `design` (logotipo, guia, comunicado, folder, cartão, qualquer peça
da lista Peças de Design sem outro tipo) · senão `outro`.
Design = carrossel, card, capa, estatico, design. Vídeo = reels, corte, roteiro. Caixinha = qualquer um.

## Quem produziu (ordem de decisão; guardar em `atribuicao` qual regra valeu)
Olhar só Pâmela `284651027` e Mateus `118126212` nos watchers/responsáveis; qualquer outro watcher (Victoria, Henri,
Admin, id `-1`, desconhecidos) é ignorado.
0. **Comentário do Francisco com "repassado", "VH" ou "Victor"** (e sem citar Mateus ou Pâmela) em peça que não é design → `Victor` (`repassado`). Vale acima de quem acompanha a tarefa (decisão do Francisco, 2026-10-08).
1. Só a Pâmela presente (sem Mateus) e a peça não é vídeo → `Pamela` (`watcher`)
2. Só o Mateus presente, ou Mateus autor de comentário, e a peça não é design → `Mateus` (`watcher` / `comentario`)
3. Os dois presentes: decide o tipo (design → Pamela, vídeo → Mateus, caixinha/outro → `outro`) (`tipo`)
5. Nenhum dos dois, peça de vídeo que **não é roteiro**, cujo nome **não** tem "enviado/enviada", "bruto" ou
   "avaliar" (vídeo bruto mandado pelo cliente), e chegou em `revisão de social media` → `Victor` (`sem-mateus`).
   Com esses termos e sem "repassado" → `outro` (`video-cliente`). Decisão do Francisco, 2026-09-30.
6. Giovanna presente e nenhum dos dois → `outro` (`giovanna`)
7. Resto → `outro` (`sem-regra`)

Roteiro sem "repassado" não vira Victor: pode ser só texto. Dúvida vira `outro`, nunca chute.

## Modo foto

Tudo do ClickUp vem pelo coletor `pc.mjs` (API direta com o token `CLICKUP_API_TOKEN`), **nunca pelo conector**: o
conector tem limite de 1.000 chamadas/dia para o workspace inteiro e já chega esgotado às 23h (decisão 2026-10-08).
O coletor aplica as regras de tipo, atribuição e status → evento desta skill; não reimplementar à mão.

1. `node .claude/skills/produtividade-conteudo/pc.mjs check`. Se falhar (token ausente, sem rede), parar e avisar.
2. `node .claude/skills/produtividade-conteudo/pc.mjs coletar <data de 3 dias atrás, AAAA-MM-DD> > /tmp/coleta.json`
   (segunda-feira: 4 dias, para cobrir o fim de semana).
3. `node .claude/skills/produtividade-conteudo/pc.mjs sql < /tmp/coleta.json > /tmp/lote.sql`.
4. Rodar cada bloco do `lote.sql` (separados pela linha `-- LOTE`) num `execute_sql` do Supabase. O upsert reaplica
   a atribuição atual (a regra decide, não o valor antigo); eventos repetidos são ignorados pela chave única.
5. Não comenta nada no ClickUp. Só registra. Resposta final: peças lidas, eventos novos por produtor, status sem mapa
   (o `status_vistos` do JSON) se aparecer algum de alteração/aprovação que não está na tabela acima.

## Modo semana (quinta 18h)

Janela: segunda 00h até quinta 18h da semana corrente (America/Sao_Paulo). Rodar um `foto` antes. Métricas por
produtor (Pamela, Mateus, Victor), a partir de `produtividade.eventos`:
- **entregas**: peças distintas com `entrega_revisao` na janela; **por dia útil** = entregas / dias úteis da janela
- **alterações internas**: eventos `alteracao_interna` na janela
- **aprovação de primeira (Marina)**: das peças entregues, % que tiveram `aprovado_sm` sem nenhum `alteracao_interna` entre a primeira entrega e a aprovação
- **aprovação de primeira (cliente)**: das peças com `enviado_cliente`, % com `aprovado_cliente` sem `alteracao_cliente` no meio
- **por cliente**: entregas e alterações internas por cliente

Comentar em `86ahaqq7k` pela API direta, com o texto no stdin: `node .claude/skills/captura-reunioes/cu.mjs comment 86ahaqq7k < texto.md` (a menção `[@Nome](#user_mention#ID)` vira menção de verdade). O conector só se a API falhar:
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
