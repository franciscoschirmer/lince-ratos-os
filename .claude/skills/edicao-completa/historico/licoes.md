# Lições · o que o Francisco reprovou e o que ficou de regra

Lista viva. Cada linha nasceu de uma versão reprovada (ver os históricos nesta pasta). A
skill lê isto antes de editar; o que está aqui não se repete.

## Direção de arte

- **Não cobrir elemento nativo do story** (adesivo da caixinha). Ele é o orgânico do
  conteúdo. Texto fixo que a cliente digitou, sim: apagar por inpainting.
- **Faixa, tarja, pílula colorida, palavra acendendo em cor:** linguagem de "edição de
  internet". A casa é branco sobre vídeo, sans + serifa itálica. (v1, v3)
- **Legenda pequena demais cansa:** 64 px de sans e 104 px de itálica em 1080x1920. (v4)
- **Frase começa com maiúscula.** Regra: depois de `.?!` ou de pausa ≥ 0,5 s. (v4)
- **Sem cartão final com nome** nas caixinhas: os vídeos da casa terminam nela falando. (v4)
- **Zoom acima de ~1,2 estraga** (pessoa sai do quadro, upscale aparece). (v3)
- **Cartão/ilustração desenhada tem que ser muito polida ou não entra.** "Se for fazer
  animação, tem que ser super polida." Vídeo de banco é a primeira opção. (v2, v4)

## Ritmo e som

- **Sem SFX o vídeo "parece que só legendou e cortou".** Mas whoosh em todo corte também foi
  reprovado: clique de mouse nos saltos, obturador no flash, whoosh só na entrada de
  inserção, ding na frase-chave, boom na ênfase. (v2, v4)
- **Nada parado mais de 3 s.** Salto ou aproximação lenta a cada 2–5 s. (v2)
- **Inserção "pontual" é pouco.** Medido na casa: 6–8 por minuto, 30–50 % do tempo coberto,
  maioria em tela cheia. (v5)
- **Trilha 19 dB abaixo da voz**, com ducking. (v4)

## Voz

- **"Voz muito ecoada" é reclamação certa:** sempre tratar (RNNoise + afftdn + gate curto +
  corte em 280 Hz). (v4)
- **Legenda transcrita do áudio SEM limpeza.** A limpeza confunde o Whisper. (v5)

## Técnica (pra não perder tempo de novo)

- Transcrever o áudio já cortado, não mapear a transcrição do bruto. (v1)
- Ponto de corte: RMS do áudio em janelas de 5–10 ms, nunca o tempo do Whisper. (v1)
- `setpts=N/(FPS*TB)` depois de `zoompan` e de `tpad`. (v2)
- Fonte variável não serve no libass; estáticas pela API de CSS do Google Fonts; `fontsdir`
  no filtro `ass`. (v4)
- Inpainting em fluxo, frame a frame. (v4)
- RNNoise/afftdn cospem NaN no fim do fluxo: voz processada à parte e saneada em numpy. (v5)
- Whisper alucina no rabo: descartar o que vem depois da última palavra do bruto. (v5)
- Drive: o conector não baixa MP4; `drive.usercontent.google.com/download?id=…&confirm=t&uuid=…`. (v4)
- Instagram não baixa sem login; pedir o arquivo ou o Drive. (v3)
- Mixkit: só itens `copyrightNotice: Free`; nada de vírus pra ilustrar saúde. (v5)
