<template>
  <!-- Panel de detalle de una amenidad (mockup F1AmenidadesCondominio) -->
  <div class="fotos">
    {{ amenidad.fotos ? `${amenidad.fotos} fotos · ver galería` : 'Sin fotos · subir' }}
  </div>
  <div>
    <div class="detalle__antetitulo">
      {{ amenidad.tipo }} · {{ amenidad.origen === 'cat' ? 'del catálogo' : 'propia' }}
    </div>
    <div class="detalle__nombre">{{ amenidad.nombre }}</div>
  </div>
  <div class="datos">
    <div v-for="dato in datos" :key="dato.k" class="datos__fila">
      <span class="datos__clave">{{ dato.k }}</span
      ><strong>{{ dato.v }}</strong>
    </div>
  </div>
  <router-link v-if="amenidad.reservable" :to="{ name: 'areas-reglas' }" class="configurar">
    Configurar reservas y cobro
  </router-link>
  <div class="col-grow" />
  <div class="nota" :class="{ 'nota--mantenimiento': !!amenidad.mantenimiento }">{{ nota }}</div>
  <div class="acciones">
    <button type="button" class="acciones__btn" @click="emit('mantenimiento')">
      {{ amenidad.mantenimiento ? 'Quitar mantenimiento' : 'Poner en mantenimiento' }}
    </button>
    <button type="button" class="acciones__btn acciones__btn--peligro" @click="emit('desactivar')">
      Desactivar
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Amenidad } from '../demo/amenidades';
import { estadoAmenidad, usoAmenidad } from './amenidades-formato';

const props = defineProps<{ amenidad: Amenidad }>();
const emit = defineEmits<{ mantenimiento: []; desactivar: [] }>();

const datos = computed(() => [
  { k: 'Ubicación', v: props.amenidad.ubicacion },
  { k: 'Uso', v: usoAmenidad(props.amenidad) },
  { k: 'Detalle', v: props.amenidad.info },
  { k: 'Estado', v: estadoAmenidad(props.amenidad) },
]);

const nota = computed(() => {
  const a = props.amenidad;
  if (a.mantenimiento) {
    return 'En mantenimiento no se puede reservar. Las reservas ya hechas en esas fechas se avisan a los residentes.';
  }
  if (a.esencial) {
    return 'Amenidad esencial: nunca se restringe a residentes en mora.';
  }
  if (a.reservable) {
    return 'Tiene reservas registradas: no se puede eliminar, solo desactivar.';
  }
  return 'Visible para los residentes en Mi condominio.';
});
</script>

<style scoped>
.fotos {
  height: 120px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #dce7e4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 700;
}

.detalle__antetitulo {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.detalle__nombre {
  font-size: 20px;
  font-weight: 800;
}

.datos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.datos__fila {
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--safic-linea-2);
  padding-bottom: 7px;
}

.datos__fila strong {
  text-align: right;
}

.datos__clave {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.configurar {
  height: 42px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--q-primary);
  color: var(--q-primary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nota {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  background: #f1efe8;
  color: var(--safic-texto-2);
}

.nota--mantenimiento {
  background: #fff7ec;
  color: #7a3808;
}

.acciones {
  display: flex;
  gap: 10px;
}

.acciones__btn {
  flex-grow: 1;
  height: 44px;
  white-space: nowrap;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.acciones__btn--peligro {
  border-color: #9b1c12;
  color: #9b1c12;
}
</style>
