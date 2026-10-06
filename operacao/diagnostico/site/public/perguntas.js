// As perguntas do diagnóstico, na ordem em que aparecem. Fonte única: o formulário (index.html)
// desenha a partir daqui e o servidor (functions/) usa pra montar a resposta guardada.
// Cada resposta é gravada junto com o texto da pergunta, então mudar uma pergunta aqui
// não estraga os diagnósticos antigos. O `id` de uma pergunta nunca muda depois de publicado.
//
// tipos: curta (uma linha) · longa (caixa de texto) · escolha (uma opção, com "Outro") · origem (percentuais)

export const ORIGENS = [
  { id: "indicacao", nome: "Indicação" },
  { id: "instagram", nome: "Instagram" },
  { id: "google", nome: "Google" },
  { id: "trafego", nome: "Tráfego pago" },
];

export const SECOES = [
  {
    n: 1,
    titulo: "Identificação",
    tempo: "2 minutos",
    intro: "Informações básicas que contextualizam todas as outras seções.",
    perguntas: [
      { id: "nome", tipo: "curta", obrig: true, p: "Qual é o seu nome completo?" },
      { id: "profissao", tipo: "curta", obrig: true, p: "Qual é sua profissão e especialidade?",
        ajuda: "Ex.: \"Médica dermatologista especializada em acne adulta\", \"Advogado tributarista para startups\"." },
      { id: "anos_atuacao", tipo: "curta", obrig: true, p: "Há quantos anos você atua nessa área?" },
      { id: "cidade", tipo: "curta", obrig: true, p: "Em qual cidade e estado você atende?",
        ajuda: "Importante para entender o mercado local e o regionalismo na comunicação." },
      { id: "negocio", tipo: "curta", p: "Qual é o nome do seu negócio, clínica ou escritório?",
        ajuda: "Se tiver mais de um, liste todos." },
      { id: "regulador", tipo: "longa", p: "Existe algum código de ética ou órgão regulador que limite sua comunicação? (Ex.: CRM, OAB, CRP)",
        ajuda: "Se sim, liste os 3 principais \"nãos\" que precisamos respeitar." },
    ],
  },
  {
    n: 2,
    titulo: "Arquitetura de receita",
    tempo: "6 minutos",
    intro: "Métricas de negócio que revelam gargalos e oportunidades. Estas informações também servirão de base para os relatórios trimestrais de performance.",
    dica: "Responda com a maior precisão possível. Estimativas são aceitas, mas dados reais geram estratégias melhores.",
    perguntas: [
      { id: "faturamento", tipo: "curta", obrig: true, p: "Qual é seu faturamento médio mensal atual?",
        ajuda: "Considere os últimos 6 meses. Se variar muito, indique uma faixa." },
      { id: "ticket_medio", tipo: "curta", obrig: true, p: "Qual é seu ticket médio por cliente/paciente?",
        ajuda: "Valor médio que cada cliente gasta em uma transação." },
      { id: "clientes_mes", tipo: "curta", obrig: true, p: "Quantos clientes/pacientes você atende por mês, em média?" },
      { id: "origem_clientes", tipo: "origem", obrig: true, p: "De onde vêm seus clientes atualmente?",
        ajuda: "Estime os percentuais. Não precisa fechar 100% exatos." },
      { id: "gargalo", tipo: "escolha", obrig: true, p: "Qual é o maior gargalo do seu negócio HOJE?",
        ajuda: "Marque apenas UM: o mais urgente.",
        opcoes: [
          "Falta de leads (não chegam pessoas interessadas)",
          "Baixa conversão (chegam leads mas não fecham)",
          "Baixa retenção (clientes não voltam)",
          "Margem baixa (trabalho muito, sobra pouco)",
          "Dependência de indicação (quando para, impacta meu negócio)",
        ] },
      { id: "investimento_trafego", tipo: "curta", obrig: true, p: "Quanto você investe em tráfego pago mensalmente?",
        ajuda: "Se não investe, escreva \"R$ 0\". Inclua todas as plataformas." },
      { id: "percentual_organico", tipo: "curta", p: "Qual percentual do seu faturamento vem do ORGÂNICO (sem anúncios)?" },
      { id: "roas", tipo: "curta", p: "Você sabe qual é seu ROAS (retorno sobre o investimento em anúncios)?",
        ajuda: "Se sim, informe. Se não, escreva \"Não sei calcular\"." },
      { id: "servicos_valores", tipo: "longa", obrig: true, p: "Liste todos os seus serviços/produtos e os respectivos valores.",
        ajuda: "Inclua desde a consulta inicial até programas premium, se houver." },
      { id: "servico_mais_receita", tipo: "longa", obrig: true, p: "Qual serviço gera MAIS receita para você?",
        ajuda: "Mesmo que não seja o favorito." },
      { id: "servico_favorito", tipo: "longa", obrig: true, p: "Qual serviço você MAIS GOSTA de entregar?",
        ajuda: "Aquele que te dá energia, que você faria de graça. Importante: pode ser diferente da resposta anterior." },
      { id: "abordagem_unica", tipo: "longa", obrig: true, p: "Descreva sua ABORDAGEM ÚNICA de trabalho.",
        ajuda: "O que você faz diferente dos outros profissionais da sua área? Qual é o seu \"jeito\" de resolver o problema do cliente?" },
      { id: "rituais", tipo: "longa", obrig: true, p: "Quais rituais (experiência) acontecem hoje na sua entrega?",
        ajuda: "Ex.: um café especial na recepção, um bilhete escrito à mão, uma mensagem de acompanhamento 48h após a consulta." },
    ],
  },
  {
    n: 3,
    titulo: "História e propósito",
    tempo: "8 minutos",
    intro: "Extrairemos a narrativa autêntica que conecta você ao seu público. CONTE HISTÓRIAS, não defina conceitos.",
    dica: "Esta é a seção mais importante para a Essência. Responda com histórias e episódios concretos, não com definições abstratas.",
    perguntas: [
      { id: "motivacao", tipo: "longa", obrig: true, p: "O que te motivou a escolher sua profissão? CONTE A HISTÓRIA.",
        ajuda: "Não defina seu propósito: conte o episódio, o momento ou a pessoa que te levou a esse caminho." },
      { id: "virada", tipo: "longa", p: "Qual foi o MOMENTO DE VIRADA na sua trajetória profissional?",
        ajuda: "Um acontecimento específico que mudou sua forma de ver ou exercer a profissão." },
      { id: "frustracao_mercado", tipo: "longa", obrig: true, p: "O que te FRUSTRA no seu mercado?",
        ajuda: "O que outros profissionais fazem que você considera errado, antiético ou prejudicial ao cliente?" },
      { id: "crenca_errada", tipo: "longa", p: "Qual é a UMA CRENÇA ERRADA sobre sua área que você gostaria de mudar?",
        ajuda: "Algo que o público geral acredita e que você sabe que está errado." },
      { id: "valores", tipo: "longa", p: "Liste de 3 a 5 VALORES INEGOCIÁVEIS que guiam seu trabalho.",
        ajuda: "Princípios que você NUNCA violaria, mesmo que custasse dinheiro ou clientes." },
      { id: "sacrificio", tipo: "longa", p: "Conte uma situação em que você SACRIFICOU algo por um desses valores.",
        ajuda: "Um episódio em que você perdeu dinheiro, cliente ou oportunidade para manter um princípio." },
    ],
  },
  {
    n: 4,
    titulo: "Cliente ideal: as 8 camadas de identidade",
    tempo: "8 minutos",
    intro: "Mapeamos profundamente quem é a pessoa que você transforma. Vamos além dos dados demográficos.",
    perguntas: [
      { id: "melhor_cliente", tipo: "longa", obrig: true, p: "Descreva seu MELHOR CLIENTE: a pessoa que você mais gosta de atender.",
        ajuda: "Nome fictício, idade, profissão, rotina, valores, como ela se sente no dia a dia. Pinte um retrato." },
      { id: "frustracao_cliente", tipo: "longa", obrig: true, p: "Qual era a FRUSTRAÇÃO URGENTE desse cliente ANTES de te conhecer?",
        ajuda: "A dor que não deixava dormir, as tentativas que falharam, o que já tinha tentado." },
      { id: "desejo_cliente", tipo: "longa", obrig: true, p: "O que esse cliente REALMENTE QUERIA, além do resultado técnico?",
        ajuda: "Qual era o desejo emocional profundo? (Ex.: não é só emagrecer, é sentir-se bonita no espelho. Para um médico, não é só \"ter saúde\", é \"poder brincar com os netos sem dor\".)" },
      { id: "como_quer_ser_visto", tipo: "longa", p: "Como esse cliente quer ser VISTO pelos outros após a transformação?",
        ajuda: "Que imagem ele quer projetar? (Ex.: ser vista como mãe dedicada, ser respeitado como profissional.)" },
      { id: "vilao", tipo: "longa", obrig: true, p: "Qual é o \"VILÃO\" comum que você e seu cliente combatem juntos?",
        ajuda: "Uma prática do mercado, uma crença popular, um comportamento da sociedade." },
      { id: "traco_comum", tipo: "longa", obrig: true, p: "Olhando para todos os seus clientes atuais, qual é o traço de personalidade ou valor de vida que quase todos têm em comum?" },
    ],
  },
  {
    n: 5,
    titulo: "Comunicação e tom de voz",
    tempo: "5 minutos",
    intro: "São as bases para definir como você se expressará de forma mais autêntica.",
    perguntas: [
      { id: "apresentacao_30s", tipo: "longa", obrig: true, p: "Escreva como você se apresentaria em 30 segundos para um possível cliente.",
        ajuda: "Escreva exatamente como você FALARIA, com suas palavras naturais." },
      { id: "expressoes", tipo: "longa", obrig: true, p: "Quais PALAVRAS e EXPRESSÕES você usa naturalmente ao falar?",
        ajuda: "Bordões, gírias regionais, frases que sempre repete. Ex.: \"Olha só...\", \"Veja bem...\", \"A real é que...\"" },
      { id: "perfis_admirados", tipo: "longa", obrig: true, p: "Cite 2 ou 3 perfis que você ADMIRA (de qualquer área).",
        ajuda: "O que especificamente te atrai na comunicação deles? E no marketing?" },
    ],
  },
  {
    n: 6,
    titulo: "Visão de futuro",
    tempo: "4 minutos",
    intro: "Definiremos para onde você quer ir. Essa seção calibra as nossas prioridades estratégicas.",
    perguntas: [
      { id: "meta_12_meses", tipo: "longa", obrig: true, p: "Onde você quer estar daqui a 12 MESES?",
        ajuda: "Seja específico: faturamento, número de clientes, reconhecimento, estilo de vida." },
      { id: "sucesso", tipo: "longa", obrig: true, p: "O que significa SUCESSO para você, além de dinheiro?",
        ajuda: "Que tipo de vida, impacto ou legado você quer construir?" },
      { id: "maior_obstaculo", tipo: "longa", obrig: true, p: "Qual é o MAIOR OBSTÁCULO entre você e esse objetivo hoje?",
        ajuda: "O que te impede de chegar lá mais rápido?" },
    ],
  },
  {
    n: 7,
    titulo: "Identidade visual: preferências estéticas",
    intro: "A construção da sua identidade visual vai muito além de estética. Ela é percepção, posicionamento e coerência com o valor que você entrega. Essa etapa é essencial para garantirmos que sua comunicação visual não seja apenas bonita, mas estratégica: alinhada ao seu público, ao seu momento de negócio e à imagem que você deseja consolidar.",
    perguntas: [
      { id: "visual_manter_evitar", tipo: "longa", obrig: true, p: "Caso já tenha elementos visuais (logo, cores etc.), o que deve ser mantido ou evitado?",
        ajuda: "Exemplo: \"Tenho um logotipo que foi criado há 3 anos, com elementos que considero importantes. Gostaria de manter...\"" },
      { id: "referencias_esteticas", tipo: "longa", obrig: true, p: "Quais marcas, perfis ou personalidades você admira esteticamente?" },
      { id: "adjetivos_visuais", tipo: "longa", obrig: true, p: "Descreva em 3 a 5 adjetivos como sua identidade visual deveria ser percebida (ex.: sofisticada, acessível, inovadora).",
        ajuda: "Exemplo: \"Humanizada (transmitindo empatia e conexão emocional), Distintiva (imediatamente reconhecível e diferenciada de outros profissionais da minha área)...\"" },
      { id: "elementos_especialidade", tipo: "longa", obrig: true, p: "Há elementos visuais que representam sua especialidade ou abordagem e que deveriam ser incorporados?",
        ajuda: "Exemplo: \"Gostaria de incorporar elementos que representem o conceito de neuroplasticidade... Prefiro evitar imagens literais de neurônios ou cérebros anatômicos (extremamente comuns na área).\"" },
    ],
  },
];

// todas as perguntas numa lista só, na ordem
export const PERGUNTAS = SECOES.flatMap((s) => s.perguntas.map((q) => ({ ...q, secao: s.n, secaoTitulo: s.titulo })));

// transforma o valor cru de uma pergunta (como o navegador manda) no texto que fica guardado
export function textoResposta(q, v) {
  if (v == null) return "";
  if (q.tipo === "escolha") {
    if (typeof v === "string") return v.trim();
    const op = String(v.opcao ?? "").trim();
    const outro = String(v.outro ?? "").trim();
    if (op === "Outro") return outro ? `Outro: ${outro}` : "Outro";
    return op;
  }
  if (q.tipo === "origem") {
    if (typeof v === "string") return v.trim();
    const partes = ORIGENS.filter((o) => String(v[o.id] ?? "").trim()).map((o) => `${o.nome}: ${String(v[o.id]).trim()}%`);
    const oq = String(v.outros_qual ?? "").trim();
    const op = String(v.outros ?? "").trim();
    if (oq || op) partes.push(`Outros${oq ? ` (${oq})` : ""}: ${op || "?"}%`);
    return partes.join(" · ");
  }
  return String(v).trim();
}
