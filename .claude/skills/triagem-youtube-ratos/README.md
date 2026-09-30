# Triagem YouTube Ratos

> Skill de Claude Code feita pela [**Ratos de IA**](https://ratosdeia.com.br), parte do curso [**Claude Code OS**](https://ratosdeia.com.br/claudeos/).

Analisa uma lista de temas/notícias e decide **quais valem virar vídeo** antes de investir tempo em roteiro, gravação e edição.

Usa dados reais de YouTube SERP e volume de busca Google Ads (via DataForSEO) pra calcular um score de potencial, sugerir títulos otimizados pra CTR, separar keywords pra SEO e organizar tudo num ranking em tiers.

Funciona pra **qualquer nicho, idioma e país** — na primeira execução faz um setup conversacional que adapta a skill ao teu canal.

## Sobre

Essa é uma versão **genérica e open source** de uma skill que a gente usa internamente no [canal Ratos de IA](https://youtube.com/@ratosdeia) toda semana pra decidir o que vira vídeo no [**Ratos de IA**](https://ratosdeia.com.br) — nosso quadro semanal de notícias de IA pra empreendedores.

Decidimos liberar porque faz parte da filosofia do [**Claude Code OS**](https://ratosdeia.com.br/claudeos/): skills reais, resolvendo problemas reais, que tu pode estudar e adaptar pro teu próprio processo. Se tu quiser aprender a construir skills assim — do setup conversacional ao uso de APIs pagas — o curso explica tudo.

## O que ela entrega

Pra cada tema analisado:

- **Score 0-100** combinando volume de busca, potencial no YouTube, frescor da notícia e relevância pro teu público
- **Vídeos outliers** que já bombaram sobre o tema (referência editorial)
- **3 títulos otimizados pra CTR** inspirados nos que já performam
- **Keywords pra SEO** (principal + secundárias com volume de busca)
- **Ranking em tiers**: Tier 1 (gravar com certeza) → Tier 3 (pular ou virar short)
- **Recomendação editorial** no final

## Instalação

```bash
# 1. Clonar o repo
git clone `triagem-youtube-ratos`

# 2. Copiar a skill para a pasta do Claude Code
cp -r triagem-youtube-ratos ~/.claude/skills/triagem-youtube-ratos

# 3. Pronto. Abre o Claude Code e pede uma triagem.
```

Na primeira execução, a skill faz um **setup conversacional** perguntando:

1. Qual é o nicho do teu canal
2. Quem é teu público
3. Idioma e país foco
4. Onde salvar os relatórios
5. Orçamento máximo por triagem
6. Credenciais do DataForSEO

**Se tu já tem contexto configurado** (`_contexto/empresa.md` do RatosOS / Claude Code
OS, ou um `CLAUDE.md` no projeto), a skill lê de lá, propõe o nicho e o público que
deduziu, e te pergunta se serve. Se servir, pula as duas primeiras perguntas. Se o
teu canal for outra coisa que o teu negócio, tu diz e ela pergunta do zero. Ela nunca
usa o contexto sem confirmar: descrever a empresa e descrever o canal são coisas
diferentes, e o público errado envenena 20% da nota.

Idioma, país, orçamento e credenciais são sempre perguntados, porque errar neles
custa dinheiro (query no país errado é query paga jogada fora).

O setup salva um `config.json` e um `.env` em `~/.config/triagem-youtube-ratos/` e valida as credenciais com uma query de teste antes de seguir.

## Pré-requisitos

### Conta no DataForSEO

A skill depende da API do [DataForSEO](https://dataforseo.com) pra puxar dados do YouTube e do Google. É paga, mas barata:

- **YouTube SERP:** $0.002 por query
- **Volume de busca:** $0.002 por query
- **Triagem típica de 10-15 temas:** $0.05 a $0.20

Com **US$5 de crédito dá pra fazer umas 100 triagens**. Não pede cartão pra criar conta.

### Como criar conta e pegar credenciais

1. Acessa [dataforseo.com/register](https://dataforseo.com/register)
2. Cria conta (email + password)
3. Adiciona crédito em Dashboard → Add Funds (paga com cartão ou cripto)
4. Em Dashboard → API Access, copia:
   - **API Login** (é o teu email)
   - **API Password** (é um password específico da API, NÃO o password da conta)
5. Quando rodares a skill a primeira vez, o setup vai pedir essas duas coisas

### Alternativa: variáveis de ambiente

Se preferir, pode exportar direto no shell e pular a parte de credenciais no setup:

```bash
export DATAFORSEO_LOGIN="teu-email@exemplo.com"
export DATAFORSEO_PASSWORD="teu-api-password"
```

Ordem de precedência de leitura das credenciais (a skill tenta nessa ordem):

1. Variáveis de ambiente `$DATAFORSEO_LOGIN` e `$DATAFORSEO_PASSWORD`
2. `./.env` no diretório atual do projeto
3. `~/.config/triagem-youtube-ratos/.env`
4. `~/.mcp-credentials/dataforseo.env` (compatibilidade com setups antigos)

## Como usar

Depois de instalada, a skill é ativada quando tu fala com o Claude Code sobre priorização de vídeos. Exemplos:

- "roda uma triagem desses 12 temas da semana"
- "quais desses vídeos valem gravar?"
- "me dá o ranking de potencial dessa lista"
- "analisa esses links e me diz o que tem mais busca"

Tu pode mandar a lista de 3 jeitos:

- **Descrição por extenso:** "1. Novo modelo X lançou. 2. Ferramenta Y ganhou feature Z. 3. ..."
- **Arquivo markdown** com bullet points
- **Lista de links** (tweets, artigos, posts)

A skill gera um relatório em markdown salvo em `./triagens/triagem-YYYY-MM-DD.md` (ou no path que tu configurou).

## Como funciona o score

O score de potencial combina 4 fatores com pesos:

```
SCORE = (busca × 30%) + (youtube × 30%) + (frescor × 20%) + (publico × 20%)
```

- **Busca** — volume mensal da melhor keyword (dados Google Ads)
- **YouTube** — existem vídeos outliers sobre o tema? Quão grandes?
- **Frescor** — quanto tempo tem a notícia
- **Público** — relevância pro teu público específico (configurado no setup)

Os pesos ficam no `config.json` e podem ser ajustados manualmente se tu quiser dar mais peso pra um fator do que outro.

## Filosofia por trás

Duas ideias principais:

1. **Título e SEO são coisas diferentes.** Título é pra gerar clique (CTR), descrição é pra gerar busca (SEO). A skill separa as duas e gera cada uma com foco diferente.
2. **Honestidade editorial vale mais que métrica bonita.** Se um tema é fraco, a skill vai dizer que é fraco. Melhor gastar esforço nos que têm potencial real do que inflar 10 vídeos médios.

## Criado por

Feito com Claude Code pela [**Ratos de IA**](https://ratosdeia.com.br) — projeto educacional da [DobraLabs](https://dobralabs.com.br), laboratório de IA e tecnologia.

- **Canal no YouTube:** [@ratosdeia](https://youtube.com/@ratosdeia)
- **Newsletter:** [dobralabs.substack.com](https://dobralabs.substack.com)
- **Instagram/TikTok:** [@ratosdeia](https://instagram.com/ratosdeia)
- **Curso:** [Claude Code OS](https://ratosdeia.com.br/claudeos/)

Gostou da skill? Dá um ⭐ no repo e segue a [Ratos de IA](https://ratosdeia.com.br).

## Licença

🐀 Fica à vontade pra adaptar, modificar e tirar o máximo que der dessa skill.

Se compartilhares com alguém ou postares uma versão tua por aí, um crédito pra [**@ratosdeia**](https://ratosdeia.com.br) cai bem e ajuda a manter o projeto vivo pra gente seguir liberando material novo. Valeu!

Pra quem curte formalidade: tá licenciada sob [CC BY 4.0](./LICENSE).

## Disclaimer

Essa skill foi construída com Claude Code. Funciona bem, mas:

- **DataForSEO cobra por query.** A skill acumula o custo e avisa antes de passar do orçamento configurado, mas tu é responsável pelo consumo da tua conta.
- **Os scores são heurísticas, não garantia.** Um score 95 não significa que o vídeo vai viralizar. Significa que os fatores que costumam correlacionar com bom desempenho estão presentes. Julgamento editorial continua sendo teu.
- **O YouTube muda o algoritmo o tempo todo.** O que funciona hoje pode não funcionar amanhã. A skill te dá dados, não uma bola de cristal.

Use com consciência e calibra com teu próprio julgamento.
