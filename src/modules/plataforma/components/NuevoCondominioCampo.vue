<template>
  <!-- Campo del asistente: etiqueta arriba, control (slot) y error debajo -->
  <label class="campo" :class="{ 'campo--error': !!error }">
    <span>{{ etiqueta }}</span>
    <slot />
    <span v-if="error" class="campo__error" role="alert">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ etiqueta: string; error?: string | undefined }>();
</script>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.campo__error {
  font-size: 12px;
  font-weight: 600;
  color: #9b1c12;
}
</style>
