<template>
  <!-- Tarjeta de ocupante vigente (mockup UnidadDetalle) -->
  <div class="ocupante">
    <div class="ocupante__avatar" :style="{ background: ocupante.fondo, color: ocupante.texto }">
      {{ ocupante.iniciales }}
    </div>
    <div class="ocupante__datos">
      <div class="ocupante__nombre-fila">
        <div class="ocupante__nombre">{{ ocupante.nombre }}</div>
        <span v-if="ocupante.principal" class="ocupante__principal">PRINCIPAL</span>
      </div>
      <div class="ocupante__relacion">
        {{ ocupante.relacion
        }}<template v-if="ocupante.desde !== '—'"> · Desde {{ ocupante.desde }}</template>
      </div>
    </div>
    <div class="ocupante__contacto">
      <div>{{ ocupante.telefono }}</div>
      <div class="ocupante__documento">{{ ocupante.documento }}</div>
    </div>
    <EstadoBadge :tono="ESTADOS_CUENTA[ocupante.cuenta].tono" class="ocupante__cuenta">
      {{ ESTADOS_CUENTA[ocupante.cuenta].texto }}
    </EstadoBadge>
    <button
      type="button"
      class="ocupante__mas"
      :aria-label="`Más acciones para ${ocupante.nombre}`"
    >
      <q-icon name="sym_r_more_vert" size="20px" />
      <q-menu anchor="bottom right" self="top right">
        <q-list dense style="min-width: 200px">
          <q-item
            v-for="accion in ACCIONES"
            :key="accion"
            v-close-popup
            clickable
            @click="emit('accion', `${accion}: disponible cuando se conecte la API.`)"
          >
            <q-item-section>{{ accion }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </button>
  </div>
</template>

<script setup lang="ts">
import EstadoBadge from '@/components/EstadoBadge.vue';

import { ESTADOS_CUENTA, type OcupanteDemo } from '../demo/unidades';

defineProps<{ ocupante: OcupanteDemo }>();
const emit = defineEmits<{ accion: [mensaje: string] }>();

const ACCIONES = ['Marcar como principal', 'Reenviar invitación', 'Editar datos', 'Dar de baja'];
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

.ocupante__cuenta {
  width: 130px;
  justify-content: center;
  flex-shrink: 0;
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

  .ocupante__cuenta {
    order: 6;
  }
}
</style>
