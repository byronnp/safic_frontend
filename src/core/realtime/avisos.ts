import type { QueryClient, QueryKey } from '@tanstack/vue-query';

import type { AvisoEnVivo } from './tiempo-real';

/**
 * Qué consultas hay que refrescar cuando el backend avisa que un recurso cambió. Cada módulo declara las suyas
 * (todas las claves incluyen el condominio activo) y el boot `tiempo-real` junta los mapas.
 * Un recurso desconocido se ignora: el backend puede publicar avisos que esta versión de la app aún no usa.
 */
export type ConsultasPorRecurso = Record<string, (condominioId: number) => QueryKey[]>;

export function invalidarPorAviso(
  consultas: ConsultasPorRecurso,
  aviso: AvisoEnVivo,
  condominioId: number,
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
): void {
  for (const queryKey of consultas[aviso.recurso]?.(condominioId) ?? []) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/** Tras una caída de la conexión pudieron perderse avisos: se refresca todo lo que depende de ellos. */
export function invalidarTodo(
  consultas: ConsultasPorRecurso,
  condominioId: number,
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
): void {
  for (const recurso of Object.keys(consultas)) {
    invalidarPorAviso(consultas, { recurso, id: null }, condominioId, queryClient);
  }
}
