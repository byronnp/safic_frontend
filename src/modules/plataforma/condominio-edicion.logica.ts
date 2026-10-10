/** Motivo obligatorio al inactivar o reactivar un condominio (mínimo 3 caracteres). */
export function validarMotivo(motivo: string): string | undefined {
  const m = motivo.trim();
  if (m === '') return 'Escribe el motivo.';
  return m.length < 3 ? 'El motivo es muy corto.' : undefined;
}
