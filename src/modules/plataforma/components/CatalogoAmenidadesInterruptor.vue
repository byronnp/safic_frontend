<template>
  <!-- Interruptor del mockup (44×24, perilla blanca) -->
  <button
    type="button"
    role="switch"
    class="interruptor"
    :class="{ 'interruptor--on': modelValue }"
    :aria-checked="modelValue"
    :aria-label="etiqueta"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="interruptor__perilla" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; etiqueta: string }>();
const emit = defineEmits<{ 'update:modelValue': [valor: boolean] }>();
</script>

<style scoped>
.interruptor {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  position: relative;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: left 0.15s;
}

.interruptor--on .interruptor__perilla {
  left: 23px;
}
</style>
