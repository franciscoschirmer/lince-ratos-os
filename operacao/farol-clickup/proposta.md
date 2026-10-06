# Farol de Clientes dentro do ClickUp · proposta (2026-10-05)

Status: proposta entregue ao Francisco em 2026-10-05, aguardando as decisões do fim deste arquivo. Nada foi criado no ClickUp ainda.

## Fonte
- Planilha atual: "Farol de Clientes" (Drive, dono admin@linceco.com.br, id `1xiFECAyP1UtVayeiG2s44bcq5ayc24dDPYhgiLfBRb4`). Por cliente: status da contratação, tier, designer, escopo, gestor, editor, conteúdo em contrato, relatório em contrato, e por mês (março a setembro) leads, agendamentos e conteúdos; mais programações, revisão de acessos e NPS.
- "FAROL NOVO 2026" (id `1cxUsTykJXA0EgFq4o7nbeeZniyjk0wN-3EPtNDEx0rc`) parou em março/2026.
- Workspace no plano Business (dashboards ilimitados; 5.000 ações de automação por mês).

## O que a pesquisa mostrou
- Dashboard não lê Rollup nem Relationship (pedido aberto desde 2023): https://feedback.clickup.com/feature-requests/p/make-relationshiprollup-fields-reportable-in-dashboards
- Rollup não funciona com subtarefa (os conteúdos são subtarefas dos calendários), não filtra por status e não entra em fórmula: https://itvisionists.com/clickup-rollups-explained/
- Importar CSV só cria tarefa, não atualiza.
- Padrão de agência: cadastro com uma tarefa por cliente e saúde atualizada à mão no check-in: https://www.zenpilot.com/blog/client-tracker/
- Contar entregas: script ou Make pela API gravando num campo Number (`POST /task/{id}/field/{field_id}`).

## Desenho
1. **Carteira de Clientes** (escopo fixo, uma tarefa por cliente; sugestão: usar a lista vazia Health Score `901325858486`): status da contratação, tier, escopo (labels), designer, editor, gestor de tráfego, conteúdos contratados por mês, relatório de performance, acessos revisados, NPS.
2. **Farol Mensal** (lista nova em Client Success; uma tarefa por cliente por mês, ex. "[Cristiano Cruz] Outubro/2026"): 👔 Clientes (mesmo campo do Calendário), Mês, Contratado, Postados, Agendados e Em aprovação (script), % entregue e Débito (fórmula), Leads, Conversas iniciadas, Agendamentos (Jenifer), Situação do dado (Sem tráfego, Sem acesso, Onboarding, Sem dados), Farol (verde, amarelo, vermelho, à mão no check-in).
3. **Automação** (script no molde do Worker das filas): dia 1º cria as tarefas do mês dos clientes ativos; todo dia atualiza Postados, Agendados e Em aprovação a partir do Calendário Editorial (status + Data de Postagem). Histórico de março a setembro por importação de CSV, uma vez.

Dashboard "Farol": filtro geral por mês, gestor, tier e status; cards de total contratado, total postado, % da carteira e clientes no vermelho; barras contratado x postado por cliente; tabela do mês; linhas de leads e agendamentos por mês; pizza por farol e tier; lista dos próximos 7 dias.

## Decisões pendentes
1. Carteira na lista Health Score e Farol Mensal como lista nova em Client Success?
2. Quem preenche leads, conversas e agendamentos, e até quando (sugestão: Jenifer até o dia 5)
3. Colunas pontuais da planilha (Dia dos Pais, Apresentação do relatório de julho/agosto, Programações) ficam de fora?
4. Testar num cliente só (Cristiano) antes, pra confirmar que o gráfico agrupa por 👔 Clientes (não confirmado na pesquisa)
5. Publicar como página pra mostrar à Vic?
