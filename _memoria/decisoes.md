<!-- quem alimenta: o /atualizar acrescenta no fim; robô nunca escreve aqui (propõe por recado). Lido quando perguntam "por quê" ou antes de mudar algo já decidido. -->
# Decisões

Uma entrada por decisão, sempre acrescentada no fim, nunca reescrita. É o arquivo mais barato do
sistema e o que mais evita retrabalho: daqui a três meses, quando alguém (inclusive você) perguntar
"por que a gente faz assim?", a resposta está aqui.

O que entra: escolheu um caminho e descartou outro, mudou de ideia, fechou um preço, definiu uma
regra de trabalho. O que não entra: tarefa feita (isso é o diário).

**Formato de cada entrada:**

```
- **AAAA-MM-DD** (quem decidiu: o nome da pessoa, ou a origem se foi um robô) [projeto, se for de projeto]: a decisão em uma frase. Por quê: o motivo em outra. Substitui: AAAA-MM-DD (só quando muda uma decisão anterior; a antiga fica onde está)
```

---

<!-- as decisões entram abaixo, a mais nova por último -->
- **2026-09-29** (Francisco): toda pasta de cliente em clientes/ leva a subpasta conteudos/ pros conteúdos do médico. Por quê: os conteúdos de cada médico da carteira precisam de lugar próprio dentro da pasta dele.
- **2026-09-29** (Francisco): ligar o Meta Ads depois, junto com a Jenifer, e não no setup. Por quê: o token da conta de anúncios passa por ela.
- **2026-09-30** (Francisco): conversas de WhatsApp exportadas ficam em operacao/conversas/, com credenciais e CPFs removidos e fora do git. Por quê: as conversas têm senhas de clientes e dados pessoais, e o sistema vai para o GitHub.
- **2026-09-30** (Francisco): reunião vira subtarefa no container semanal por rotina diária na nuvem (/captura-reunioes), criação direta com a tag captura-ia. Por quê: não depender da revisão semanal manual; a tag permite revisar na Planning.
- **2026-09-30** (Francisco): reunião organizada pela Victoria que não abre para a conta conectada é privada e a rotina pula em silêncio. Por quê: acesso bloqueado é intencional.
- **2026-09-30** (Francisco): o robô conclui tarefa quando a reunião diz que foi feita, com comentário Quem/Onde/Quando/Fala/Status; na dúvida, só comenta. Por quê: a equipe ter as conclusões automáticas e rastreáveis.
- **2026-09-30** (Francisco): todo comentário do robô no ClickUp marca os responsáveis com @. Por quê: cair na caixa de entrada deles e cobrar de novo.
- **2026-09-30** (Francisco): o controle da rotina é pelo ClickUp (comentário marcando o Francisco), sem aviso no WhatsApp. Por quê: centralizar no ClickUp.
- **2026-09-30** (Francisco): medir semanalmente a produção da Pâmela, do Mateus e do Victor (entregas, retrabalho, aprovação de primeira pela Marina e pelo cliente, custo por peça). Por quê: são os principais que precisam produzir para se pagar.
- **2026-09-30** (Francisco): "alteração necessária" será separada em "alteração interna" (Marina pediu) e "alteração do cliente". Por quê: a taxa de erro do profissional não pode misturar mudança de gosto do cliente.
- **2026-09-30** (Francisco): o retrabalho é contado exato a partir de 2026-09-30 por foto diária no Supabase (schema produtividade); antes disso fica aproximado. Por quê: o ClickUp não guarda cada ida e volta.
- **2026-09-30** (Francisco): sem campo "Produtor" no ClickUp; o produtor é deduzido pelos watchers (Pâmela/Mateus) e pelo comentário "Repassado VH" (Victor, que não tem ClickUp e não é o usuário "victor logan"). Por quê: evitar mais um campo manual.
- **2026-09-30** (Francisco): o valor pago a cada profissional fica só no Painel de Produção (privado), nunca no GitHub, no Supabase, no chat ou no ClickUp. Por quê: dado financeiro confidencial.
- **2026-09-30** (Francisco): o painel de produção também fica num site para as lideranças (producao-lince.pages.dev, Cloudflare na conta pessoal dele) com login simples de usuário e senha, todos vendo tudo, inclusive valores pagos. Por quê: Zero Trust ficou complicado; aceita o risco de senha compartilhada. Substitui: 2026-09-30 (valor pago só no painel privado)
- **2026-09-30** (Francisco): vídeo bruto enviado pelo cliente ("enviado", "bruto", "avaliar" no nome) não conta como produção do Victor; comentário "Repassado" sempre conta como Victor, inclusive caixinha. Por quê: o Victor só edita o que é repassado a ele.
- **2026-09-30** (Francisco): a fila do que enviar aos clientes vai por mensagem em lista num canal próprio do chat do ClickUp ("Fila de Aprovação"), às 10h e 16h30, nunca como comentário em tarefa; capas ficam fora. Por quê: capa só vai ao cliente junto com o vídeo, e lista no chat é mais fácil de despachar que comentário espalhado.
- **2026-10-01** (Francisco): o banco da produtividade sai do projeto Supabase do Cláudio e vai para um projeto próprio ("Chico", conta pessoal do Francisco). Por quê: o Francisco não tinha acesso ao projeto do portal e não quer depender dele nem mexer na área pública do Cláudio.
- **2026-10-01** (Francisco): a Marina recebe a fila do que está em "revisão de social media" no canal privado Fila de Revisão, nos mesmos horários (10h e 16h30), com as capas incluídas; a Fila de Aprovação fica privada com Francisco, Júlia, Victoria e Admin. Por quê: a revisão interna não pode esperar cobrança, e capa também passa pela Marina antes de ir ao cliente.
- **2026-10-01** (Francisco) [fila-aprovacao]: nada pode ficar fora das filas: a busca é no workspace inteiro e toda falha de leitura aparece na própria mensagem. Quando o conector do ClickUp travar, o token pessoal do `.env` é o backup (só neste computador; o `.env` nunca vai pro git). Por quê: fila incompleta sem aviso é pior que fila nenhuma.
- **2026-10-01** (Francisco) [acessos]: acessos do cliente novo chegam por um formulário único e aberto (o nome é o primeiro campo, sem link por cliente), num site da Cloudflare com painel de login único compartilhado pela equipe, exportar CSV e apagar à mão. Google Ads pede o ID da conta pra vínculo pela conta de gestão, e a senha só se for outra conta Google. Por quê: acabar com acesso espalhado e senha no WhatsApp; link por cliente era trabalho demais pra pouco ganho.
- **2026-10-02** (Francisco) [captura-reunioes]: só vira tarefa o que precisa de acompanhamento pra acontecer (decidido pra agora, não coberto por outra automação, maior que repasse interno, com entregável); na dúvida, não cria. Substitui: 2026-09-30 (na dúvida, criar com "validar na Planning"). Por quê: tarefa que ninguém abre vira cemitério e atrapalha a operação.
- **2026-10-02** (Francisco) [captura-reunioes]: ideias, hipóteses e combinados que não viram tarefa vão pra uma tarefa única (💡 Ideias e combinados das reuniões, `86akru8d2`), só por linha na descrição, sem notificar ninguém. Por quê: não perder nada sem poluir o ClickUp.
- **2026-10-02** (Francisco): as rotinas falam com o ClickUp pela API direta com o token pessoal dele (variável do ambiente de nuvem), o conector vira plano B e toda execução avisa no celular, inclusive falha. Substitui: 2026-09-30 (controle da rotina só pelo comentário no ClickUp). Por quê: o limite do conector travava a captura e as filas, demanda de reunião não pode deixar de entrar, e comentário feito com o token dele não o notifica.
- **2026-10-02** (Francisco) [fila-aprovacao]: as filas rodam num Worker da Cloudflare (não no note, não em rotina do Claude), pela API direta com o token do Francisco guardado como segredo do Worker. Por quê: roda sem o computador ligado, sem modelo interpretando e fora do limite de 1.000 chamadas do conector, que travou as filas dois dias seguidos.
- **2026-10-02** (Francisco) [fila-aprovacao]: a regra das capas fica como está: toda peça com "capa" no nome sai da fila de aprovação, de qualquer lista. Por quê: prefere perder de vez em quando uma capa de design (ex.: capa de boleto) do que lotar a fila com capas de reels.
- **2026-10-05** (Francisco) [programação semanal]: a programação vai de terça a segunda, com 3 conteúdos por cliente (exceções combinadas na semana, como Atria, Walter e Urocenter em 06/10). Buraco se completa com o lote em finalização (revisão de social media, disponível ou enviado para aprovação, agendamento, alteração interna ou do cliente). Formatos variam: nunca estáticos em sequência e, se o cliente tem vídeo, vídeo entra na semana (roteiro, caixinha, reels, takes). Por quê: semana com o mesmo formato seguido fica repetitiva no perfil.
- **2026-10-05** (Francisco) [Hospital Piltcher]: datas comemorativas saem no dia, sempre; a programação mistura Cartão, Hospital e trends, idealmente 2 do Cartão e 2 do Hospital por semana, e 3 por semana quando o estoque não dá. Vídeos do Dr. Rodrigo pausados (pedido do Eduardo na reunião de 02/10). Por quê: alinhar com o que o cliente pediu e não deixar data comemorativa passar.
