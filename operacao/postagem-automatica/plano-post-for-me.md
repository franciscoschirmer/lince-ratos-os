# Postagem automática com o Post for Me · rascunho de implantação

Rascunho de 2026-10-08. Complementa o `plano.md` desta pasta (o fluxo ClickUp → Worker que já está no ar).
Pesquisa de mercado que levou a esta escolha: `pesquisa-ferramentas.html` (publicada pra Vic).

## Em uma frase

Não é no-code e não é uma chave colada no Claude Code. É uma **conta no painel do Post for Me** (onde
as redes dos clientes ficam conectadas) e uma **chave de API guardada no robô** (o Worker `filas-lince`,
que roda sozinho na Cloudflare). O ClickUp continua mandando, o robô faz a ponte, o Post for Me publica.
O Claude Code é quem constrói e ajusta o robô; ele não precisa estar aberto pra postagem sair.

```
WhatsApp (cliente aprova) ─► ClickUp (status "agendamento de postagem")
                                   │ webhook
                                   ▼
                        Worker filas-lince (nosso robô)
                         · confere data, legenda, arte, cliente
                         · pega a arte na pasta do Drive
                         · manda pro Post for Me já agendado
                                   │ API (chave secreta)
                                   ▼
                        Post for Me ─► Instagram · Facebook · TikTok · YouTube · LinkedIn
                                   │ webhook com o resultado de cada rede
                                   ▼
                        Worker comenta o link na tarefa e muda pra "postado/subido"
```

## O que precisa ter

| item | já tem? | observação |
|---|---|---|
| ClickUp com o Calendário Editorial e os status | sim | nada muda no jeito da equipe trabalhar |
| Worker `filas-lince` na Cloudflare | sim | grátis; só ganha um módulo novo |
| Conta no Post for Me (app.postforme.dev) | **não** | cartão da empresa, US$ 10/mês. Projeto do tipo **Quickstart** (usa os apps já aprovados deles) |
| Chave de API do Post for Me | **não** | gerada no painel deles, guardada como segredo do Worker |
| Acesso de leitura ao Drive (operacional@) | **não** | continua necessário: a arte sai da pasta do LINK DAS PEÇAS. É a pendência do Google que já existe |
| Cada rede de cada cliente conectada no Post for Me | **não** | ver "Conectar as contas" abaixo |
| Zapier, Make, n8n ou outra ferramenta | não precisa | o Worker já faz esse papel, de graça |

## Quem faz o quê

| etapa | quem | tempo |
|---|---|---|
| Aprovar o teste e o teto de gasto | Vic | — |
| Mandar o e-mail ao suporte (contagem, preço acima de 1.000, TikTok e YouTube públicos) | Francisco | 5 min |
| Criar a conta e o projeto Quickstart, ligar as redes no projeto, gerar a chave | Francisco, com o Claude guiando | 20 min |
| Guardar a chave no Worker (`npx wrangler secret put POSTFORME_API_KEY`, digitada no terminal, **nunca no chat**) | Francisco | 2 min |
| Autorizar o Google (Drive) com operacional@ | Francisco, com o Claude guiando | 20 min |
| Trocar a publicação do Worker pelo Post for Me, página de conexão, testes | Claude | 1 a 2 sessões |
| Conectar as redes dos clientes | Francisco (o que ele alcança) + médico (o resto) | 5 min por cliente |
| Orientar os médicos no link de conexão | Henri (sugestão) | — |

## Conectar as contas dos clientes

Cada rede de cada cliente precisa ser autorizada **uma vez** no Post for Me. Duas formas:

1. **Pelo próprio Francisco, no painel ou na nossa página de conexão.** Instagram e Facebook: o login do
   Facebook do Francisco já é admin das Páginas dos clientes, então a autorização deve trazer várias contas
   de uma vez. TikTok, YouTube e LinkedIn: dá pra fazer quando a equipe tem o login do cliente
   (o formulário de acessos já coleta isso).
2. **Pelo médico, por link.** O Worker ganha uma página "Conectar redes · Dr. Fulano" com um botão por rede.
   O Henri manda o link no grupo, o médico clica, entra na conta dele e autoriza. O Worker recebe o retorno e
   grava qual conta é de qual cliente. (O Post for Me pede que o link de autorização seja gerado na hora do
   clique, por isso é uma página nossa com botão, não um link solto.)

Avisar o médico: na tela de autorização aparece o nome **"Post for Me"**, não "Lince". Se isso incomodar,
dá pra migrar depois pro modo White Label (aparece a nossa marca), mas aí voltam as aprovações das redes.

### Portfólios dos clientes (cada cliente tem o seu, o Francisco é convidado em todos)

Funciona sem mudança de modelo: é o mesmo do nosso app da Meta. O Francisco entra uma vez com o Facebook
pessoal no Post for Me e marca, na janela da Meta, as Páginas e Instagrams dos clientes. Não precisa adicionar
o Post for Me como parceiro em portfólio nenhum. A confirmar no teste: se uma conexão traz todas as contas
marcadas ou se é uma por cliente.

Em cada portfólio só precisa: (1) o usuário do Francisco com permissão de **conteúdo** na Página (não precisa de
controle total) e (2) o Instagram profissional **vinculado à Página** dentro do portfólio, com o Francisco com
acesso a ele. Os 10 clientes sem Página alcançável (pendência de 07/10) precisam disso pros dois caminhos.

