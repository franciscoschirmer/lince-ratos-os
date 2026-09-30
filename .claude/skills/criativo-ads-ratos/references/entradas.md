# Os três jeitos de entrar

O user chega de um dos três jeitos. Identificar isso na primeira mensagem evita perguntar o que ele
já respondeu.

| Ele chega com | Modo | O que a skill faz |
|---|---|---|
| a copy escrita e aprovada | **copy pronta** | não reescreve. escolhe layout e monta |
| uma ideia, um produto, uma dor | **ideia** | propõe ângulos, escreve a copy, monta |
| anúncios de referência que ele gostou | **referência** | lê a estrutura, remonta na marca dele |

Dá pra misturar: referência pra estrutura + copy pronta pro texto, por exemplo.

---

## Modo 1 — copy pronta

Ele já tem o texto. Pode ser copy de redator, texto aprovado pelo cliente, ou saída de outra skill
de copy.

**A copy é dado, não sugestão.** Reproduz ao pé da letra. Corrige só typo óbvio, e avisando. Se o
pronome da copy briga com o `tom` do `brand.yaml`, aponta e pergunta — não corrige sozinho.

O que fazer:
1. Salva num `copy.md` no lote, uma peça por bloco.
2. Pra cada peça, olha o **formato do texto** e escolhe o layout: frase de cliente com nome →
   `l-quote`. Preço → `l-price`. Número curto → `l-stat`. Lista → `l-list`. O resto → `l-top`.
3. Copy comprida demais pro formato: **não corta por conta própria.** Mostra o que não cabe e
   oferece as duas saídas (encurtar ou descer um degrau de título).
4. Monta, renderiza, contact sheet.

Se a copy vier em bloco único sem separação por peça, pergunta quantas peças ele quer antes de
fatiar.

---

## Modo 2 — só a ideia

Ele diz o que vende e pra quem. O texto sai daqui.

**Descobrir primeiro** (curto, uma pergunta por vez, no máximo cinco):
1. o que é o produto e quanto custa
2. pra quem, e o que essa pessoa faz hoje sem ele
3. o que ela já tentou e não deu certo
4. tem prova? número, depoimento, print, garantia
5. etapa: quem nunca ouviu falar (topo) ou quem já conhece e não comprou (fundo)

**Depois propor 4-5 ângulos**, cada um em três linhas: nome do ângulo, a headline, e por que ele
morde. Ângulos que funcionam estão em [copy.md](copy.md).

**CHECKPOINT: mostrar os ângulos e esperar.** Não escreve a copy dos cinco antes de saber quais
sobrevivem.

Aprovados os ângulos, escreve a copy final de cada um (headline, apoio, CTA), mostra em texto, e só
aí monta o HTML. Duas paradas: ângulo e copy. Renderizar dez peças pra descobrir que o ângulo tava
errado é o desperdício clássico.

---

## Modo 3 — referência pra kibar

Ele manda print, link, ou o @ de um concorrente. O que se copia é **estrutura**, não arte.

### De onde vem a referência

- **print ou PDF** → lê a imagem direto
- **@ de um concorrente** → se a skill `espiar-ads-ratos` estiver instalada, usa: ela puxa da
  Biblioteca de Anúncios da Meta, deduplica por conceito e resume os padrões. Se não estiver, abre
  a Biblioteca manualmente: `facebook.com/ads/library` filtrando por página
- **link de post** → WebFetch

### O que extrair de cada referência

Uma tabela, não um texto:

| Campo | Pergunta |
|---|---|
| ângulo | qual botão emocional ele aperta: dor, prova, preço, curiosidade, autoridade |
| estrutura | o que vem primeiro, o que vem depois, onde está o CTA |
| headline | a fórmula, não a frase ("pergunta que acusa o hábito", "número + prazo") |
| prova | tem? qual tipo |
| layout equivalente | qual dos nossos nove chega mais perto |
| o que faz funcionar | uma linha, honesta |

### Onde fica o limite

**Copiar:** estrutura, ângulo, hierarquia, fórmula de headline, tipo de prova, ritmo da copy.
Isso é o que dá pra aprender de um anúncio que está rodando há meses — se está no ar há tanto
tempo, está pagando.

**Não copiar:** a frase literal, o nome da marca, o produto do concorrente, número que não é do
cliente, depoimento de outra pessoa, arte com marca registrada dentro. Além de ser roubo, reprova
na Meta e não converte — o anúncio do concorrente funciona pra oferta dele, não pra tua.

Se o user pedir cópia literal, diz isso em uma linha e entrega a versão remontada. Não vira sermão.

### Fechar o modo

Mostra a tabela de leitura das referências e a proposta de peça equivalente **antes** de montar.
Aí segue igual ao modo 2 a partir da aprovação da copy.
