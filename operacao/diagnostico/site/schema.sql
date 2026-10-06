-- Banco do diagnóstico (D1 `diagnostico-lince`).
-- Nada aqui se apaga: o painel só arquiva (arquivado_em). `bruto` guarda o envio exatamente como chegou
-- do navegador; `respostas` é a versão organizada, com o texto de cada pergunta junto da resposta.
CREATE TABLE IF NOT EXISTS diagnosticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocolo TEXT NOT NULL UNIQUE,
  criado_em TEXT NOT NULL,
  nome TEXT NOT NULL,
  respostas TEXT NOT NULL,
  bruto TEXT NOT NULL,
  suspeito INTEGER NOT NULL DEFAULT 0,
  arquivado_em TEXT,
  copia_status TEXT NOT NULL DEFAULT 'pendente',
  copia_em TEXT
);
CREATE INDEX IF NOT EXISTS diagnosticos_criado_em ON diagnosticos (criado_em);

-- trava no próprio banco: DELETE é recusado, venha de onde vier (painel, código, comando)
CREATE TRIGGER IF NOT EXISTS diagnosticos_nunca_apagar
BEFORE DELETE ON diagnosticos
BEGIN
  SELECT RAISE(ABORT, 'diagnóstico não se apaga: use arquivar');
END;
