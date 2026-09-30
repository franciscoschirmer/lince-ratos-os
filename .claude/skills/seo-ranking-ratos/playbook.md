# Playbook SEO/AEO/GEO — universal (serve pra qualquer site)

Estratégia destilada de dezenas de fontes (vídeos e docs de especialistas de SEO/GEO) + o guia oficial do Google. É o "porquê" por trás de cada tarefa dos `SEO-PLANO.md`. Vale igual pra qualquer site; o que muda é o estado de cada um (isso fica no plano do site, não aqui).

> **Tese-mãe:** não tem hack de "SEO pra IA". É SEO fundamental bem feito + uma camada de **citações/menções** pela web. A IA busca antes de responder e cita os melhores resultados. Foge de promessa milagrosa.

A estratégia se organiza em **4 pilares**.

> ⚠️ **Calibragem importante (Google oficial).** O guia oficial do Google ["AI features and your website"](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) contraria alguns "truques" que circulam por aí. Pro lado **Google** (AI Overviews / AI Mode), a fonte de verdade é o Google. Resumo na seção [O que o Google diz oficialmente](#o-que-o-google-diz-oficialmente) no fim. Regra prática: **truque de formatação rende nas IAs de fora (ChatGPT/Perplexity); o que move a agulha no Google é conteúdo original bom + fundamento técnico + experiência da página.** As duas visões convergem no que mais importa.

---

## Pilar 1 — Fundação técnica (o ingresso, não o diferencial)

1. **Site estático e rápido (Core Web Vitals).** Página tem que carregar em ~1s ou a IA dá timeout ao buscar. Static site generation ajuda a ser bem crawlável.
2. **HTML legível pela máquina.** Conteúdo importante em texto, não preso em JS ou dentro de imagem.
3. **Schema markup** (Organization, Article, FAQPage, BreadcrumbList, Product/Service nas páginas de oferta). Descreve teus dados de forma inequívoca pra máquina.
4. **sitemap.xml, robots.txt liberando bots de IA, llms.txt.** O robots deve liberar GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended. ⚠️ **O Google diz que `llms.txt` NÃO ajuda (nem atrapalha) no Google Search** — não conta com ele pra AI Overviews. Mantém mesmo assim porque ChatGPT/Perplexity leem o arquivo; só não é tática de Google. sitemap e robots seguem essenciais.
5. **Indexar no Bing** (Bing Webmaster Tools + sitemap). O ChatGPT search usa o índice do Bing.
6. **Alt text em imagens, transcrição em vídeo.**

## Pilar 2 — Conteúdo estruturado como resposta (onde mora o maior ganho)

7. **Mirar cauda longa em formato de pergunta** (4+ palavras, intenção informacional). A esmagadora maioria das keywords de AI Overview é informacional; AIO é território de conteúdo que ensina.
8. **Filtrar keyword por dificuldade baixa.** KD baixo precisa de menos backlinks; boa parte das fontes de AIO ranqueia fora do top 10. Site novo consegue furar a fila mirando cauda longa fácil.
9. **Estruturar a página pra responder a pergunta principal E todas as de follow-up.** Cada landing/post cobre o tópico e os subtópicos/perguntas relacionadas (fonte: dados de busca + perguntas de venda/suporte + Reddit). Um dos pontos mais fortes da estratégia.
10. **Headings como perguntas + resposta direta no topo.** H2 = a pergunta; os 2 primeiros parágrafos respondem direto e curto (a IA cita verbatim). ⚠️ **Google relativiza:** não precisa escrever "pra IA" nem quebrar conteúdo em pedacinhos (chunking) — o sistema entende vários tópicos numa página. Usa o formato-resposta porque ajuda o leitor e as IAs de fora, mas sem engessar; clareza > truque.
11. **Blocos que a IA copia fácil:** FAQ (pergunta + resposta curta), bullets, listas numeradas, tabelas pra dados.
12. **Otimizar pra featured snippet e "people also ask"** — combinam fortemente com AI Overviews (snippet = frase exata, AIO = intenção; cobrir os dois).
13. **Information gain + opinião forte ("unpromptable idea").** Conteúdo tem que dizer algo que os outros não dizem, com pesquisa/expertise própria. Texto genérico e "típico" parece reescrita de IA e não é citado. É o teu diferencial natural: caso real, número de projeto, opinião de quem faz.
14. **Blog levanta a maré, páginas de serviço são os barcos.** Blog informacional traz autoridade/tráfego; páginas de produto/serviço (com keyword de intenção/CPC) convertem. Linkar blog → serviço e vice-versa.
15. **IA assiste, humano edita.** Pode gerar com IA, mas nunca publicar 100% gerado — criatividade/curadoria humana por cima.

## Pilar 3 — Autoridade, menções e confiança (a camada que separa SEO de AEO)

16. **Ser mencionado é mais importante que ser o 1º.** Você não ganha aparecendo em 1º na citação, ganha sendo mencionado o máximo de vezes possível. O LLM resume muitas fontes. ⚠️ **A menção tem que ser AUTÊNTICA.** Menção inautêntica (link comprado, PBN, afiliado forjado) o Google trata como spam e bloqueia. Reddit/roundups/PR de verdade seguem valendo. Vale o esforço em ser genuinamente citável, não em forjar citação.
17. **Menção de marca offsite > backlink** nos AI Overviews. O que os OUTROS falam de você pesa mais. "Quem endossa a sua história?"
18. **Reddit** — conta real, identificada, resposta útil em thread que já é citado pelas IAs. Poucos e bons, nada de conta falsa.
19. **YouTube/Vídeo** sobre os termos chatos e específicos que ninguém cobre.
20. **Roundups e "best of"** — pitchar pra entrar em listas tipo "melhores X"; menção mesmo sem backlink já vale.
21. **Diretórios e dados estruturados externos:** Google Business Profile, Bing Places, Wikidata, Crunchbase, LinkedIn. Ajuda a IA a "saber" o que é a marca.
22. **EEAT visível:** experiência em 1ª mão, case studies, estatísticas, credenciais, fontes citadas. Escrever como se fosse impressionar um especialista humano.
23. **Autoridade temática:** cobrir o nicho por todos os ângulos — gera menções naturais e várias páginas do mesmo domínio viram fonte (AIO cita ~5 fontes, podem ser do mesmo site).

## Pilar 4 — Medição (a métrica virou menção, não clique)

24. **Métrica de sucesso = share of voice/menção nas IAs**, não só clique. "Aqui não tem clique, tem menção."
25. **Monitorar presença nas IAs:** rodar prompts de comprador pras IAs e medir se/quando a marca aparece. O `ai-visibility.py` faz isso via DataForSEO (real, repetível, ~US$ 0,03/prompt). Alternativa manual: perguntar pras IAs na mão e anotar.
26. **"Breakdown by question"** — as perguntas reais que o público faz às IAs sobre o teu tema são banco de pauta direto.
27. **Google Search Console — impressões vs cliques** ("gráfico de mandíbula": impressão sobe, clique cai = efeito AIO).
28. **Atribuição imperfeita é normal em AEO** (B2B muitas vezes não tem link clicável). Medir por impacto em receita e perguntar "como você ouviu falar da gente?" no pós-conversão.

---

## Como o Claude Code entra (o fluxo)

- **Claude Code = executor** do SEO técnico e da produção em escala: gera/corrige schema, sitemap, llms.txt, WebP, meta tags; reestrutura páginas no formato resposta; roda loop "cola erro do Lighthouse → corrige → repete". É o que esta skill faz.
- **Descoberta de pauta + medição:** volume de busca (Keyword Planner grátis ou DataForSEO), gap de concorrência, e a medição de presença nas IAs (`ai-visibility.py`).
- **Dá pra começar sem ferramenta paga:** pedir 25-100 keywords long-tail direto pro Claude funciona pra arrancar; o modo manual de medição de IA cobre o baseline sem gastar.

## Divergências a ter em mente

- **Hype vs cético:** tem quem venda "mudou tudo" e quem alerte pra desinformação e ferramenta cara demais por commodity. A fatia do Google não desabou. Usar o ângulo anti-hype — mais honesto e durável.
- **Viés de afiliado:** muito criador de conteúdo empurra ferramenta paga. Pegar a estratégia, ignorar o merchan.
- **Bloquear treino vs indexação:** dá pra bloquear o bot de *treino* no robots.txt e deixar o de *indexação* passar — aparece na resposta sem virar dado de treino.

---

## O que o Google diz oficialmente

Fonte: guia oficial ["AI features and your website"](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (Google Search Central). Vale como **fonte de verdade pro lado Google** (AI Overviews e AI Mode rodam em cima do ranking normal do Search). Onde bater com os vídeos, **prevalece o Google pro Google**.

**A tese deles:** as AI features são enraizadas nos sistemas core de ranking, então "bom SEO continua valendo". Por baixo roda RAG (recuperam páginas relevantes via ranking e geram resposta com link) e query fan-out (a IA gera várias buscas derivadas da tua).

**FAZER (recomendação oficial):**
- **Conteúdo único, original e útil** (perspectiva de 1ª mão, não reciclagem). É o ponto nº1 deles. Casa 100% com o #13.
- **SEO técnico de sempre:** indexável, elegível pra snippet, crawlável, HTML semântico, pouco duplicado, boa experiência de página (rápido, responsivo, conteúdo principal claro).
- **Estrutura clara:** parágrafos e seções com headings claros; imagens/vídeo de qualidade.
- **Dados estruturados quando couber** (Schema.org, Merchant Center pra produto, Business Profile pra negócio local). **Não é obrigatório** pra IA, mas ajuda o SEO geral.
- **Search Console** pra diagnosticar.
- Princípio que rege tudo: "foque no que o visitante acharia útil e satisfatório".

**NÃO precisa (mitos que o Google derruba):**
- ❌ **`llms.txt` / arquivos "pra IA" / markup especial** — não ajudam no Google Search (neutro). _(Ainda servem pras IAs de fora.)_
- ❌ **Chunking** — não precisa quebrar conteúdo em pedacinhos; o Google entende vários tópicos numa página.
- ❌ **Reescrever "pra IA"** — entendem sinônimo/sentido; não precisa cobrir cada variação de long-tail.
- ❌ **Caçar menção inautêntica** — tratam como spam e bloqueiam. Menção autêntica é que vale.
- ❌ **Exagerar em structured data** — útil, mas não é requisito de IA.

**Leitura prática:** o que chamam de "AI SEO" se divide em dois. (1) **Fundamento + conteúdo original**: o Google confirma, é o que importa de verdade nos dois lados. (2) **Truques de formatação** (llms.txt, chunking, H2-pergunta rígido): rendem nas IAs de fora (ChatGPT/Perplexity, que leem esses sinais), são neutros no Google. Não largar os truques (custam pouco e ajudam fora), só não confundir com o que ranqueia no Google.
