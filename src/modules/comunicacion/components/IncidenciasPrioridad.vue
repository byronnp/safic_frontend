<template>
  <span class="prioridad" :class="`prioridad--${prio}`">{{ etiquetaPrioridad(prio) }}</span>
</template>

<script setup lang="ts">
import { etiquetaPrioridad } from '../incidencias.logica';
import type { PrioridadIncidencia } from '../services/incidencias.service';

defineProps<{ prio: PrioridadIncidencia }>();
</script>

<style scoped>
.prioridad {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: normal;
  white-space: nowrap;
}

.prioridad--alta {
  background: #fde8e6;
  color: #9b1c12;
}

.prioridad--media {
  background: #fff1dc;
  color: #8a3f0a;
}

.prioridad--baja {
  background: #e6ecf7;
  color: #23407a;
}
</style>
