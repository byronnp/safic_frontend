<template>
  <!--
    Apps del residente y del guardia. En el celular ocupan toda la pantalla con las pestañas abajo. En una pantalla grande (desde
    1024px) usan el mismo marco web que el resto de los perfiles: encabezado con el condominio y la cuenta, y las pantallas del
    perfil en el menú lateral.
    Cada página pinta su propio encabezado (ver components/app).
    Las páginas NO usan q-page: su raíz es <div class="app-pagina">.
  -->
  <MarcoWeb v-if="modoWeb" :menu="menuLateral">
    <div class="app-web">
      <router-view :key="session.condominioId ?? 0" />
    </div>
    <!-- «Alguien está en la garita»: se muestra sobre cualquier pantalla del residente -->
    <AlertaVisita />
  </MarcoWeb>

  <div v-else class="app">
    <div class="app__marco">
      <main class="app__contenido">
        <router-view />
      </main>

      <nav v-if="pestanas.length" aria-label="Navegación" class="app__pestanas">
        <router-link
          v-for="pestana in pestanas"
          :key="pestana.id"
          #default="{ href, navigate }"
          :to="{ name: pestana.ruta }"
          custom
        >
          <a
            :href="href"
            class="app__pestana"
            :class="{ 'app__pestana--activa': esActual(pestana.ruta) }"
            :aria-current="esActual(pestana.ruta) ? 'page' : undefined"
            @click="navigate"
          >
            <q-icon :name="pestana.icono" size="24px" class="app__pestana-icono" />
            {{ pestana.etiqueta }}
          </a>
        </router-link>
      </nav>
    </div>

    <!-- «Alguien está en la garita»: se muestra sobre cualquier pantalla del residente -->
    <AlertaVisita />

    <VistaPreviaAviso salir />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import VistaPreviaAviso from '@/components/VistaPreviaAviso.vue';
import MarcoWeb from '@/layouts/components/MarcoWeb.vue';
import AlertaVisita from '@/modules/garita/components/AlertaVisita.vue';
import {
  filtrarMenu,
  MENU_APP_GUARDIA,
  MENU_APP_RESIDENTE,
  ROL_ACCESO_TOTAL_CONDOMINIO,
} from '@/core/navigation/menu';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

const $q = useQuasar();
const route = useRoute();
const session = useSessionStore();

/** Pantalla grande: marco web con menú lateral. En el celular: columna con pestañas abajo. */
const modoWeb = computed(() => $q.screen.gt.sm);

const menuApp = computed(() =>
  route.meta.app === 'guardia' ? MENU_APP_GUARDIA : MENU_APP_RESIDENTE,
);

/**
 * Las pantallas del perfil en el menú lateral (siempre, aunque la pantalla pida ocultar las pestañas). Las vistas previas solo las ve
 * el administrador en desarrollo: es lo que la guarda le permite abrir; a un residente le llevarían a «sin permiso».
 */
const menuLateral = computed(() =>
  filtrarMenu(menuApp.value, session.permisos, {
    vistasPrevias: MOSTRAR_VISTAS_PREVIAS && session.roles.includes(ROL_ACCESO_TOTAL_CONDOMINIO),
  }),
);

const pestanas = computed(() => {
  if (route.meta.sinPestanas) {
    return [];
  }
  return menuLateral.value;
});

function esActual(ruta: string | undefined): boolean {
  return ruta !== undefined && (route.meta.menuActivo ?? route.name) === ruta;
}
</script>

<style scoped>
/* Contenido en el marco web: alineado a la izquierda como las pantallas de administración, con un ancho cómodo de leer */
.app-web {
  max-width: 960px;
  padding: 28px 32px 48px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 68px);
}

.app {
  min-height: 100vh;
  background: #e9e7e0;
  display: flex;
  justify-content: center;
}

.app__marco {
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  background: var(--safic-fondo);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(28, 27, 24, 0.08);
}

.app__contenido {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.app__pestanas {
  position: sticky;
  bottom: 0;
  height: 72px;
  flex-shrink: 0;
  background: var(--safic-superficie);
  border-top: 1px solid var(--safic-borde);
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  padding-bottom: env(safe-area-inset-bottom);
}

.app__pestana {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--safic-texto-tenue);
  text-decoration: none;
}

.app__pestana--activa {
  color: var(--q-primary);
  font-weight: 800;
}

.app__pestana--activa .app__pestana-icono {
  font-variation-settings:
    'FILL' 1,
    'wght' 500;
}
</style>
