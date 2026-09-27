/** Nombre visible de cada rol (los códigos vienen de App\Core\Permissions\Rol). */
const ETIQUETAS: Record<string, string> = {
  super_admin: 'Super admin',
  soporte: 'Soporte',
  cobranza: 'Cobranza',
  contador_plataforma: 'Contador de plataforma',
  administrador: 'Administración',
  presidente: 'Presidencia',
  vicepresidente: 'Vicepresidencia',
  secretario: 'Secretaría',
  tesorero: 'Tesorería',
  contador: 'Contador',
  guardia: 'Guardia',
  mantenimiento: 'Mantenimiento',
  residente: 'Residente',
};

/** Orden de importancia para mostrar un solo rol en el encabezado. */
const PRIORIDAD = Object.keys(ETIQUETAS);

/** El rol más relevante del usuario en el condominio activo, listo para mostrar. */
export function etiquetaRol(roles: readonly string[]): string {
  const principal = [...roles].sort((a, b) => {
    const ia = PRIORIDAD.indexOf(a);
    const ib = PRIORIDAD.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  })[0];
  return principal ? (ETIQUETAS[principal] ?? principal) : '';
}
