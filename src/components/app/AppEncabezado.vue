<template>
  <!--
    Encabezado de color de la app móvil (mockups Residente, Guardia, Mi cuenta…).
    `solapado`: deja espacio abajo para que la primera tarjeta de la página se
    monte sobre el encabezado (usar la clase app-tarjeta-solapada en esa tarjeta).
  -->
  <header
    class="app-encabezado"
    :class="{ 'app-encabezado--solapado': solapado && !web, 'app-encabezado--web': web }"
  >
    <div class="row items-center no-wrap" style="gap: 8px">
      <q-btn
        v-if="volver"
        flat
        round
        dense
        icon="sym_r_arrow_back"
        aria-label="Volver"
        class="app-encabezado__volver"
        :to="volver"
      />
      <div class="col-grow">
        <div v-if="antetitulo" class="app-encabezado__antetitulo">{{ antetitulo }}</div>
        <div class="app-encabezado__titulo">
          <slot name="titulo">{{ titulo }}</slot>
        </div>
      </div>
      <div class="app-encabezado__derecha"><slot name="derecha" /></div>
      <!-- En el marco web la cuenta está en el encabezado de la página -->
      <AppCuentaMenu v-if="!web" />
    </div>
    <slot />
  </header>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import AppCuentaMenu from './AppCuentaMenu.vue';

const $q = useQuasar();
/** Pantalla grande: la app va dentro del marco web (menú lateral) y el encabezado es un título claro, no la franja del celular. */
const web = computed(() => $q.screen.gt.sm);

defineProps<{
  titulo?: string;
  antetitulo?: string;
  solapado?: boolean;
  volver?: RouteLocationRaw;
}>();
</script>

<style scoped>
.app-encabezado {
  background: var(--safic-tinta);
  color: #ffffff;
  padding: 24px 20px 20px;
}

.app-encabezado--solapado {
  padding-bottom: 56px;
}

.app-encabezado__antetitulo {
  font-size: 13px;
  color: #b9cdc9;
  font-weight: 600;
}

.app-encabezado__titulo {
  font-size: 22px;
  font-weight: 800;
  margin-top: 2px;
  line-height: 1.2;
}

.app-encabezado__volver {
  color: #ffffff;
  margin-left: -8px;
}

/* En el marco web: título claro como el de las pantallas de administración */
.app-encabezado--web {
  background: transparent;
  color: var(--safic-texto);
  padding: 0 0 20px;
}

.app-encabezado--web .app-encabezado__antetitulo {
  color: var(--safic-texto-suave);
}

.app-encabezado--web .app-encabezado__titulo {
  font-size: 28px;
  letter-spacing: -0.4px;
}

.app-encabezado--web .app-encabezado__volver {
  color: var(--safic-texto);
}

/* Los botones y enlaces de ese espacio están pensados para la franja oscura (texto blanco): sobre fondo claro pasan a botón primario */
.app-encabezado__derecha {
  display: contents;
}

.app-encabezado--web .app-encabezado__derecha :deep(a),
.app-encabezado--web .app-encabezado__derecha :deep(button) {
  background: var(--q-primary);
  border-color: var(--q-primary);
  color: #ffffff;
}
</style>
