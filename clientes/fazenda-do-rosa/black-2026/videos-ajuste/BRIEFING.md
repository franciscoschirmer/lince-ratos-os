# Ajuste dos vídeos reaproveitados · Black 2026 da Fazenda do Rosa

Objetivo: deixar prontos pra Black 2026 (50% OFF, carrinho em 11/11/2026) os vídeos das Blacks anteriores que só têm data errada. Não existe projeto de edição: o ajuste é feito em cima do MP4 final, cortando o cartão final ou cobrindo uma linha de texto e escrevendo a nova no mesmo estilo.

## Entrada e saída

- Originais: `originais/` (o Francisco baixa do Drive; nomes abaixo). Não use as versões do Instagram, que são 360x640.
- Saída: `prontos/<nome>-black2026.mp4` na mesma resolução, fps e áudio do original, mais `prontos/<nome>-conferencia.jpg` (folha com quadros antes e depois da troca).
- Os MP4 ficam fora do git (o .gitignore já cobre).

## Identidade visual

- Fonte: Neue Montreal, instalada nesta máquina (Regular, Medium, Bold e itálicos em C:\Users\ASUSB\AppData\Local\Microsoft\Windows\Fonts\NeueMontreal-*.otf, fonte de usuário). O script `troca_texto.py` desta pasta faz a troca e calibra peso, tamanho e espaçamento pelo texto antigo.
- Paleta da Fazenda: #F7FDF2, #ADA192, #E9D9CD, #97A25F, #4B4F36. Nos vídeos o texto é branco: copie o que o próprio vídeo usa (cor, peso, caixa alta ou baixa, espaçamento entre letras, sombra, posição, animação de entrada).
- Regra de ouro: a linha nova tem que parecer do mesmo vídeo. Meça a altura e a posição do texto antigo nos quadros antes de escrever o novo.

## Vídeos

| arquivo em originais/ | link do Drive | o que trocar |
|---|---|---|
| `Vídeo Faltam 02 dias.mp4` | https://drive.google.com/file/d/133ZrFJzVQQ03EDmh8KOPWaH_40-9dj7u/view | Cartões finais em fundo preto "08 de Maio" (aparece duas vezes, a segunda em fade) por "11 de Novembro". Fundo preto liso: refazer o trecho do cartão inteiro com o texto novo, mesma fonte, tamanho e fade. Resto do vídeo ("faltam 02 dias", "para tudo isso", "estar com 50% OFF") fica. |
| `Vídeo Atenção, amantes de momentos inesquecíveis falta pouco!.mp4` | https://drive.google.com/file/d/1Du9tjNobLHtxdxby0cNOkN6L6Ye_R_61/view | Linha pequena em caixa alta abaixo de "Você já está no nosso grupo VIP, né?": "MARQUE NA SUA AGENDA \| 08/05" por "MARQUE NA SUA AGENDA \| 11/11". Fica sobre vídeo em movimento (casa, céu azul): cobrir só a faixa da linha (delogo ou desfoque local suave, sem caixa visível) e escrever a nova no mesmo lugar e estilo, nos mesmos quadros em que a antiga aparece. |
| `Vídeo Cada onda que quebra carrega um convite.mp4` | https://drive.google.com/file/d/1Lm_aaKcPfmzAt93UotYvjtyi1TDlWHK2/view | Linha pequena em caixa alta acima de "todas as cabanas da Fazenda do Rosa estarão com 50% OFF": "NO DIA 08/05," por "NO DIA 11/11,". Mesmo método do anterior (fica sobre a praia). O resto fica, inclusive "SIM, METADE DO PREÇO" e o fim "O Amor também merece um tempo só pra ele". |
| `Frase01.mp4`, `Frase03.mp4`, `Frase 05.mp4`, `Frase 07.mp4` | pasta https://drive.google.com/drive/folders/1WQJ2wy4kEJRd34pw5b1u2_daGiSpfiTM | No take 2 (fim do vídeo) o texto é "11/05 - Todas as cabanas com 50% off. Entre no Grupo Vip". Trocar só a data: "11/05" por "11/11". Primeiro olhe os quadros pra ver como o texto está montado (linha única ou data separada) e escolha o menor ajuste. A Frase 06 não foi achada no Drive; se aparecer em originais/, mesmo ajuste. Frase 02 e Frase 04 não entram (inverno). |

## Como conferir antes de dar por pronto

1. Extrair quadros do trecho alterado, antes e depois, e olhar: texto novo legível, sem borda de caixa, sem tremor, alinhado com o resto, sem resto do texto antigo aparecendo.
2. Duração, resolução e áudio iguais ao original (ffprobe nos dois).
3. Ortografia: "11 de Novembro" com a mesma caixa do original ("08 de Maio" usa inicial maiúscula no mês).
4. Se um vídeo não ficar bom (texto sobre fundo muito movimentado, sombra difícil de copiar), não entregue um remendo: deixe de fora e explique no recado o motivo e a alternativa (por exemplo, cortar o trecho da linha ou mandar pro editor só aquele).

## Ferramentas

ffmpeg/ffprobe e Python nesta máquina. A skill `edicao-completa` (.claude/skills/edicao-completa/) tem scripts e convenções de texto animado e conferência que podem ser reaproveitados.
