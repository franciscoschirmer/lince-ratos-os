# Pâmela · vazão real e redistribuição da fila de design

Feita em 2026-10-14 (quarta, tarde), depois da redistribuição de prazos que o Francisco fez no ClickUp.
Fontes: ClickUp pela API (204 peças abertas com a Pâmela como responsável nas listas Calendário Editorial, Cliente 00 e Peças de Design; campos Prazo e Data de Postagem) e o registro de produtividade no Supabase (entregas pra revisão da Marina, alterações e aprovações desde 31/08). Nada foi alterado no ClickUp.

## 1. Veredito

- **A Pâmela produz dentro do normal e com regularidade.** 22 a 26 peças novas por semana nas últimas cinco semanas, sem semana ruim. O problema não é ritmo; é fila.
- **A fila é o dobro do que ela entrega.** 204 peças abertas, 97 em "design / edição". Ela fecha 4 a 5 por dia útil. Qualquer coisa que entra na frente empurra o resto, e todo dia parece atraso.
- **A redistribuição de hoje acertou a ordem (quem tem data foi pra frente) mas errou o volume.** Semana de 19/10 tem 29 peças e a de 26/10 tem 35, contra uma capacidade de 20 a 22. As semanas de 09/11 e 16/11 ficaram pela metade. E 29 peças **sem data de postagem** receberam prazo em outubro, na frente de peças com data em novembro.
- **Regra que falta:** peça sem data de postagem não tem prazo e não entra em "design / edição". A fila só recebe o que a programação já marcou.

## 2. Vazão real (Supabase, entregas pra revisão da Marina)

| semana | peças novas | carrosséis | capas | cards e outros | reentregas | alt. interna | alt. cliente |
|---|---|---|---|---|---|---|---|
| 07/09 | 22 | 11 | 10 | 1 | 0 | 6 | 1 |
| 14/09 | 24 | 9 | 9 | 6 | 0 | 11 | 0 |
| 21/09 | 22 | 9 | 8 | 5 | 0 | 5 | 2 |
| 28/09 | 26 | 16 | 4 | 6 | 2 | 14 | 9 |
| 05/10 | 22 | 15 | 3 | 4 | 7 | 7 | 13 |
| 12/10 (só ter 13) | 3 | 2 | 0 | 1 | 1 | 3 | 0 |

Por dia útil: entre 2 e 9 entregas, mediana 6 (contando reentregas); em peças novas, 4 a 5 por dia.

Peça não é tudo igual. Pesando o esforço (carrossel 1, card 0,5, capa 0,3, alteração 0,5) a semana dela vale **15 a 23 pontos, média 18**. É esse o número de planejamento:

| | por dia | por semana |
|---|---|---|
| piso (o que se promete pro cliente) | 3 | 15 |
| meta (o que ela mira) | 3,5 a 4 | 18 |
| teto (semana boa, sem alteração) | 4,5 | 22 |

Reserva pra alteração: a semana de 05/10 teve 13 alterações do cliente e 7 internas (Piltcher na frente). Isso come 3 a 5 pontos por semana. Planejar 15 pontos novos e deixar o resto pra retrabalho.

Ciclo de aprovação (70 peças aprovadas pelo cliente desde setembro): a Marina aprova em poucas horas; o cliente aprova em 1 dia na mediana e em **5 dias em 80% dos casos**. Prazo de produção seguro = **data de postagem menos 5 dias úteis**. Nunca menos de 3.

## 3. A redistribuição de hoje, pesada

| semana do prazo | peças | pontos | sem data de postagem | contra a meta de 18 |
|---|---|---|---|---|
| 12/10 (4 dias úteis) | 29 | 19,1 | 9 | no limite (capacidade da semana ~14) |
| 19/10 | 29 | 25,4 | 9 | **estoura 40%** |
| 26/10 | 35 | 33,0 | 20 | **estoura 80%** |
| 02/11 | 20 | 18,6 | 10 | ok |
| 09/11 | 14 | 12,0 | 10 | sobra |
| 16/11 | 13 | 12,0 | 13 | sobra |
| dezembro | 4 | 3,3 | 2 | vazio |
| sem prazo | 60 | | 60 | Aragão 24 capas, Luis Henrique 16, Gabriel 6 capas, Simone 6, Cristiano 3 |

Por dia, na quinzena: 14/10 tem 12 peças (6,6 pontos) e 16/10 tem 10 (7,8). Um dia dela cabe 4.

Tirando só as peças sem data de postagem das semanas de 19/10 e 26/10, elas caem pra 20 peças (18,8 pontos) e 15 peças (15,0 pontos). **Cabem.** É a única mudança grande que precisa.

## 4. Conflitos de prazo com a data de postagem

