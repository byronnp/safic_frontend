<template>
  <!-- Indicador de conexión de la garita: sin red se valida con la copia local y lo registrado queda pendiente. -->
  <button
    type="button"
    class="garita-conexion"
    :class="{ 'garita-conexion--sin-red': !enLinea || pendientes > 0 }"
    :disabled="!enLinea || sincronizando || pendientes === 0"
    :aria-label="texto"
    role="status"
    aria-live="polite"
    @click="emit('sincronizar')"
  >
    {{ texto }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  enLinea: boolean;
  pendientes: number;
  sincronizando: boolean;
  /** «Copia de 09:40» o «Sin copia local». */
  copia: string;
}>();
const emit = defineEmits<{ sincronizar: [] }>();

const texto = computed(() => {
  if (props.sincronizando) return 'Sincronizando…';
  if (!props.enLinea) {
    return props.pendientes > 0
      ? `Sin conexión · ${props.pendientes} pendiente${props.pendientes === 1 ? '' : 's'} · ${props.copia}`
      : `Sin conexión · ${props.copia}`;
  }
  return props.pendientes > 0
    ? `Enviar ${props.pendientes} pendiente${props.pendientes === 1 ? '' : 's'}`
    : 'En línea';
});
</script>

<style scoped>
.garita-conexion {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #1e4a48;
  color: #c6e3dd;
  white-space: nowrap;
  border: none;
  font-family: inherit;
  min-height: 32px;
}

.garita-conexion:not(:disabled) {
  cursor: pointer;
}

.garita-conexion--sin-red {
  background: #f0b35a;
  color: #12302f;
}
</style>
