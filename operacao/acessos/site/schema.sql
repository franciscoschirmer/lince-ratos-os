-- Banco do formulário de acessos (D1 `acessos-lince`).
-- `nome` fica aberto pra listar; os acessos ficam em `dados`, criptografados (AES-GCM, chave ACESSOS_CHAVE).
-- Nada aqui se apaga: o painel só arquiva (arquivado_em).
CREATE TABLE IF NOT EXISTS envios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em TEXT NOT NULL,
  nome TEXT NOT NULL,
  plataformas TEXT NOT NULL DEFAULT '',
  dados TEXT NOT NULL,
  suspeito INTEGER NOT NULL DEFAULT 0,
  arquivado_em TEXT
);
CREATE INDEX IF NOT EXISTS envios_criado_em ON envios (criado_em);

-- trava no próprio banco: DELETE é recusado, venha de onde vier (painel, código, comando)
CREATE TRIGGER IF NOT EXISTS envios_nunca_apagar
BEFORE DELETE ON envios
BEGIN
  SELECT RAISE(ABORT, 'envio de acessos não se apaga: use arquivar');
END;

-- banco que já existia antes de 2026-10-06 (rodar uma vez só; o CREATE TABLE acima já traz as colunas):
--   ALTER TABLE envios ADD COLUMN suspeito INTEGER NOT NULL DEFAULT 0;
--   ALTER TABLE envios ADD COLUMN arquivado_em TEXT;
