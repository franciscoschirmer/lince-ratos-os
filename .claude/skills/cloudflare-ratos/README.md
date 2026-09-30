# cloudflare-ratos

Skill de Claude Code que guia o fluxo completo de **publicar e operar sites e landing pages no Cloudflare Pages**, do jeito certo: site conectado ao GitHub, publicação automática a cada push, de graça.

Faz parte da trilha **Sites e landing pages com IA**, da **Ratos de IA** (DobraLabs).

## O que faz

- **Conecta a conta** no Claude Code (`wrangler login` em 2 cliques, ou modo avançado com token de API de escopo mínimo pra DNS por comando).
- **Publica site novo** do jeito da casa: cria o repositório no GitHub e te guia passo a passo no painel pra conectar o Git no Pages (a parte que é de painel, ela orienta; a parte que é comando, ela executa).
- **Atualiza o site no ar**: commit + push e o Cloudflare publica sozinho.
- **Domínio e subdomínio**: te diz exatamente qual registro DNS criar (ou cria sozinha, no modo avançado).
- **Secrets, banco D1 e debug**: senha de material protegido, banco pra formulário de lead, logs ao vivo quando algo quebra.

A regra de ouro embutida: **site de verdade é projeto conectado ao Git**, nunca upload avulso, pra ter histórico, reversão e publicação automática.

## Instalação

```bash
cp -r cloudflare-ratos ~/.claude/skills/
```

Ou cole o link deste repositório no seu Claude Code e peça pra instalar.

## Como usar

Não precisa decorar comando: peça em português. "Publica esse site pra mim", "bota essa página no ar", "atualiza o site", "aponta o subdomínio x pro projeto", "o build falhou, me ajuda". A skill dispara sozinha nesses pedidos, ou chame `/cloudflare-ratos`.

## Pré-requisitos

- Conta gratuita no Cloudflare e no GitHub
- Node instalado (a skill usa `npx wrangler`, nada global)
- GitHub CLI (`gh`) pro fluxo de criar repositório

## Créditos

Feita pela DobraLabs / Ratos de IA pro curso Sites e landing pages com IA.
