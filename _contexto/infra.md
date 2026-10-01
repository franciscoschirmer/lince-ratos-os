<!-- quem alimenta: o /setup semeia na entrevista; o /atualizar acrescenta quando algo passa a estar hospedado. Lido quando a sessão precisa saber onde algo está (mapa). -->
# Infra

> Onde as coisas estão hospedadas: site, domínio, servidor, banco, DNS, email, área de membros.
> É diferente de `ferramentas.md` (o que você usa) e aponta pra onde cada coisa **mora**.
> Sem chave, sem senha. Aqui vai o nome do serviço, o endereço e quem tem acesso.

| o quê | onde mora (serviço) | endereço | quem acessa e como | observações |
|---|---|---|---|---|
| servidor | servidor próprio | a confirmar | Cláudio | detalhes pendentes com o Cláudio |
| domínio linceco.com.br | Hostinger (DNS) | linceco.com.br | a confirmar | em 2026-09-29 mostrava página de domínio estacionado |
| site Boutique | provável Lovable | boutique.lince.company | a confirmar | página do produto Boutique Lince |
| apresentação comercial | provável Lovable | comercial.lince.company | a confirmar | deck comercial em página |
| manual do cliente | a confirmar | lince.company/?s=welcome | a confirmar | enviado no onboarding |
| email | Google Workspace | brio-lab.com | equipe | ainda no domínio antigo |
| sistema RatosOS | GitHub (repositório privado) | github.com/franciscoschirmer/lince-ratos-os | Francisco | sincronizado desde 2026-09-30 |
| banco de produtividade | Supabase, projeto "Lince" (axilzquaqtppqjkbqqca), schema `produtividade` | – | Francisco e rotinas via conector | o schema `public` (tabela employees) é do Cláudio; não mexer (2026-09-30) |
| Painel de Produção (privado) | artefato privado no claude.ai | claude.ai/artifact/REKkC48cBCum7vLvXgDZv6 | só o Francisco | fonte em operacao/produtividade/painel-producao.html; custos no armazenamento do próprio artefato (2026-09-30) |
| Painel de Produção (time) | Cloudflare Pages, conta pessoal do Francisco, ligado ao GitHub (pasta operacao/produtividade/site) | producao-lince.pages.dev | lideranças, usuário `lince` + senha | segredos no projeto Cloudflare: SUPABASE_URL, SUPABASE_KEY, PAINEL_TOKEN, CUSTOS_JSON, PAINEL_USUARIO, PAINEL_SENHA, PAINEL_SEGREDO. Trocar segredo exige nova publicação (push). Lê o banco por `public.produtividade_dados_painel` com a chave do painel (2026-09-30) |
