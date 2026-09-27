<template>
  <!--
    App móvil (residente y guardia). En el celular ocupa toda la pantalla; en
    una pantalla grande se muestra como una columna de 430px al centro.
    Cada página pinta su propio encabezado de color (ver components/app).
    Las páginas NO usan q-page: su raíz es <div class="app-pagina">.
  -->
  <div class="app">
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

    <VistaPreviaAviso salir />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import VistaPreviaAviso from '@/components/VistaPreviaAviso.vue';
import { filtrarMenu, MENU_APP_GUARDIA, MENU_APP_RESIDENTE } from '@/core/navigation/menu';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const session = useSessionStore();

const pestanas = computed(() => {
  if (route.meta.sinPestanas) {
    return [];
  }
  const menu = route.meta.app === 'guardia' ? MENU_APP_GUARDIA : MENU_APP_RESIDENTE;
  return filtrarMenu(menu, session.permisos, { vistasPrevias: MOSTRAR_VISTAS_PREVIAS });
});

function esActual(ruta: string | undefined): boolean {
  return ruta !== undefined && (route.meta.menuActivo ?? route.name) === ruta;
}
</script>

<style scoped>
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
