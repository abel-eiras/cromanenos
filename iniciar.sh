#!/bin/sh
# Arranca Cromanenos en Linux e abre o navegador.
# Uso: ./iniciar.sh [porto]
cd "$(dirname "$0")" || exit 1
PORTO="${1:-8765}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Fai falta python3 para arrancar Cromanenos." >&2
  exit 1
fi

echo "Cromanenos en marcha en http://localhost:$PORTO/"
echo "Non peches esta xanela mentres o uses. Para parar: Ctrl+C."
( sleep 1; xdg-open "http://localhost:$PORTO/" >/dev/null 2>&1 ) &
exec python3 tools/serve.py "$PORTO"
