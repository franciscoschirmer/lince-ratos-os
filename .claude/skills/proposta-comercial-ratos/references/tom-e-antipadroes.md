# Tom da proposta e antipadrões de escrita

Passar a proposta inteira por aqui antes de entregar. Texto com cara de IA queima a venda:
o cliente não sabe nomear o que incomodou, mas sente que ninguém pensou no caso dele.

---

## Voz

O tom sai do `design.md` do usuário (formal / direto / casual / técnico). O que vale pros
quatro:

1. **Afirmativa.** A proposta afirma o que vai ser feito. Não pergunta, não sugere, não pede
   licença.
2. **Concreta.** Número, prazo, nome de entrega. Adjetivo é o que sobra quando falta fato.
3. **Curta.** Frase de uma ideia. Passou de umas 25 palavras, quebra.
4. **Voz ativa.** "a gente entrega os 3 fluxos em 4 semanas", não "os fluxos serão entregues".
5. **Sem jargão desnecessário.** Se o termo técnico é o nome exato da coisa, usar e explicar
   em cinco palavras. Se é só pra parecer sofisticado, cortar.
6. **O cliente no centro.** Contar quantas vezes o texto diz "nós/nossa" e quantas diz o nome
   do cliente. Se "nós" ganhar, reescrever.

Formal e casual mudam o tratamento e a contração, não a estrutura. Proposta formal também é
curta e concreta.

---

## Antipadrões (cortar sempre)

1. **Dicotomia "não é X, é Y".** O pior de todos. "não é só um site, é uma experiência",
   "mais do que uma ferramenta, é um parceiro", "deixa de ser custo pra virar investimento".
   Ir direto pra afirmação concreta.
2. **Regra de três oca.** Três adjetivos em série só pelo ritmo: "rápido, simples e
   poderoso". Ficar com o que significa alguma coisa.
3. **Superlativo vazio.** "revolucionário", "poderoso", "robusto", "incrível", "de ponta",
   "transformador", "game changer". Mostrar o efeito concreto no lugar.
4. **Chavão de palco.** "isso muda tudo", "o jogo virou", "a virada de chave", "o pulo do
   gato", "o futuro é agora".
5. **Metáfora batida.** "ponta do iceberg", "divisor de águas", "cereja do bolo", "a chave
   que destrava", "sair da caixinha".
6. **"não apenas... mas também".** Mesma família da dicotomia. Afirmar direto.
7. **Pergunta retórica de venda.** "e se eu te dissesse que...", "já parou pra pensar...",
   "imagina poder...". Começar pela afirmação.
8. **Fecho de redação.** "no fim das contas", "ao final do dia", "em resumo", "a real é que".
   Só dizer a coisa.
9. **Travessão dramático.** Usar o travessão pra criar suspense ou emendar oração. Ponto
   final resolve.
10. **Hedge.** "acreditamos que talvez seja possível", "de certa forma", "vale notar que".
    Se há incerteza real, nomear a incerteza: "o prazo da fase 2 depende do volume de dados
    que a fase 1 encontrar".
11. **Promessa sem sujeito.** "resultados expressivos", "ganho significativo". Significativo
    quanto? Se não dá pra medir, não escrever.
12. **Elogio ao cliente no vazio.** "sabemos da excelência da sua operação". Se o elogio não
    vem de algo específico que apareceu na reunião, sai.

**Regra-mãe:** se a frase nega algo só pra valorizar o que vem depois, reescrever começando
pela afirmação. Comparação real (antes/depois, cenário A e B em blocos separados) é legítima.
O vício é a negação retórica dentro da mesma frase.

---

## Teste rápido antes de entregar

Ler a proposta e responder:

- Dá pra trocar o nome do cliente por outro e o texto continuar fazendo sentido? Se dá, a
  seção de entendimento está genérica. Refazer.
- Tem alguma frase que **só caberia** nesta proposta? Se não tem, faltou ouvir a reunião.
- O cliente reconheceria as próprias palavras em algum ponto? Se não, faltou o `.quote-block`.
- Cada número no documento veio de alguém? Se não, é chute, e chute vira `[a confirmar]`.

---

## Quebras de linha

Em subtítulo, descrição e parágrafo curto, controlar a quebra com `<br>` em ponto natural
(depois de vírgula que separa ideias, antes de conector, no fim de uma oração). O alvo é a
última linha ser a mais longa, ou perto disso.

```
ruim:  dois dias de workshop, com todo o desenho do formato, o pre-work e os
       materiais incluídos.

certo: dois dias de workshop, com todo o desenho do formato,
       o pre-work e os materiais incluídos.
```

Verificação automática: `node scripts/check-quebras.js proposta.html`. Ele separa duas
coisas, porque a régua é diferente:

- **VIUVA**, em texto de display (título, subtítulo, CTA, citação): a última linha ficou
  muito mais curta que as outras. Corrigir com `<br>` em ponto natural.
- **ORFA**, em texto corrido (parágrafo, item de lista): sobrou uma palavra solta na última
  linha. Corrigir **reescrevendo a frase**, nunca com `<br>`. Parágrafo com `<br>` manual
  quebra feio no celular, onde a largura é outra.

Rodar até dar `0 viúva(s), 0 órfã(s)`. Cada correção muda o fluxo do texto, então repetir.

Em texto corrido, deixar o navegador quebrar é o certo. O `SEM-BR` que o script reporta em
bloco de display às vezes é aceitável: se a quebra automática caiu em ponto bom, deixa.
