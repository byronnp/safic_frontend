/**
 * Vista previa de pantallas que ya tienen diseño (docs/mockups) pero todavía
 * no tienen API. Se ven solo en desarrollo, con datos de ejemplo de
 * src/modules/<m>/demo. Cada perfil ve solo las que vería en producción: las del
 * permiso de su ítem de menú, o todas si es administrador / super admin
 * (puedeVerVistaPrevia en core/navigation/menu.ts). Así un residente no ve el
 * menú de la administración.
 * En producción esas rutas y sus ítems de menú quedan ocultos.
 *
 * Cuando una pantalla se conecta a la API: quitar `vistaPrevia` de su ruta y
 * de su ítem de menú, poner su permiso real y borrar su archivo demo.
 */
export const MOSTRAR_VISTAS_PREVIAS: boolean = import.meta.env.DEV;
