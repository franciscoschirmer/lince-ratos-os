-- Banco do formulário de acessos (D1 `acessos-lince`).
-- `nome` fica aberto pra listar; os acessos ficam em `dados`, criptografados (AES-GCM, chave ACESSOS_CHAVE).
CREATE TABLE IF NOT EXISTS envios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em TEXT NOT NULL,
  nome TEXT NOT NULL,
  plataformas TEXT NOT NULL DEFAULT '',
  dados TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS envios_criado_em ON envios (criado_em);
