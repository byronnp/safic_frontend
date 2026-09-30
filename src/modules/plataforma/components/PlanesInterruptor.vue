<template>
  <!-- Interruptor del mockup F6Planes (46×26). Bloqueado = siempre incluido. -->
  <button
    type="button"
    role="switch"
    class="interruptor"
    :class="{ 'interruptor--activo': modelValue, 'interruptor--bloqueado': bloqueado }"
    :aria-checked="modelValue"
    :aria-disabled="bloqueado"
    :aria-label="etiqueta"
    @click="alternar"
  >
    <span class="interruptor__perilla" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: boolean; etiqueta: string; bloqueado?: boolean }>(),
  { bloqueado: false },
);
const emit = defineEmits<{ 'update:modelValue': [valor: boolean] }>();

function alternar(): void {
  if (!props.bloqueado) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<style scoped>
.interruptor {
  width: 46px;
  height: 26px;
  border-radius: 13px;
  border: none;
  position: relative;
  padding: 0;
  cursor: pointer;
  background: #d8d4c8;
  flex-shrink: 0;
}

.interruptor--activo {
  background: var(--q-primary);
}

.interruptor--bloqueado {
  cursor: not-allowed;
}

.interruptor--activo.interruptor--bloqueado {
  background: #8fb0ab;
}

.interruptor:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.interruptor__perilla {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: left 0.15s ease;
}

.interruptor--activo .interruptor__perilla {
  left: 23px;
}
</style>
