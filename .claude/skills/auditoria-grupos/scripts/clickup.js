// Puxa do ClickUp, pela API com o token pessoal do .env (CLICKUP_API_TOKEN), as tarefas
// atualizadas desde uma data nas listas onde as demandas de cliente moram. Não gasta o limite
// diário do conector. O Node daqui só sai pra internet via curl, por isso o curl.
// Uso (rodar na raiz do sistema): node clickup.js <AAAA-MM-DD desde> <arquivo-saida.json>
const fs = require("fs"), cp = require("child_process");
const [desde, saida] = process.argv.slice(2);
const T = (fs.readFileSync(".env", "utf8").match(/CLICKUP_API_TOKEN=(\S+)/) || [])[1];
if (!T) { console.error("Sem CLICKUP_API_TOKEN no .env da raiz."); process.exit(1); }
const LISTAS = {
  "901325858184": "Calendário", "901325858360": "Design", "901325858404": "Campanhas",
  "901327580596": "Comercial", "901325858687": "LPs", "901325858469": "Onboarding",
  "901325858557": "Rituais", "901325858486": "HealthScore"
};
const get = url => JSON.parse(cp.execFileSync("curl", ["-s", "-H", "Authorization: " + T, url], { maxBuffer: 1e8 }).toString());
const since = Date.parse(desde + "T00:00:00-03:00");
const iso = ms => ms ? new Date(+ms).toISOString().slice(0, 10) : "";
const out = []; let chamadas = 0;
for (const [id, nome] of Object.entries(LISTAS)) {
  for (let p = 0; p < 30; p++) {
    const j = get(`https://api.clickup.com/api/v2/list/${id}/task?include_closed=true&subtasks=true&date_updated_gt=${since}&page=${p}`); chamadas++;
    if (!j.tasks) { console.error(nome, JSON.stringify(j)); break; }
    for (const t of j.tasks) {
      const cf = (t.custom_fields || []).filter(f => f.value !== undefined && f.value !== null && f.value !== "").map(f => {
        let v = f.value;
        if (f.type === "drop_down") { const o = (f.type_config.options || []).find(o => o.id === v || o.orderindex === v); v = o ? o.name : v; }
        else if (f.type === "labels") v = (v || []).map(x => { const o = (f.type_config.options || []).find(o => o.id === x); return o ? o.label : x; }).join("/");
        else if (typeof v === "object") v = JSON.stringify(v).slice(0, 40);
        return f.name + "=" + String(v).slice(0, 40);
      });
      out.push({ lista: nome, id: t.id, nome: t.name, status: t.status.status, resp: t.assignees.map(a => a.username.split(" ")[0]).join(","),
        prazo: iso(t.due_date), criada: iso(t.date_created), atual: iso(t.date_updated), pai: t.parent || "",
        tags: t.tags.map(x => x.name).join(","), cf: cf.join("; "), desc: (t.text_content || "").replace(/\s+/g, " ").slice(0, 300) });
    }
    if (j.tasks.length < 100) break;
  }
}
fs.writeFileSync(saida, JSON.stringify(out));
const c = {}; out.forEach(t => c[t.lista] = (c[t.lista] || 0) + 1);
console.log(`chamadas: ${chamadas} · tarefas: ${out.length} · ${JSON.stringify(c)}`);
