<template>
  <!-- Tarjeta de un cargo de la directiva (mockup F1Usuarios · Directiva) -->
  <div class="cargo" :class="{ 'cargo--activo': activo }">
    <div class="cargo__cabecera">
      <div class="cargo__nombre-cargo">{{ cargo.cargo.toUpperCase() }}</div>
      <EstadoBadge :tono="cargo.prorrogado ? 'alerta' : 'exito'">
        {{ cargo.prorrogado ? 'Prorrogado' : 'Vigente' }}
      </EstadoBadge>
    </div>
    <div class="cargo__persona">
      <div class="cargo__avatar">{{ inicialesPersona }}</div>
      <div class="cargo__persona-textos">
        <div class="cargo__persona-nombre">{{ cargo.nombre }}</div>
        <div class="cargo__persona-unidad">Residente {{ cargo.unidad }}</div>
      </div>
    </div>
    <div class="cargo__datos">
      <div>
        <div class="cargo__dato-etiqueta">PERIODO</div>
        <div class="cargo__dato-valor">{{ cargo.periodo }}</div>
      </div>
      <div>
        <div class="cargo__dato-etiqueta">RESPALDO</div>
        <div class="cargo__dato-valor">{{ cargo.acta }}</div>
      </div>
    </div>
    <button type="button" class="cargo__cambiar" @click="emit('cambiar')">
      Cambiar {{ cargo.cargo.toLowerCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';

import type { CargoDirectiva } from '../demo/usuarios';

const props = defineProps<{ cargo: CargoDirectiva; activo: boolean }>();
const emit = defineEmits<{ cambiar: [] }>();

/** Mismo cálculo del mockup: primera letra de las dos primeras palabras. */
const inicialesPersona = computed(() =>
  props.cargo.nombre
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2),
);
</script>

<style scoped>
.cargo {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cargo--activo {
  border: 2px solid var(--q-primary);
  padding: 15px 17px;
}

.cargo__cabecera {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cargo__nombre-cargo {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: var(--q-primary);
  flex-grow: 1;
}

.cargo__persona {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cargo__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--q-accent);
  color: var(--safic-tinta);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}

.cargo__persona-textos {
  flex-grow: 1;
  min-width: 0;
}

.cargo__persona-nombre {
  font-size: 17px;
  font-weight: 800;
}

.cargo__persona-unidad {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cargo__datos {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--safic-texto-2);
  flex-wrap: wrap;
}

.cargo__dato-etiqueta {
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.cargo__dato-valor {
  font-weight: 700;
}

.cargo__cambiar {
  align-self: flex-start;
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.cargo__cambiar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
</style>
