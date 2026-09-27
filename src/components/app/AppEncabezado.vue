<template>
  <!--
    Encabezado de color de la app móvil (mockups Residente, Guardia, Mi cuenta…).
    `solapado`: deja espacio abajo para que la primera tarjeta de la página se
    monte sobre el encabezado (usar la clase app-tarjeta-solapada en esa tarjeta).
  -->
  <header class="app-encabezado" :class="{ 'app-encabezado--solapado': solapado }">
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
      <slot name="derecha" />
    </div>
    <slot />
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

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
</style>
