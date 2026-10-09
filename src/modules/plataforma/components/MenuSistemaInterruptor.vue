<template>
  <!-- Interruptor compacto del mockup (38×22) -->
  <button
    type="button"
    role="switch"
    class="interruptor"
    :class="{ 'interruptor--on': modelValue }"
    :aria-checked="modelValue"
    :aria-label="etiqueta"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="interruptor__perilla" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; etiqueta: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [valor: boolean] }>();
</script>

<style scoped>
.interruptor:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.interruptor {
  width: 38px;
  height: 22px;
  border-radius: 11px;
  border: none;
  position: relative;
  padding: 0;
  cursor: pointer;
  display: block;
  background: var(--safic-borde-2);
  transition: background 0.15s;
}

.interruptor--on {
  background: var(--q-primary);
}

.interruptor:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.interruptor__perilla {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 0.15s;
}

.interruptor--on .interruptor__perilla {
  left: 19px;
}
</style>
