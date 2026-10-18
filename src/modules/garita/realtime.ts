import type { ConsultasPorRecurso } from '@/core/realtime/avisos';

import { clavesGarita } from './composables/useGarita';
import { clavesPaquetes } from './composables/usePaquetes';
import { clavesVisitas } from './composables/useVisitas';

/** Avisos en vivo de la garita (ver AvisosEnVivoDeGarita en el backend) y las consultas que refrescan. */
export const consultasDeGarita: ConsultasPorRecurso = {
  'solicitudes-ingreso': (c) => [clavesVisitas.solicitudes(c), clavesGarita.panel(c)],
  paquetes: (c) => [clavesPaquetes.todas(c)],
  accesos: (c) => [clavesVisitas.todas(c)],
};
