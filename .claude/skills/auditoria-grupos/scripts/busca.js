// Busca nas tarefas baixadas pelo clickup.js. Primeiro argumento: o cliente (bate no campo
// "👔 Clientes", no nome ou na descrição; "*" = todos). Os demais: palavras-chave (basta uma).
// Uso: node busca.js <tarefas.json> <cliente> [palavra ...]   (D=1 mostra a descrição)
const [arq, cli, ...kw] = process.argv.slice(2);
const t = JSON.parse(require("fs").readFileSync(arq, "utf8"));
const n = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const r = t.filter(a => (cli === "*" || n(a.cf + " " + a.nome + " " + a.desc).includes(n(cli)))
  && (!kw.length || kw.some(k => n(a.nome + " " + a.desc).includes(n(k)))));
r.forEach(a => console.log(`[${a.lista}] ${a.id} | ${a.nome.slice(0, 90)} | ${a.status} | ${a.resp} | prazo ${a.prazo} | atual ${a.atual}${a.tags ? " | tags " + a.tags : ""}${process.env.D ? " | " + a.desc.slice(0, 200) : ""}`));
console.log("--", r.length);
