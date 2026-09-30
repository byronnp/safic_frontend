<template>
  <!-- Indicador de conexión de la garita: sin red, el QR se valida con la copia local. -->
  <span
    class="garita-conexion"
    :class="{ 'garita-conexion--sin-red': !enLinea }"
    role="status"
    aria-live="polite"
  >
    {{ enLinea ? 'En línea' : 'Sin conexión · valida local' }}
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const enLinea = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

function actualizar(): void {
  enLinea.value = navigator.onLine;
}

onMounted(() => {
  actualizar();
  window.addEventListener('online', actualizar);
  window.addEventListener('offline', actualizar);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', actualizar);
  window.removeEventListener('offline', actualizar);
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
}

.garita-conexion--sin-red {
  background: #f0b35a;
  color: #12302f;
}
</style>
