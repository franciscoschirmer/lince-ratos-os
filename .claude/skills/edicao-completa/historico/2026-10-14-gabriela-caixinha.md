# Histórico · caixinha "medicação pra disposição" · Dra. Gabriela Castello

Primeiro vídeo editado pela skill, 2026-10-14 e 15. Bruto de 60 s exportado do story
(720x1280, adesivo da caixinha e um texto fixo queimados na imagem). Cada versão abaixo
tem: o que foi feito, o que o Francisco disse, e o que mudou por causa disso. Os números
e os arquivos estão em `clientes/gabriela-castello/conteudos/2026-10-14-caixinha/`
(planos `plano*.json`, um por versão).

## v1 · "legendou e cobriu" (14/10, tarde)

**Feito.** Primeira passada: cortes de erro e repetição, pausas aparadas, 4 níveis de zoom
estático, legenda em faixa clara opaca (Baskerville Old Face), caixinha redesenhada por cima
do adesivo original, etiqueta amarela "Mitocôndria: a casinha de energia da célula", cartão
final com nome e CTA. Transcrição com faster-whisper large-v3 na CPU (2,5 min por minuto de
vídeo).

**Aprendido no processo.** A legenda tem que ser transcrita do áudio **já cortado**, não
mapeada da transcrição do bruto: o tempo do Whisper derrapa 100–200 ms e a emenda come ou
sobra palavra. O ponto de corte se mede no RMS do áudio em janelas de 5–10 ms, nunca no
tempo da transcrição. O Whisper inventa palavra em respiração ("E"); vale descartar palavra
que não existe no bruto e cai em trecho sem voz.

**Francisco:** "essa listona ficou feia" (a faixa da legenda). Pediu tela dividida, zoom,
cortar pausas, acelerar, melhorar áudio, música, "deixar mais premium".

## v2 · "o motor editorial" (14/10, fim de tarde)

**Feito.** Tela dividida com inserções desenhadas em ASS (lista de pílulas acendendo, cartões
NAD/Q10, mitocôndria vetorial), legenda palavra a palavra com destaque de cor, zoom contínuo
(push) e soco de zoom, trilha sintetizada com ducking, efeitos (whoosh, pop, sino, impacto),
curva de cor, cartão final animado. Dois enquadramentos recortando o bruto pra deixar o texto
queimado fora do quadro.

**Aprendido.** `zoompan` e `tpad` bagunçam o PTS; sem `setpts=N/(FPS*TB)` depois de cada um,
o vídeo acaba antes do áudio. Faixa semi-transparente deixa o texto queimado vazar: ou cobre
opaco ou tira do quadro.

**Francisco:** gostou da direção mas "não tem legenda dinâmica o suficiente", "o som de
whoosh não é a escolha certa, tem que ser clique de mouse ou flash de câmera", "muito básico",
"tem que deixar mais premium". Pediu que eu trabalhasse como editor sênior.

## v3 · "magnética, mas no estilo errado" (14/10, noite)

**Feito.** Jump cuts a cada 2,4–3,3 s em fronteira de frase com clique, flash de câmera com
obturador nas trocas de tela, legenda palavra a palavra com pop por palavra e três palavras
"grandes" com giro, ênfase com boom, vinheta e grão, caixa da caixinha recalculada por
enquadramento. Sons novos sintetizados (clique, flash, boom, ding). Trilha com pulso.

**Aprendido.** Zoom acima de ~1,2 tira a pessoa do quadro quando ela se mexe, e o upscale 2x
de um bruto 720p aparece. Palavra-chave em pílula colorida e letra acendendo são linguagem de
"edição de internet", não da casa.

**Francisco:** "chegou perto", mas "não está nem um pouco perto do que eu espero". Mandou o
Drive dela: "vê os vídeos que a gente fez pra ela e entende o design system do vídeo".

## v4 · "o estilo da casa" (15/10, madrugada)

**Feito.** Baixei 7 vídeos editados pela equipe (o conector do Drive não serve pra MP4; o link
direto com `confirm=t&uuid=` serve) e medi: zoom por segmento pela largura do adesivo, cortes
por diferença de frame, nível da trilha pelo canal lateral do estéreo, fontes por zoom nos
frames. Resultado em `clientes/gabriela-castello/marca/design-system-video.md`: adesivo nativo
sem cobrir, tela cheia, salto parado × aproximação lenta (4,5 %/s) a cada 2–5 s, flash só no
primeiro corte, legenda Montserrat 52 px branca sem fundo em 64 % da altura, palavra-chave em
Playfair Display Italic 86 px, trilha 19 dB abaixo da voz, SFX em 1 a cada 5 cortes, sem
cartão final. Motor novo (`montar_caixinha.py`) só pra isso. Texto queimado do story apagado
por inpainting só nos traços das letras (`apagar_texto.py`, OpenCV). Fontes instaladas no PC
e passadas por `fontsdir`.

