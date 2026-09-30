<template>
  <!-- Tarjeta de indicador de los mockups de cobranza (F6Cobranza, F6CuentaCondominio) -->
  <div class="indicador" :class="`indicador--${tono}`">
    <div class="indicador__etiqueta">{{ etiqueta }}</div>
    <div class="indicador__valor" :style="estiloValor">{{ valor }}</div>
    <div v-if="nota" class="indicador__nota">{{ nota }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    etiqueta: string;
    valor: string;
    nota?: string;
    tono?: 'normal' | 'alerta' | 'error';
    /** Tamaño del valor en px (24 en Cobranza, 22 en la cuenta del condominio). */
    tamano?: number;
    colorValor?: string;
  }>(),
  { nota: '', tono: 'normal', tamano: 24, colorValor: '' },
);

const estiloValor = computed(() => ({
  fontSize: `${props.tamano}px`,
  ...(props.colorValor ? { color: props.colorValor } : {}),
}));
</script>

<style scoped>
.indicador {
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  padding: 16px 18px;
  min-width: 0;
}

.indicador__etiqueta {
  font-size: 12px;
  color: #5f5b52;
  font-weight: 700;
}

.indicador__valor {
  font-weight: 800;
  margin-top: 6px;
}

.indicador__nota {
  font-size: 12px;
  color: #5f5b52;
}

.indicador--alerta {
  background: #fff7ec;
  border-color: #f1d6ae;
  color: #8a3f0a;
}

.indicador--error {
  background: #fde8e6;
  border-color: #f3b8b2;
  color: #9b1c12;
}

.indicador--alerta .indicador__etiqueta,
.indicador--error .indicador__etiqueta {
  color: inherit;
}

.indicador--alerta .indicador__nota,
.indicador--error .indicador__nota {
  color: inherit;
  font-weight: 600;
}
</style>
