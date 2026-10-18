import { defineBoot } from '#q-app';
import { watch } from 'vue';

import { invalidarPorAviso, invalidarTodo, type ConsultasPorRecurso } from '@/core/realtime/avisos';
import { conectar, configDesdeEntorno, desconectar } from '@/core/realtime/tiempo-real';
import { consultasDeGarita } from '@/modules/garita/realtime';
import { useSessionStore } from '@/stores/session';

import { queryClient } from './vue-query';

/** Mapas de aviso → consultas de cada módulo que usa tiempo real. */
const CONSULTAS: ConsultasPorRecurso = { ...consultasDeGarita };

/** Conecta el tiempo real mientras haya sesión y condominio activo; lo cierra al cambiar de condominio o salir. */
export default defineBoot(({ store }) => {
  const session = useSessionStore(store);

  // Se compara por una clave de texto: solo reconecta si cambia algo que altera los canales
  watch(
    () =>
      [
        session.autenticado && !session.dobleFactorPendiente,
        session.condominioId,
        session.usuario?.id ?? null,
        session.tienePermiso('garita.registrar'),
      ].join('|'),
    () => {
      const condominioId = session.condominioId;
      const usuarioId = session.usuario?.id ?? null;
      if (
        !session.autenticado ||
        session.dobleFactorPendiente ||
        condominioId === null ||
        usuarioId === null
      ) {
        desconectar();
        return;
      }
      conectar(configDesdeEntorno(), {
        condominioId,
        usuarioId,
        escuchaGarita: session.tienePermiso('garita.registrar'),
        alAviso: (aviso) => {
          invalidarPorAviso(CONSULTAS, aviso, condominioId, queryClient);
        },
        // Tras una caída pudieron perderse avisos: se refresca todo lo que depende de ellos
        alRecuperar: () => {
          invalidarTodo(CONSULTAS, condominioId, queryClient);
        },
      });
    },
    { immediate: true },
  );
});
