# Carrossel com Vídeo (Ratos)

Skill de Claude Code que transforma um vídeo num **carrossel do Instagram** onde alguns slides levam um corte do próprio vídeo dentro de uma moldura, com a **cara da tua marca**. O corte é escolhido pelo sentido da fala (não pelo relógio, não por pontuação) e ancorado na linha do tempo real. Setup guiado na primeira vez.

Essa é uma versão **genérica** da skill que a gente usa internamente na [**Ratos de IA**](https://ratosdeia.com.br) pra virar vídeo em carrossel. A identidade do canal saiu, o método ficou.

## O que faz

- **Três fontes de vídeo:** link do YouTube, link de outra plataforma (Instagram, TikTok, Vimeo... via yt-dlp) ou um arquivo de vídeo **local** na tua máquina
- **Setup conversacional:** na primeira vez detecta um design-guide já configurado (quem usa **Ratos OS / Claude Code OS** já tem) ou pergunta cor, fonte, nome e estilo pra montar o teu
- **Corte pelo sentido:** lê a transcrição inteira, escolhe unidades de sentido fechadas e ancora na respiração real do áudio — sem depender de pontuação, que a legenda automática às vezes nem tem
- **Confere a tela:** olha os frames de cada corte pra pegar b-roll, cartela de fim ou legenda queimada antes de renderizar
- **Texto depois do corte:** escreve o slide como o degrau que entrega a fala, não um resumo dela
- **Vídeo em outro idioma:** fonte em inglês, carrossel em português? O texto sai no teu idioma e o clipe embutido ganha legenda traduzida queimada (sem depender de libass)
- **Entrega tudo em MP4** (1080x1350), na ordem certa — o Instagram reagrupa carrossel misto e embaralha, então até os slides de texto viram MP4
- **Combina o CTA contigo:** antes de montar, pergunta o que tu quer no último slide (tu dita, ela te dá opções, ou escolhe uma)
- **Abre um preview no fim:** gera e abre uma paginazinha com os 10 slides em ordem pra tu ver que ficou bom antes de publicar

**Para no MP4 de propósito: não publica, não pede chave de API obrigatória e não faz automação de DM.** A publicação é tua.

## Instalação

```bash
# baixe o zip de carrossel-video-ratos na plataforma (Materiais) e descompacte em ~/.claude/skills/
```

## Como usar

Depois de instalar, abre teu projeto no Claude Code e pede:

```
faz um carrossel desse vídeo: https://youtube.com/watch?v=...
```

ou, com um arquivo local:

```
faz um carrossel desse vídeo aqui: ~/videos/minha-aula.mp4
```

Na primeira vez, a skill configura a tua marca (ou usa o design-guide que já achar no projeto). Depois vai direto pro carrossel.

## Pré-requisitos

- **yt-dlp** — baixar vídeo de link (não precisa pra arquivo local)
- **ffmpeg** — cortar e compor vídeo
- **node** + **Playwright** — renderizar os slides. Se faltar, a skill instala: `npx playwright install chromium`
- **python3** — ancoragem e transcrição

### Transcrição (só quando não há legenda automática)

Quando a fonte não tem legenda pra baixar (vídeo sem auto-sub, outra plataforma, arquivo local), a skill transcreve o áudio **já publicado** — o timecode fica certo. Por padrão usa **Whisper local, grátis, sem chave nenhuma**:

```bash
pip install openai-whisper
```

Se preferir ir mais rápido, dá pra usar AssemblyAI (opcional): copia o `.env.example` pra `.env` e põe tua `ASSEMBLYAI_API_KEY`.

## Estrutura

```
carrossel-video-ratos/
├── SKILL.md                  <- o fluxo completo (7 fases + setup + atualização)
├── marca/
│   └── design-guide.md       <- a identidade da marca (preenchida no setup)
├── templates/
│   ├── gerar.js              <- monta os slides em HTML (copiar pra pasta de trabalho)
│   └── cortes.sh             <- corta os trechos do vídeo (copiar e preencher)
├── scripts/
│   ├── ancorar.py            <- ancora o corte na respiração real do áudio
│   ├── transcrever.py        <- gera .srt na linha do tempo real (Whisper/AssemblyAI)
│   ├── legendar.js           <- queima legenda no clipe sem libass (cross-language)
│   ├── compor.js             <- encaixa o corte na janela do slide
│   ├── png-para-mp4.sh       <- converte slide de texto em MP4 (ordem no feed)
│   └── preview.js            <- monta e abre a paginazinha de preview dos slides
└── exemplo/                  <- um carrossel de prova, ponta a ponta
```

## Customização

A identidade vive em `marca/design-guide.md`. Pode editar direto ou pedir pro Claude:

```
muda a cor principal do carrossel pra #FF5C00
troca a fonte dos slides
```

## Feito com Claude Code pela Ratos de IA

Skill educacional da [**Ratos de IA**](https://ratosdeia.com.br), o projeto de IA aplicada da [DobraLabs](https://dobralabs.com.br). Se tu quer aprender a construir skills e automações assim (do zero, mesmo sem ser programador), é lá:

- **Canal no YouTube:** [@ratosdeia](https://youtube.com/@ratosdeia)
- **Instagram/TikTok:** [@ratosdeia](https://instagram.com/ratosdeia)
- **Curso:** [Claude Code OS](https://ratosdeia.com.br/claudeos/)

Gostou? Dá um ⭐ no repo e segue a [Ratos de IA](https://ratosdeia.com.br). 🐀

## Licença

Uso pessoal restrito a alunos e assinantes da [Ratos de IA](https://ratosdeia.com.br). Proibido redistribuir, revender ou usar comercialmente sem autorização. Ver [LICENSE](LICENSE).