**Aprendido.** Fonte variável (`[wght].ttf`) não funciona no libass; baixar as estáticas pela
API de CSS do Google Fonts. Fonte instalada por usuário só aparece depois de
`AddFontResourceW` + broadcast. O inpainting de um vídeo de 1 min não cabe na memória
(5 GB): processar frame a frame em fluxo.

**Francisco:** "chegou perto". Detalhes: legenda pequena, frases começando em minúscula,
voz "muito ecoada", "agora não tem inserção nenhuma em tela dividida: quero, pode ser vídeo de
banco", "tirou os sound effects: sem eles o vídeo fica sem impacto, parece que só legendou e
cortou". "A caixinha original ficou ótima, não tem por que escrever por cima." Pediu pra
"pegar as coisas boas da v3 e aplicar na v4, polidas".

## v5 · "a casa + o impacto" (15/10, madrugada)

**Feito.** Sobre a v4: legenda 64/104 px, maiúscula por pontuação ou pausa ≥ 0,5 s, itálico
sem vírgula; 5 inserções de vídeo de banco (Mixkit, só licença Free) na metade de baixo, com
ela subindo 150 px e a legenda logo acima da divisa (layout medido nos vídeos de extração
dela); SFX em saltos (clique, 1 em 2), inserções (whoosh/clique), frases-chave (ding), ênfase
(boom), flash; voz com RNNoise + afftdn + gate + EQ (cauda de eco em 300 ms de -14 pra -23 dB).

**Aprendido (caro).** A limpeza de voz confunde o Whisper ("Deletratação", "postório"): a
legenda é sempre transcrita do áudio sem limpeza. O RNNoise/afftdn deste build do ffmpeg cospe
NaN ao esvaziar o buffer e, dentro do grafo grande, derruba o processo; `aeval` com `isnan`
também derruba. Solução que ficou: a voz é processada num ffmpeg à parte, saneada em numpy e
entra no grafo como WAV. Whisper alucina no rabo ("obrigada", "Patrícia"): descartar o que vem
depois da última palavra que existe no bruto. Inserções coladas viram montagem só depois de
2,2 s; antes disso, pula. DeepFilterNet não compila aqui (Rust).

**Francisco:** "no caminho". Pediu este histórico, e "as inserções estão muito pontuais":
quer inserções de texto e de imagem/vídeo em tela cheia, mais frequentes, seguindo o padrão
dos vídeos editados dela.

## v6 · "o ritmo de extração na caixinha" (15/10, manhã)

**Medido nos vídeos de extração dela:** 6,6 a 7,8 inserções por minuto, duração média 2–5 s,
30 a 50 % do tempo coberto, maioria em tela cheia (stock, print de notícia, 3D de órgão,
cartão de texto), o resto na metade de baixo. Sete tipos catalogados em
`design-system-video.md`, seção "Inserções".

**Feito.** Três tipos novos no motor: **stock em tela inteira** com aproximação lenta e
linhas de texto em Playfair Italic caixa alta, alinhadas à esquerda, cada uma entrando na sua
palavra ("FALTA DE MÚSCULO / FALTA DE EXERCÍCIO", "FERRO / VITAMINAS / MICRONUTRIENTES",
"NAD / + COENZIMA Q10"); **cartão de título** sobre ela (Playfair Black caixa alta + caixa
vinho com subtítulo em Montserrat caixa alta: "DOIS PEPTÍDEOS / QUE AJUDAM NA DISPOSIÇÃO");
e as de **metade de baixo** da v5. Oito inserções em 52 s (9/min, ~47 % coberto). A legenda
corrida some durante tela inteira e cartão; o bloco que atravessa a entrada é cortado nela.
Clique em cada linha de texto que entra, whoosh um pouco mais alto na tela inteira.

**Aprendido.** No libass, desenho com coordenadas negativas vai parar no canto: desenhar
sempre a partir de (0,0). O RNNoise derruba o ffmpeg de vez em quando sem motivo: a voz
tratada fica em cache (`voz-tratada.wav` + assinatura), com duas tentativas e um plano B sem
RNNoise. Vídeo de célula em tela inteira fica abstrato demais; pra "peptídeos que eu uso"
cápsulas dizem mais.

**Francisco:** (aguardando)
