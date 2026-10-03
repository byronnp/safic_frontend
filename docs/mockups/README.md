# Mockups de SAFIC

Copia de los diseños aprobados (archivo **SAFIC — Pantallas**). Cada `*.dc.html` es una
pantalla: el marcado muestra la estructura y los estilos exactos, y el `<script>` del
final tiene los datos de ejemplo y el comportamiento interactivo. No se abren directo
en el navegador (usan el runtime del editor de diseño); se leen como referencia.

Toda pantalla nueva del frontend se construye **igual al mockup**: mismos textos,
tamaños, colores, espaciados e íconos (Material Symbols Rounded, `sym_r_<nombre>`).

| Mockup | Pantalla | Ruta | Archivo |
| --- | --- | --- | --- |
| Login.dc.html | Iniciar sesión | `/login` | modules/auth/pages/LoginPage.vue |
| Main.dc.html | Admin · Unidades | `/unidades` | modules/unidades/pages/UnidadesPage.vue |
| F1NuevaUnidad.dc.html | Admin · Nueva unidad (panel lateral) | `/unidades` (panel) | modules/unidades/components/UnidadPanel.vue (pendiente, S2) |
| UnidadDetalle.dc.html | Admin · Detalle de unidad | `/unidades/:codigo` | modules/unidades/pages/UnidadDetallePage.vue |
| F1Apariencia.dc.html | Admin · Datos del condominio (Apariencia) | `/configuracion/condominio` | modules/configuracion/pages/DatosCondominioPage.vue |
| F1CobroCuotas.dc.html | Admin · Configuración › Cobro de cuotas | `/configuracion/cobro` | modules/configuracion/pages/CobroCuotasPage.vue (pendiente, S2) |
| F1AmenidadesCondominio.dc.html | Admin · Amenidades | `/configuracion/amenidades` | modules/configuracion/pages/AmenidadesPage.vue |
| F1Usuarios.dc.html | Admin · Usuarios, cupo y bitácora | `/configuracion/usuarios` | modules/configuracion/pages/UsuariosPage.vue |
| F1RolesCondominio.dc.html | Admin · Roles del condominio | `/configuracion/roles` | modules/configuracion/pages/RolesPage.vue |
| F6MiSuscripcion.dc.html | Admin · Mi suscripción | `/configuracion/suscripcion` | modules/configuracion/pages/SuscripcionPage.vue |
| F2Resumen.dc.html | Admin · Resumen financiero | `/finanzas` | modules/finanzas/pages/ResumenPage.vue |
| F2PagosPorAprobar.dc.html | Admin · Pagos por aprobar | `/finanzas/pagos-por-aprobar` | modules/finanzas/pages/PagosPorAprobarPage.vue |
| F2Conciliacion.dc.html | Admin · Conciliación bancaria | `/finanzas/conciliacion` | modules/finanzas/pages/ConciliacionPage.vue |
| F2CuentasPorPagar.dc.html | Admin · Cuentas por pagar | `/finanzas/cuentas-por-pagar` | modules/finanzas/pages/CuentasPorPagarPage.vue |
| F2PagoProveedor.dc.html | Tesorero · Registrar pago a proveedor | `/finanzas/cuentas-por-pagar/:id/pago` | modules/finanzas/pages/PagoProveedorPage.vue |
| F3Agenda.dc.html | Admin · Agenda de reservas | `/areas-comunes/agenda` | modules/reservas/pages/AgendaPage.vue |
| F3ConfigArea.dc.html | Admin · Configurar área | `/areas-comunes/areas` | modules/reservas/pages/AreasPage.vue |
| F4Anuncios.dc.html | Admin · Anuncios | `/comunicacion/anuncios` | modules/comunicacion/pages/AnunciosPage.vue |
| F4Tickets.dc.html | Admin · Incidencias | `/comunicacion/incidencias` | modules/comunicacion/pages/IncidenciasPage.vue |
| F5Preparar.dc.html | Admin · Preparar asamblea | `/asambleas/preparar` | modules/asambleas/pages/PrepararAsambleaPage.vue |
| F5Mesa.dc.html | Presidente · Mesa de la asamblea | `/asambleas/mesa` | modules/asambleas/pages/MesaAsambleaPage.vue |
| Platform.dc.html | Super admin · Condominios | `/plataforma/condominios` | modules/plataforma/pages/CondominiosPage.vue |
| F1Asistente.dc.html | Super admin · Nuevo condominio (5 pasos, incluye cobro de cuotas) | `/plataforma/condominios/nuevo` | modules/plataforma/pages/NuevoCondominioPage.vue |
| F1CatalogoAmenidades.dc.html | Super admin · Catálogo de amenidades | `/plataforma/amenidades` | modules/plataforma/pages/CatalogoAmenidadesPage.vue |
| F1PlataformaRoles.dc.html | Super admin · Roles y permisos | `/plataforma/roles` | modules/plataforma/pages/RolesPermisosPage.vue |
| F1PlataformaMenu.dc.html | Super admin · Menú del sistema | `/plataforma/menu` | modules/plataforma/pages/MenuSistemaPage.vue |
| F6Cobranza.dc.html | Super admin · Cobranza | `/plataforma/cobranza` | modules/plataforma/pages/CobranzaPage.vue |
| F6CuentaCondominio.dc.html | Super admin · Cuenta del condominio | `/plataforma/condominios/:id/cuenta` | modules/plataforma/pages/CuentaCondominioPage.vue |
| F6Planes.dc.html | Super admin · Planes y módulos | `/plataforma/planes` | modules/plataforma/pages/PlanesPage.vue |
| F6Configuracion.dc.html | Super admin · Configuración de cobro | `/plataforma/configuracion` | modules/plataforma/pages/ConfiguracionCobroPage.vue |
| Residente.dc.html | Residente · Mi hogar | `/app/mi-hogar` | modules/app-residente/pages/MiHogarPage.vue |
| F2MiCuenta.dc.html | Residente · Mi cuenta | `/app/mi-cuenta` | modules/app-residente/pages/MiCuentaPage.vue |
| F2Pagar.dc.html | Residente · Pagar por transferencia | `/app/pagar` | modules/app-residente/pages/PagarPage.vue |
| F3Reservar.dc.html | Residente · Reservar | `/app/reservar` | modules/app-residente/pages/ReservarPage.vue |
| F4NuevaVisita.dc.html | Residente · Nueva visita | `/app/visitas/nueva` | modules/app-residente/pages/NuevaVisitaPage.vue |
| F5Votar.dc.html | Propietario · Asamblea en vivo | `/app/asamblea` | modules/app-residente/pages/VotarPage.vue |
| F4Garita.dc.html | Guardia · Garita | `/guardia/garita` | modules/app-guardia/pages/GaritaPage.vue |
| Guardia.dc.html | Guardia · Directorio | `/guardia/directorio` | modules/app-guardia/pages/DirectorioPage.vue |
| F3GuardiaHoy.dc.html | Guardia · Reservas de hoy | `/guardia/reservas-hoy` | modules/app-guardia/pages/ReservasHoyPage.vue |

## Menú y layouts

Los mockups repiten el menú lateral en cada pantalla; en el código el menú es uno solo:

- `layouts/MainLayout.vue` + `core/navigation/menu.ts` (`MENU_BASE`): administración del condominio.
- `layouts/PlataformaLayout.vue` (`MENU_PLATAFORMA`): super admin, menú negro.
- `layouts/AppLayout.vue` (`MENU_APP_RESIDENTE`, `MENU_APP_GUARDIA`): app móvil con pestañas abajo.

Por eso una página **no** dibuja el menú lateral ni el encabezado blanco del mockup: solo el
contenido de `<main>` (o, en la app móvil, todo menos la barra de pestañas).

## Vista previa

Las pantallas que aún no tienen API se ven en desarrollo con datos de ejemplo
(`src/modules/<m>/demo/`), marcadas con `vistaPrevia` en su ruta y en el menú (ver
`src/core/vista-previa.ts`). En producción no aparecen.
