#!/usr/bin/env bash
# Testa credenciais do DataForSEO fazendo uma chamada ao endpoint user_data.
# Não custa nada (é endpoint de conta, não de query).
#
# Uso:
#   ./scripts/test-credentials.sh
#
# Ordem de leitura das credenciais:
#   1. Variáveis de ambiente $DATAFORSEO_LOGIN / $DATAFORSEO_PASSWORD
#   2. ./.env no diretório atual
#   3. ~/.config/triagem-youtube-ratos/.env
#   4. ~/.mcp-credentials/dataforseo.env

set -e

# Tenta carregar de arquivo se env vars não estão setadas
if [ -z "$DATAFORSEO_LOGIN" ] || [ -z "$DATAFORSEO_PASSWORD" ]; then
  for f in "./.env" "$HOME/.config/triagem-youtube-ratos/.env" "$HOME/.mcp-credentials/dataforseo.env"; do
    if [ -f "$f" ]; then
      set -a
      # shellcheck disable=SC1090
      source "$f"
      set +a
      break
    fi
  done
fi

if [ -z "$DATAFORSEO_LOGIN" ] || [ -z "$DATAFORSEO_PASSWORD" ]; then
  echo "Erro: DATAFORSEO_LOGIN e DATAFORSEO_PASSWORD não encontrados."
  echo ""
  echo "Seta as variáveis de ambiente ou cria um .env em uma dessas localizações:"
  echo "  ./.env"
  echo "  ~/.config/triagem-youtube-ratos/.env"
  exit 1
fi

echo "Testando credenciais do DataForSEO..."
RESPONSE=$(curl -s -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
  "https://api.dataforseo.com/v3/appendix/user_data")

STATUS=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status_code', 'unknown'))" 2>/dev/null || echo "parse_error")

if [ "$STATUS" = "20000" ]; then
  BALANCE=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tasks'][0]['result'][0]['money']['balance'])" 2>/dev/null || echo "?")
  echo "OK — credenciais válidas."
  echo "Saldo disponível: \$$BALANCE USD"
  exit 0
else
  ERROR=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status_message', d))" 2>/dev/null || echo "$RESPONSE")
  echo "Erro ao validar credenciais."
  echo "Status: $STATUS"
  echo "Mensagem: $ERROR"
  exit 1
fi
