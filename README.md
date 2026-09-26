# SAFIC · Frontend

Aplicación web de **SAFIC — Sistema de Administración Financiera de Condominios**. Quasar 2 · Vue 3 · TypeScript · Docker.

Este esqueleto corresponde al **Sprint 0 (base técnica)**:

- Login con JWT: access token en memoria y refresh token en cookie HttpOnly; al recargar la página la sesión se recupera sola.
- Renovación automática del token ante un 401 (una sola vez aunque fallen varias peticiones a la vez).
- Selector y cambio de condominio (`X-Condominio-Id`), con la caché de datos separada por condominio.
- Menú lateral con íconos Material Symbols Rounded, filtrado por los permisos del condominio activo.
- Colores por condominio con ajuste automático de contraste (WCAG 4.5:1).
- Primera pantalla de negocio: **Bloques** (listar, buscar y crear), conectada a la API.
- Pruebas (Vitest), lint (ESLint + Prettier), verificación de tipos y CI en GitHub Actions.

## Requisitos

- WSL 2 (Ubuntu) y Docker Desktop con integración WSL, igual que el backend.
- El backend levantado (`make up` en `safic_backend`): crea la red `safic` y el servicio `api`.

## Primer arranque

```bash
cd ~/proyectos
git clone https://github.com/byronnp/safic_frontend.git safic_front
cd safic_front
make up        # la primera vez instala dependencias dentro del contenedor (ver: make logs)
```

Abre http://localhost:9000 e ingresa con un usuario de demostración del backend (contraseña `Safic2026!`):

| Correo                    | Qué verás                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| maria@jardinesdelvalle.ec | Dos condominios: selector, cambio de condominio y bloques (puede crear) |
| diego@correo.ec           | Residente: sin acceso a Bloques                                         |

> El contenedor corre con el usuario `node` (UID 1000). Si tu usuario de WSL tiene otro UID (`id -u`), avísame y lo parametrizamos.

## Sin Docker

```bash
npm install
API_PROXY_TARGET=http://localhost:8000 npm run dev
```

## Cómo se conecta con la API

El navegador siempre llama a `/api/v1` en el mismo dominio del frontend:

- **Desarrollo**: el servidor de Vite reenvía `/api` a `API_PROXY_TARGET` (`http://api:8080` en Docker).
- **Producción**: nginx sirve la SPA y reenvía `/api` a `API_UPSTREAM`. Probar localmente: `docker compose --profile prod up --build web-prod` → http://localhost:8081

Así la cookie del refresh token (`SameSite=Strict`, ruta `/api/v1/auth`) funciona sin configurar CORS.

## Comandos

| Comando                 | Qué hace                                                |
| ----------------------- | ------------------------------------------------------- |
| `make up` / `make down` | Levanta o detiene el frontend                           |
| `make logs`             | Ver el servidor de desarrollo                           |
| `make check`            | Lint + tipos + pruebas (lo mismo que CI)                |
| `make fix`              | Formatea y corrige lint                                 |
| `make build`            | Compila la SPA en `dist/spa`                            |
| `make install`          | Reinstala dependencias tras cambiar `package-lock.json` |

## Arquitectura

Reglas para el equipo y para Claude en [`CLAUDE.md`](CLAUDE.md). Documentos completos en [`docs/arquitectura.md`](docs/arquitectura.md).
