#!/bin/sh
# Arranca Cromanenos en Linux e abre o navegador.
# Uso: ./iniciar.sh [porto]
cd "$(dirname "$0")" || exit 1
AQUI="$(pwd -P)"
PORTO="${1:-8765}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Fai falta python3 para arrancar Cromanenos." >&2
  exit 1
fi

# Lanzador "Cromanenos" coa icona, neste mesmo cartafol. Refaise en cada
# arranque para que siga valendo se se move o cartafol.
cat > Cromanenos.desktop 2>/dev/null <<EOF
[Desktop Entry]
Type=Application
Name=Cromanenos
Comment=Editor de vídeo para primaria
Comment[es]=Editor de vídeo para primaria
Comment[en]=Video editor for primary school
Exec="$AQUI/iniciar.sh"
Icon=$AQUI/icons/logo.png
Terminal=true
Categories=AudioVideo;Education;
EOF
chmod +x Cromanenos.desktop 2>/dev/null

echo "Cromanenos en marcha en http://localhost:$PORTO/"
echo "Non peches esta xanela mentres o uses. Para parar: Ctrl+C."
# CROMANENOS_SEN_NAVEGADOR=1 arranca sen abrir o navegador.
if [ -z "$CROMANENOS_SEN_NAVEGADOR" ]; then
  ( sleep 1; xdg-open "http://localhost:$PORTO/" >/dev/null 2>&1 ) &
fi
exec python3 tools/serve.py "$PORTO"
