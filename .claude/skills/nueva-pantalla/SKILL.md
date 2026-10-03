---
name: nueva-pantalla
description: Construye una pantalla de SAFIC igual a su mockup y la conecta a la API (service, composable con Vue Query, esquema zod, ruta con permiso, menú y pruebas). Úsala al crear una pantalla o al pasar una de vista previa a datos reales.
---

# Pantalla nueva o conexión a la API (frontend)

Sigue `CLAUDE.md`. El ejemplo vivo es **Bloques**: `src/modules/unidades/{services/bloques.service.ts, composables/useBloques.ts, pages/BloquesPage.vue, components/BloqueDialog.vue}`. Cópialo, no inventes otro patrón.
Trabaja en modo plan primero: lista archivos, endpoints del contrato y pruebas, y espera el visto bueno.

## Antes de escribir código

1. **Mockup**: búscalo en `docs/mockups/README.md` y lee su `*.dc.html` (marcado = estructura y estilos exactos; `<script>` final = datos y comportamiento). La página dibuja solo el contenido de `<main>`: el menú y el encabezado los pone el layout.
2. **Contrato**: lee las operaciones en `safic_backend/docs/openapi.yaml` (rutas, campos, `x-permiso`, códigos de error). Si el endpoint no existe aún, la pantalla se queda en vista previa; no inventes la API.
3. **Campos**: revisa el documento "Campos por pantalla" (enlace en `docs/arquitectura.md`).

## Archivos (módulo `<m>`, recurso `<x>`)

1. **Service** `src/modules/<m>/services/<x>.service.ts`: tipos iguales al schema del contrato (snake_case como llega; dinero como `string` "125.50", nunca `number`); funciones que usan `api` de `@/core/api/client` y devuelven `data.data` tipado con `ApiRespuesta<T>`. El header `X-Condominio-Id` lo pone el cliente: no lo agregues.
2. **Composable** `composables/use<X>.ts`: objeto `claves<X>` cuyas claves **incluyen `session.condominioId`**; `useQuery` con `enabled` solo si hay condominio; mutaciones que invalidan su clave en `onSuccess`. Tipar el error como `ApiError`.
3. **Página** `pages/<X>Page.vue` (+ componentes en `components/`), igual al mockup: textos, tamaños, colores e íconos (`ICONOS` de `@/core/navigation/icons`; si falta un ícono, agrégalo ahí con su `sym_r_*`). Clases `safic-*` existentes antes que CSS nuevo. Tres estados obligatorios:
   - **Carga**: `:loading` en tablas o `q-skeleton`.
   - **Vacío**: ícono + frase + acción principal (si hay permiso), como en Bloques.
   - **Error**: alerta con `error.mensaje` y botón "Reintentar" (`refetch`).
4. **Formularios**: esquema `zod` con mensajes en español de Ecuador; errores de la API con `aApiError(error)` → `apiError.campo('x')` bajo cada campo y `apiError.mensaje` arriba si no es de un campo. Decidir por `apiError.codigo`, nunca por el texto.
5. **Permisos**: ruta en `src/router/routes.ts` con `meta: { permiso, titulo }` (el mismo `x-permiso` del contrato); botones de acción con `session.tienePermiso('...')`. Ocultar no es seguridad: la API lo exige igual.
6. **Menú**: ítem en `src/core/navigation/menu.ts` con `icono` de `ICONOS` (obligatorio) y el mismo permiso.
7. **Datos personales**: llegan enmascarados si el rol no tiene `residentes.ver_datos`; muéstralos tal cual.
8. **Dinero y fechas**: formatear con `Intl` en `es-EC` (USD) y fechas en la zona del condominio; no hacer aritmética con `number` sobre montos.

## Pasar una pantalla de vista previa a datos reales

- Quitar `previa(...)`/`vistaPrevia` de su ruta y de su ítem de menú, poner el `permiso` real.
- Reemplazar el import de `src/modules/<m>/demo/<x>.ts` por el composable y **borrar el archivo demo** cuando nadie más lo use.
- Revisar que los estados de carga, vacío y error existan (la versión demo no los tenía).

## Pruebas (Vitest, `__tests__/*.spec.ts` junto al código)

- Service: llama a la ruta correcta y devuelve `data.data` (mock de `api`).
- Composable o lógica pura: la clave incluye el condominio; validaciones zod.
- Reglas de la pantalla que el mockup define (cálculos, filtros, textos condicionales).

## Cerrar

- `npm run lint:check`, `npm run typecheck`, `npm test` y `npm run build` sin errores (o `make check` + `make build`).
- Pide al subagente `revisor-seguridad` que revise el diff.
- Si la pantalla cambia una decisión de arquitectura, actualiza `docs/arquitectura.md` y el documento de la fase.