| peça | prazo | posta | problema | sugestão |
|---|---|---|---|---|
| Piltcher · Primeiros socorros (86ak7n04a) | 14/10 | 13/10 | já passou, em alteração interna | reprogramar a postagem antes de produzir |
| Fazenda · Looks para convidadas (86akkn35d) | 09/11 | 22/10 | prazo 12 dias úteis depois de postar | prazo 15/10 |
| Simone · É o fim da SOP? (86ajutdja) | 26/10 | 22/10 | prazo depois de postar | prazo 15/10 ou postagem pra 05/11 |
| Simone · Antes de adoecer (86ajurpzx) | 26/10 | 28/10 | 2 dias de folga | prazo 21/10 |
| Walter · Barriguinha de chope (86akjr0a9) | 06/11 | 10/11 | 2 dias de folga | prazo 03/11 |
| Piltcher · Card Dezembro Laranja (86akjfnnf) | 21/12 | 08/12 | prazo depois de postar | prazo 01/12 |
| Piltcher · Card Tecnologia + cuidado (86akqrtkx) | sem prazo | 07/11 | ficou fora da fila | prazo 30/10 |
| Otorrinos · Fixado 2 (86aj5v8y6) | sem prazo | 24/07 | data morta, alteração interna desde julho | decidir: refaz ou arquiva |
| Dia do Médico (7 peças, 18/10 domingo) | 14 e 15/10 | 18/10 | aprovação precisa sair sexta | manter 14/10 pra todas, num molde só |
| Simone · Propagandas (86ajutcx3) | 16/10 | 20/10 | 2 dias de folga | ok se a Simone aprovar rápido; ela costuma travar |

## 5. O que entrou na frente sem data de postagem (prazo até 23/10)

18 peças. Nenhuma tem cliente esperando, e cada uma empurra uma que tem.

- **Capas (9):** Maysa 3, Gabi 1, Aragão 1, Luis Henrique 3 (cortes), BTS LinkedIn 1. Capa segue o vídeo: só entra quando o vídeo tiver data de postagem, com o mesmo prazo dele.
- **Fazenda do Rosa (7):** 20 anos de história, vestido, véu Julieta, paleta de cores, anéis de noivado, placa café da manhã, card timeline. A Fazenda tem calendário até 31/10 e 43 peças de estoque: estas são de novembro. Dar data na programação, aí o prazo.
- **Gabi · card Somos reflexo (1)** e **Lince · card Quem não comunica (1):** mesma regra.

## 6. Regras pra sair do redistribuir diário

1. **Sem data de postagem, sem prazo.** A peça fica em "disponível para edição" até a programação semanal marcar a data. Exceção: capa herda a data do vídeo.
2. **Prazo = postagem menos 5 dias úteis** (3 no mínimo, só quando a programação já veio em cima). Isso cobre 80% dos ciclos de aprovação.
3. **Teto de 18 pontos por semana e 4 por dia** (carrossel 1, card 0,5, capa 0,3, alteração 0,5). 15 pontos é o compromisso; o que passar de 15 é folga pra alteração, não promessa.
4. **"Design / edição" só pro que está na semana.** Hoje são 97. Deveriam ser no máximo 20 a 25. O resto volta pra "disponível para edição" com prazo. Assim o status volta a dizer o que ela está fazendo de verdade.
5. **Ordem dentro do dia:** alterações primeiro (pequenas e destravam aprovação), depois por data de postagem, depois capas.
6. **Quem decide o que entra é a programação de segunda,** não a fila. A Pâmela puxa de cima pra baixo e não escolhe.

## 7. Movimentos propostos (pra aplicar com o seu OK)

**A. Hoje e amanhã (14 e 15/10).** Ficam: 7 peças do Dia do Médico num molde único, Anestesista (16/10), Vacinação (17/10), Ultrassom Atria (19/10), Primeiros socorros depois de reprogramar. São ~6 pontos em dois dias; apertado mas fecha. Saem pra sexta ou pra semana que vem: capas Maysa (3), capa Gabi, capa Aragão, card Lince, capa LH.

**B. Semana de 19/10.** Tirar o prazo das 9 sem data (2 capas LH, 6 da Fazenda, card Gabi). Sobram 20 peças, 18,8 pontos. Corrigir Looks para convidadas e SOP (item 4).

**C. Semana de 26/10.** Tirar o prazo das 20 sem data: Karinna 6 (cards e carrosséis do consultório), Cristiano 6, Walter 2, Simone 2, Fazenda 2, Luis Henrique 2. Sobram 15 peças, 15 pontos. Se a programação da semana que vem der data a algumas delas pra novembro, voltam com prazo calculado.

**D. Novembro.** As 29 peças que saíram de B e C mais as 60 sem prazo (89 no total) são o estoque. Elas só ganham prazo quando ganharem data na programação. As semanas de 09/11 e 16/11 têm 6 pontos livres cada; a de 23/11 está vazia. Dá pra absorver umas 25 a 30 em novembro, não as 89. O resto é dezembro ou é excesso de pauta (Aragão com 24 capas pra vídeos que não existem ainda, Luis Henrique com 16 carrosséis).

**E. Status.** Devolver pra "disponível para edição" tudo que está em "design / edição" com prazo depois de 23/10 (uns 70). Hoje o status não distingue "na mão dela" de "na fila".

## 8. O que não dá pra medir ainda

- Tempo real por peça: não tem apontamento de horas. Os pesos (1 / 0,5 / 0,3) são estimativa pela contagem. Conferir com a Pâmela em duas semanas contra o fechamento do Supabase e ajustar.
- Se as capas com prazo em outubro têm vídeo pronto: precisa olhar o vídeo de cada uma.
- A segunda 12/10 foi feriado; a semana atual tem 4 dias úteis e já está com 19 pontos de prazo.
