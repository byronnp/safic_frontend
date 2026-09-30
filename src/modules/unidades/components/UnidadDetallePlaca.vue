<template>
  <!-- Placa de vehículo del mockup UnidadDetalle (más grande que .safic-placa) -->
  <div class="unidad-detalle-placa">{{ placa }}</div>
</template>

<script setup lang="ts">
defineProps<{ placa: string }>();
</script>

<style scoped>
.unidad-detalle-placa {
  padding: 6px 10px;
  border: 2px solid var(--safic-texto);
  border-radius: 6px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 1px;
  background: #fff8e1;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
