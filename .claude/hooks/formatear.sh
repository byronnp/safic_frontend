#!/usr/bin/env bash
# PostToolUse (Edit/Write): formatea con Prettier y ESLint --fix el archivo que Claude acaba de editar.
# Usa node_modules local si existe; si no, el contenedor "web". Si no hay ninguno, no hace nada.
set -uo pipefail

entrada=$(cat)
archivo=$(printf '%s' "$entrada" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')

proyecto="${CLAUDE_PROJECT_DIR:-$(pwd)}"
relativo="${archivo#"$proyecto"/}"
[[ -n "$archivo" && "$relativo" != /* && -f "$proyecto/$relativo" ]] || exit 0
cd "$proyecto" || exit 0

case "$relativo" in
  *.ts | *.js | *.vue | *.scss | *.css | *.html | *.json | *.md) ;;
  *) exit 0 ;;
esac

if [[ -x node_modules/.bin/prettier ]]; then
  correr() { "$@"; }
elif docker compose ps --status running --services 2>/dev/null | grep -qx web; then
  correr() { docker compose exec -T web "$@"; }
else
  exit 0
fi

correr npx prettier --write --log-level silent "$relativo" >/dev/null 2>&1 || true
if [[ "$relativo" == src/* && "$relativo" =~ \.(ts|js|vue)$ ]]; then
  correr npx eslint --fix -c ./eslint.config.js "$relativo" >/dev/null 2>&1 || true
fi
exit 0
