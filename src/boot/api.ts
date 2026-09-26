import { defineBoot } from '#q-app';
import { Notify } from 'quasar';

import { api, configurarCliente } from '@/core/api/client';
import { useSessionStore } from '@/stores/session';

import { queryClient } from './vue-query';

/** Conecta el cliente HTTP con la sesión y el router. */
export default defineBoot(({ router, store }) => {
  const session = useSessionStore(store);

  configurarCliente(api, {
    obtenerToken: () => session.accessToken,
    obtenerCondominioId: () => session.condominioId,
    refrescar: () => session.refrescar(),
    alExpirar: () => {
      session.limpiar();
      queryClient.clear();
      Notify.create({ type: 'warning', message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
      const actual = router.currentRoute.value;
      if (actual.name !== 'login') {
        void router.replace({ name: 'login', query: { redirect: actual.fullPath } });
      }
    },
  });
});
