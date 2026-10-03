#!/usr/bin/env bash
# Stop: antes de dar la tarea por terminada, si hay cambios en src/ corre lint, tipos y pruebas
# (local si hay node_modules; si no, en el contenedor "web"). Si algo falla, devuelve el error
# a Claude (exit 2) para que lo corrija. Solo actúa una vez por turno (stop_hook_active).
set -uo pipefail

entrada=$(cat)
if printf '%s' "$entrada" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

cambios=$(git status --porcelain --untracked-files=all -- src 2>/dev/null || true)
[[ -n "$cambios" ]] || exit 0

if [[ -d node_modules ]]; then
  correr() { "$@"; }
elif docker compose ps --status running --services 2>/dev/null | grep -qx web; then
  correr() { docker compose exec -T web "$@"; }
else
  echo "Hay cambios en src/ pero no hay node_modules ni contenedor web: corre 'make up' y luego 'make check'." >&2
  exit 0
fi

ejecutar() {
  local salida
  if ! salida=$(correr "$@" 2>&1); then
    printf 'Falló: %s\n%s\n' "$*" "$(printf '%s' "$salida" | tail -n 40)" >&2
    exit 2
  fi
}

ejecutar npm run --silent lint:check
ejecutar npm run --silent typecheck
ejecutar npm test --silent
exit 0
