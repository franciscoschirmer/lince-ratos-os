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
