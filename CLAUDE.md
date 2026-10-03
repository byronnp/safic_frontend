# SAFIC · Frontend (Quasar) — reglas para Claude y el equipo

SAFIC = Sistema de Administración Financiera de Condominios. SaaS multi-condominio para Ecuador.
Este repositorio es **solo la SPA web** (Quasar). La API vive en `safic_backend` (`/api/v1`).
La arquitectura completa está en `docs/arquitectura.md`.

## Stack

- Quasar 2.33 · @quasar/app-vite 3.10 · Vue 3.5 · TypeScript estricto · vue-router 5 (modo history).
- Pinia 4 (estado de sesión) · TanStack Vue Query 5 (datos del servidor) · axios · zod 4 · vue-i18n 11 (es-EC).
- Íconos: **Material Symbols Rounded** (`sym_r_*`). Tipografía: Manrope. Pruebas: Vitest + happy-dom.

## Comandos

- Docker (WSL, con el backend levantado): `make up` · `make logs` · `make check` · `make fix` · `make shell`
- Sin Docker: `npm install` · `npm run dev` · `npm test` · `npm run lint:check` · `npm run typecheck` · `npm run build`

## Estructura

```
src/core/api/         Cliente HTTP (token, X-Condominio-Id, refresh single-flight), ApiError, tipos del contrato
src/core/auth/        auth.service (login, refresh, logout, me, contexto)
src/core/navigation/  icons.ts (catálogo de íconos) · menu.ts (MENU_BASE + filtrarMenu)
src/core/theme/       Colores del condominio con contraste WCAG 4.5:1
src/stores/session.ts Sesión: token en memoria, condominio activo, roles y permisos
src/router/           routes.ts (meta.permiso) · guards.ts (sesión → condominio → permiso)
src/boot/             i18n, vue-query, api (conecta el cliente con la sesión)
src/layouts/          AuthLayout (login, selector) · MainLayout (menú lateral, cambio de condominio)
src/modules/<m>/      pages · components · composables (vue-query) · services (llamadas a la API)
```

## Reglas

- **Token**: el access token vive solo en memoria. Nunca en localStorage/sessionStorage. El refresh es una cookie HttpOnly que JavaScript no toca.
- **Condominio**: el cliente HTTP agrega `X-Condominio-Id`. Las claves de Vue Query **incluyen el condominio** (`['bloques', condominioId]`) y la caché se vacía (`queryClient.clear()`) al cambiar de condominio o cerrar sesión.
- **Permisos**: cada ruta declara `meta.permiso`; los botones se ocultan con `session.tienePermiso()`. Ocultar no es seguridad: la API también lo exige.
- **Menú**: todo ítem tiene ícono de `ICONOS` (Material Symbols Rounded). Cuando exista `GET /me/menu`, reemplaza a `MENU_BASE` con el mismo formato `ItemMenu`.
- **Capas**: página → composable (useQuery/useMutation) → service (axios) → API. Las páginas no llaman a axios.
- **Errores**: todo error llega como `ApiError` (`codigo`, `mensaje`, `campo('x')`). Mostrar `mensaje`; decidir por `codigo`. Los errores 422 se pintan bajo cada campo.
- **Formularios**: validar con zod antes de enviar; mensajes en español de Ecuador, cortos y claros.
- **Apariencia**: solo `primary` y `accent` se personalizan por condominio (`useTenantTheme`). Los colores de estado son fijos.
- **Datos personales** (cédula, teléfono, correo) llegan enmascarados de la API cuando el rol no tiene `residentes.ver_datos`; no intentar "desenmascararlos".
- Código del dominio en español (`bloques`, `condominioId`); nombres técnicos de Vue/Quasar en inglés.
- No agregar paquetes sin justificarlo en el pull request.

## Módulo nuevo (receta)

1. `src/modules/<m>/services/<x>.service.ts` con los tipos del Resource del backend.
2. `composables/use<X>.ts` con claves que incluyan `session.condominioId`.
3. `pages/<X>Page.vue` y la ruta en `router/routes.ts` con `meta: { permiso, titulo }`.
4. Ítem en `core/navigation/menu.ts` con ícono de `ICONOS` y el mismo permiso.
5. Pruebas en `__tests__/*.spec.ts` y `make check` sin errores.

## Contrato con la API

- El contrato es `docs/openapi.yaml` del backend (OpenAPI 3.1). Los tipos de cada service copian su schema y la ruta usa su `x-permiso`.
- Si un endpoint no está en el contrato, la pantalla sigue en vista previa: no se inventa la API.

## Claude Code en este repo (`.claude/`)

- Skill `nueva-pantalla`: receta para una pantalla nueva o para pasar una de vista previa a datos reales.
- Subagente `revisor-seguridad`: revisa el diff antes del PR (tokens, condominio en la caché, permisos, datos personales).
- Hooks: Prettier y ESLint formatean cada archivo editado; al terminar, si hay cambios en `src/`, corren lint, tipos y pruebas y un fallo se devuelve a Claude.
- `.claude/settings.local.json` es personal y no se sube.

## Definición de terminado

Pantalla según mockup + permisos en ruta y botones + estados de carga/vacío/error + pruebas + `npm run lint:check`, `typecheck`, `test` y `build` sin errores.
