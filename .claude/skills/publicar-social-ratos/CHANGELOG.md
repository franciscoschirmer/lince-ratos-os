# Changelog — publicar-social-ratos

Como aplicar uma atualização (pro Claude de quem instalou):

- **Nunca tocar** no `.env`. É dado de quem instalou.
- Fazer backup `.bak` antes de editar qualquer arquivo.
- Se o arquivo local divergir do que a versão anterior entregava, é customização de quem
  instalou: **não sobrescrever cego**. Mostrar a diferença e perguntar.
- Aplicar da versão mais antiga pra mais nova, olhando o `VERSION` local (sem `VERSION` = anterior à 2.0.0).
- No fim, validar (`node --check scripts/*.js`) e atualizar o `VERSION`.

Rótulos de risco: `ADITIVO` (só acrescenta) · `SUBSTITUIÇÃO` (troca bloco ou arquivo) ·
`BREAKING` (muda contrato/uso).

---

## 2.0.0 — 2026-09-23

Agendamento, reels, conferência de ordem do carrossel e painel HTML da semana. Corrige o
endereço da API da Post for Me, que estava errado.

### `scripts/publish-postforme.js` — `SUBSTITUIÇÃO` (arquivo inteiro)

Trocar o arquivo inteiro pela versão desta skill. O antigo:

- chamava `https://app.postforme.dev/api`, que é o site e não a API. **A publicação pela Post
  for Me não funcionava.** O novo usa `https://api.postforme.dev`
- só subia imagem. O novo aceita `--video` e `--media-url`

O que entrou:

- `--schedule <ISO com fuso>` agenda em vez de publicar agora. Recusa horário sem fuso ou no passado
- `--placement reels|timeline|stories` (vídeo no Instagram vai como reels por padrão)
- `--trial manual|performance` pra reels de teste, com a lista de valores conferida no script
- `--media-url` reaproveita um vídeo já hospedado (ex: o mesmo reels no TikTok)
- conferência de ordem do carrossel depois de criar (apaga e refaz se vier fora de ordem);
  `--sem-conferir` pula
- mensagens de erro que explicam 401 (assinatura atrasada) e 429 (muitos posts seguidos)

Os flags antigos (`--platform`, `--images`, `--caption`, `--account-id`, `--draft`, `--dry-run`)
seguem iguais, então quem chamava o script antes continua funcionando. A única diferença: sem
`--platform`, agora assume `instagram` (antes dava erro). Se o arquivo local tinha alguma mudança
de quem instalou, mostrar antes de trocar.

### `scripts/painel-agendados.js` — `ADITIVO` (arquivo novo)

Copiar pra `scripts/`. Gera `painel-agendados.html` com a semana de posts da Post for Me.
Sem dependência nova (usa o `fetch` do Node 18+).

### `.env` — `ADITIVO` (só preferência, sem segredo)

Perguntar e acrescentar, se ainda não existir:

```
POSTFORME_FUSO=-03:00
POSTFORME_INICIO_SEMANA=segunda
```

### `SKILL.md` — `SUBSTITUIÇÃO`

Trocar pelo `SKILL.md` desta versão. Mudou: o `name` (`publicar-instagram` → `publicar-social-ratos`),
o teste de conexão do setup (endereço da API), e as seções novas 3 a 8 do workflow (agendar,
reels, lote, painel), "Regras" e "Atualizar a skill".

### `VERSION` e `CHANGELOG.md` — `ADITIVO`

Arquivos novos.
