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
| F1NuevaUnidad.dc.html | Admin · Nueva unidad (página) | `/unidades/nueva` | modules/unidades/pages/NuevaUnidadPage.vue |
| UnidadDetalle.dc.html | Admin · Detalle de unidad | `/unidades/:codigo` | modules/unidades/pages/UnidadDetallePage.vue |
| F1Apariencia.dc.html | Admin · Datos del condominio (Apariencia) | `/configuracion/condominio` | modules/configuracion/pages/DatosCondominioPage.vue |
| F1CobroCuotas.dc.html | Admin · Configuración › Cobro de cuotas | `/configuracion/cobro` | modules/configuracion/pages/CobroCuotasPage.vue |
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

### Agregados el 9-oct-2026

Pantallas que pedían los documentos de arquitectura y no tenían mockup. Las rutas y archivos de las que aún no existen son propuestas: se confirman al construirlas.

| Mockup | Pantalla | Ruta | Archivo |
| --- | --- | --- | --- |
| AuthRecuperar.dc.html | Recuperar contraseña (4 pasos) | `/recuperar` | modules/auth/pages/RecuperarPage.vue |
| AuthInvitacion.dc.html | Aceptar invitación (aviso LOPDP) | `/invitacion/:token` | modules/auth/pages/InvitacionPage.vue |
| AuthSelector.dc.html | Elegir condominio | `/condominios` | modules/auth/pages/SeleccionarCondominioPage.vue |
| F1ContadorAcceso.dc.html | Contador · Primer ingreso: 2FA y acuerdo de confidencialidad | `/contador/acceso` | modules/auth/pages/ContadorAccesoPage.vue |
| F1MisDispositivos.dc.html | Todos · Seguridad de mi cuenta y dispositivos | `/perfil/seguridad` | modules/perfil/pages/SeguridadPage.vue |
| F1SinPermiso.dc.html | Todos · Sin permiso / módulo no incluido en el plan | `/sin-permiso` | pages/SinPermisoPage.vue |
| F1Inicio.dc.html | Admin · Inicio | `/` | modules/inicio/pages/InicioPage.vue |
| F1Bloques.dc.html | Admin · Bloques | `/unidades/bloques` | modules/unidades/pages/BloquesPage.vue |
| F1Importar.dc.html | Admin · Importar Excel (vista previa) | `/unidades/importar` | modules/unidades/pages/ImportarPage.vue |
| F1Persona.dc.html | Admin · Ficha de persona | `/personas/:id` | modules/unidades/pages/PersonaPage.vue |
| F1Registros.dc.html | Admin · Registros de errores | `/configuracion/registros` | modules/configuracion/pages/RegistrosPage.vue |
| F2Cuotas.dc.html | Admin · Cuotas del mes | `/finanzas/cuotas` | modules/finanzas/pages/CuotasPage.vue |
| F2EstadoCuenta.dc.html | Admin · Detalle de unidad › Estado de cuenta | `/unidades/:id/estado-cuenta` | modules/unidades/pages/UnidadDetallePage.vue (pestaña) |
| F2Aprobaciones.dc.html | Presidente · Aprobaciones pendientes (nivel 2) | `/finanzas/aprobaciones` | modules/finanzas/pages/AprobacionesPage.vue |
| F2Proveedores.dc.html | Admin · Proveedores | `/finanzas/proveedores` | modules/finanzas/pages/ProveedoresPage.vue |
| F2Recurrentes.dc.html | Admin · Gastos recurrentes | `/finanzas/recurrentes` | modules/finanzas/pages/GastosRecurrentesPage.vue |
| F2CajaChica.dc.html | Admin · Caja chica | `/finanzas/caja-chica` | modules/finanzas/pages/CajaChicaPage.vue |
| F2Morosidad.dc.html | Admin · Morosidad | `/finanzas/morosidad` | modules/finanzas/pages/MorosidadPage.vue |
| F2CierreMes.dc.html | Admin · Cierre de mes | `/finanzas/cierre` | modules/finanzas/pages/CierreMesPage.vue |
| F2Reportes.dc.html | Admin y contador · Reportes | `/finanzas/reportes` | modules/finanzas/pages/ReportesPage.vue |
| F4Bitacora.dc.html | Admin · Bitácora de garita | `/comunicacion/bitacora` | modules/comunicacion/pages/BitacoraPage.vue |
| F5Constancia.dc.html | Admin · Constancia de convocatoria y poderes | `/asambleas/constancia` | modules/asambleas/pages/ConstanciaPage.vue |
| F5RegistroMesa.dc.html | Secretario · Registro en mesa | `/asambleas/registro-mesa` | modules/asambleas/pages/RegistroMesaPage.vue |
| F1PlataformaRegistros.dc.html | Super admin · Registros del sistema | `/plataforma/registros` | modules/plataforma/pages/RegistrosSistemaPage.vue |
| F1EditarCondominio.dc.html | Super admin · Editar condominio (datos, ubicación, plan y unidades, administrador, estado) | `/plataforma/condominios/:id/editar` | modules/plataforma/pages/EditarCondominioPage.vue |
| F1PlataformaSolicitudes.dc.html | Super admin · Solicitudes de rol | `/plataforma/solicitudes-rol` | modules/plataforma/pages/SolicitudesRolPage.vue |
| F6Reportes.dc.html | Super admin y contador de plataforma · Reportes contables | `/plataforma/reportes` | modules/plataforma/pages/ReportesContablesPage.vue |
| F3Areas.dc.html | Residente · Áreas comunes | `/app/areas` | modules/app-residente/pages/AreasPage.vue |
| F3MisReservas.dc.html | Residente · Mis reservas | `/app/reservas` | modules/app-residente/pages/MisReservasPage.vue |
| F4MisVisitas.dc.html | Residente · Mis visitas | `/app/visitas` | modules/app-residente/pages/MisVisitasPage.vue |
| F4Avisos.dc.html | Residente · Avisos (visita no anunciada) | `/app/avisos` | modules/app-residente/pages/AvisosPage.vue |
| F4MisIncidencias.dc.html | Residente · Incidencias | `/app/incidencias` | modules/app-residente/pages/IncidenciasPage.vue |
| F5Poder.dc.html | Propietario · Dar un poder | `/app/asambleas/poder` | modules/app-residente/pages/PoderPage.vue |
| F5MisAsambleas.dc.html | Propietario · Mis asambleas | `/app/asambleas` | modules/app-residente/pages/MisAsambleasPage.vue |
| F4Paquetes.dc.html | Guardia · Paquetes | `/guardia/paquetes` | modules/app-guardia/pages/PaquetesPage.vue |

**Valores supuestos que falta confirmar:** el enlace de recuperación vence en 60 min; contraseña de al menos 10 caracteres con una mayúscula y un número; recargo del 1 % mensual con 5 días de gracia; restricción de áreas comunes desde 3 meses de deuda (decisión abierta en Fase 3); el contador activa el 2FA (de su cuenta) antes de aceptar el acuerdo (de cada condominio). El menú lateral de los mockups nuevos suma Inicio, Bloques, Morosidad, Aprobaciones, Cierre de mes y Registros de errores; el menú real lo define el super admin.

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
