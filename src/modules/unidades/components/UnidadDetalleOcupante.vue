<template>
  <!-- Tarjeta de ocupante vigente (mockup UnidadDetalle) -->
  <div class="ocupante">
    <div class="ocupante__avatar" :style="{ background: color.fondo, color: color.texto }">
      {{ iniciales(ocupante.persona.nombre_completo) }}
    </div>
    <div class="ocupante__datos">
      <div class="ocupante__nombre-fila">
        <div class="ocupante__nombre">{{ ocupante.persona.nombre_completo }}</div>
        <span v-if="ocupante.es_principal" class="ocupante__principal">PRINCIPAL</span>
      </div>
      <div class="ocupante__relacion">
        {{ relacionTexto }} · Desde {{ formatoFecha(ocupante.fecha_inicio) }}
        <template v-if="ocupante.fecha_fin">
          · Hasta {{ formatoFecha(ocupante.fecha_fin) }}</template
        >
      </div>
    </div>
    <!-- Llegan enmascarados si el rol no tiene residentes.ver_datos -->
    <div class="ocupante__contacto">
      <div>{{ ocupante.persona.telefono ?? '—' }}</div>
      <div class="ocupante__documento">{{ ocupante.persona.documento }}</div>
    </div>
    <button
      v-if="puedeEditar"
      type="button"
      class="ocupante__mas"
      :aria-label="`Más acciones para ${ocupante.persona.nombre_completo}`"
    >
      <q-icon name="sym_r_more_vert" size="20px" />
      <q-menu anchor="bottom right" self="top right">
        <q-list dense style="min-width: 200px">
          <q-item v-close-popup clickable @click="emit('finalizar', ocupante)">
            <q-item-section>Dar de baja</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { colorAvatar, iniciales } from '@/core/theme/avatar';
import { formatoFecha } from '@/utils/formato';

import { textoRelacion } from '../persona.formulario';
import type { Ocupante } from '../services/unidades.service';

const props = defineProps<{ ocupante: Ocupante; indice: number; puedeEditar: boolean }>();
const emit = defineEmits<{ finalizar: [ocupante: Ocupante] }>();

const color = computed(() => colorAvatar(props.ocupante.es_principal ? 0 : props.indice + 1));

/** Un propietario que no es el principal no reside en la unidad. */
const relacionTexto = computed(() => {
  const texto = textoRelacion(props.ocupante.relacion);
  return props.ocupante.relacion === 'propietario' && !props.ocupante.es_principal
    ? `${texto} (no reside)`
    : texto;
});
</script>

<style scoped>
.ocupante {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.ocupante__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.ocupante__datos {
  flex-grow: 1;
  min-width: 0;
}

.ocupante__nombre-fila {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ocupante__nombre {
  font-size: 16px;
  font-weight: 700;
}

.ocupante__principal {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: #fff1dc;
  color: #8a3f0a;
}

.ocupante__relacion {
  font-size: 13px;
  color: var(--safic-texto-suave);
  margin-top: 3px;
}

.ocupante__contacto {
  width: 170px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--safic-texto-2);
}

.ocupante__documento {
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

.ocupante__mas {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto-suave);
  flex-shrink: 0;
}

.ocupante__mas:hover {
  background: var(--safic-fondo);
}

.ocupante__mas:focus-visible {
  outline: 2px solid var(--q-primary);
}

@media (max-width: 767px) {
  .ocupante {
    flex-wrap: wrap;
  }

  .ocupante__datos {
    flex-basis: calc(100% - 128px);
  }

  .ocupante__contacto {
    order: 5;
    width: auto;
    flex-grow: 1;
    padding-left: 64px;
  }
}
</style>