Ponto fraco: tudo depende do Facebook pessoal do Francisco. Colocar uma segunda pessoa da Lince (sugestão: Júlia)
com a mesma permissão de conteúdo nos portfólios, pra reconectar se a conta dele cair.

## Segurança

| risco | proteção |
|---|---|
| a chave de API publica em qualquer cliente conectado | só como segredo do Worker; nunca no chat, git ou ClickUp; vazou, gera outra no painel e a antiga morre |
| peça no cliente errado (o vazamento mais provável, e seria erro nosso) | o Worker amarra a tarefa às contas daquele cliente; o comentário de cadastro mostra o @ de destino; trava `POSTAR_APENAS` no teste |
| o Post for Me guarda as autorizações | verificação em duas etapas no Post for Me e na Cloudflare; liberar só as Páginas dos clientes na conexão |

Um cliente não vê nada do outro. O Post for Me recebe arte, legenda e autorização de publicar; não recebe conta de
anúncios nem direct (conferir a lista de permissões na janela da Meta antes de aceitar). Empresa pequena dos EUA:
não vende dados e apaga tudo até 30 dias depois de encerrar a conta, mas não cita LGPD. Risco baixo porque o que
passa ali vai ser público; dado de paciente nunca entra em legenda (CFM). O cliente vê o app conectado em
Integrações no portfólio dele e pode revogar.

## O dia a dia (igual ao de hoje)

1. Peça aprovada pelo cliente no WhatsApp; o retorno vai pro ClickUp.
2. Na tarefa: **Data de Postagem com hora**, **PLATAFORMA** (uma ou várias redes), **LINK DAS PEÇAS**, legenda.
3. Status → **"agendamento de postagem"**.
4. Em segundos o robô confere, envia a arte e a legenda pro Post for Me **já agendadas pra data e hora**, muda
   pra **"postagem cadastrada"** e comenta o resumo. Faltou algo: comenta o que falta e não muda o status.
5. Na hora marcada o **Post for Me publica** (não depende mais do relógio da Cloudflare, que atrasou no teste de 07/10).
6. O resultado de cada rede volta pro robô: comentário com os links e status **"postado/subido"**. Falhou numa
   rede: comentário dizendo qual e por quê, e aviso no canal.
7. Mudou a data ou desistiu: o robô atualiza ou cancela o agendamento no Post for Me (permitido enquanto não saiu).

## O que muda no código (o Claude faz)

- `src/postar.js`: uma função `publicarPostForMe` no lugar de `publicarInstagram` e `publicarTikTok`. Monta
  `POST /v1/social-posts` com `caption`, mídia, `social_accounts` (os ids do cliente) e `scheduled_at`.
  A arte é enviada ao Post for Me no cadastro, pra não depender do Drive na hora de publicar.
- Rota nova `POST /webhook/postforme`: recebe `social.post.result.created` e devolve o resultado pra tarefa.
- Página nova `/conectar/<cliente>`: botões por rede, gera o link na hora (`POST /v1/social-accounts/auth-url`
  com o cliente amarrado), grava o id da conta no KV.
- KV: `conta:<cliente>` passa a guardar os ids do Post for Me por rede.
- Instagram direto pelo nosso app da Meta fica como **reserva**, ligável por cliente.
- **Google Meu Negócio não está no Post for Me**: segue pelo caminho próprio do `plano.md` (depende do Google).
- Opcional: ligar o MCP do Post for Me no Claude Code pra perguntas do tipo "o que está agendado essa semana".
  Não é necessário pra nada rodar.

## Ordem de implantação

1. **Decisão e e-mail** (até 10/10): Vic aprova; Francisco manda o e-mail ao suporte (texto pronto na conversa de 08/10).
2. **Conta e chave** (semana de 13/10): Francisco cria a conta e guarda a chave; autoriza o Google.
3. **Robô** (semana de 13/10): Claude troca a publicação, cria a página de conexão e o webhook.
4. **Teste interno**: Instagram @francisco.schirmer + um TikTok e um YouTube da Lince, com a trava `POSTAR_APENAS`.
5. **Primeiro cliente** (semana de 20/10): Potência Médica, Instagram e Facebook, depois TikTok e YouTube.
6. **Lotes de 5 clientes** por semana, tirando a trava no fim.
7. **31/10**: Vic decide seguir ou migrar pro Metricool, com custo e falhas do mês na mão.

## Decisões em aberto

- PLATAFORMA no ClickUp: incluir as opções FACEBOOK, YOUTUBE, LINKEDIN (e STORIES se for usar)?
- YouTube exige título: usar a primeira linha da legenda ou criar um campo TÍTULO?
- Legenda diferente por rede (TikTok mais curta, LinkedIn mais formal) ou a mesma em todas?
- TikTok: publicar direto ou mandar como rascunho pro app do médico conferir?
- Instagram e Facebook: sempre juntos (cruzar a postagem) ou só quando marcado?

## Riscos

| risco | o que fazer |
|---|---|
| Contagem passa de 1.000 por mês | pior caso US$ 25 a 50; eles avisam e sobem a faixa no ciclo seguinte, sem cortar |
| Post for Me sai do ar ou fecha | Instagram volta pelo nosso app em minutos; o resto migra pra outra API (Bundle.social, Zernio) trocando só a função de publicar |
| Aprovações deles são autodeclaradas | o teste interno confirma antes de qualquer cliente |
| Token de cliente cai (trocou senha, removeu acesso) | o robô comenta na tarefa e manda o link de reconexão |
