<template>
  <article class="directorio-tarjeta" :aria-label="`Unidad ${resultado.unidad.codigo}`">
    <div
      v-for="vehiculo in resultado.vehiculos"
      :key="vehiculo.placa"
      class="directorio-tarjeta__fila"
    >
      <div
        class="directorio-tarjeta__placa"
        :class="{ 'directorio-tarjeta__placa--apagada': !vehiculo.coincide && hayCoincidencia }"
      >
        {{ vehiculo.placa }}
      </div>
      <div class="directorio-tarjeta__vehiculo">{{ vehiculo.descripcion }}</div>
    </div>
    <div v-for="ocupante in filasOcupantes" :key="ocupante.clave" class="directorio-tarjeta__fila">
      <div
        class="directorio-tarjeta__unidad"
        :class="[
          `directorio-tarjeta__unidad--${tipoVisual(resultado.unidad.tipo)}`,
          { 'directorio-tarjeta__unidad--larga': resultado.unidad.codigo.length > 4 },
        ]"
      >
        {{ resultado.unidad.codigo }}
      </div>
      <div class="directorio-tarjeta__textos">
        <div class="directorio-tarjeta__nombre">{{ ocupante.nombre }}</div>
        <div class="directorio-tarjeta__relacion">{{ ocupante.detalle }}</div>
      </div>
      <a
        v-if="ocupante.telefono"
        :href="enlaceTelefono(ocupante.telefono)"
        :aria-label="`Llamar a ${ocupante.nombre}`"
        class="directorio-tarjeta__llamar"
      >
        <q-icon :name="ICONOS.llamar" size="22px" />
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ICONOS } from '@/core/navigation/icons';

import { enlaceTelefono, textoOcupante, tipoVisual } from '../directorio.logica';
import type { DirectorioUnidad } from '../services/directorio.service';

const props = defineProps<{ resultado: DirectorioUnidad }>();

/** Si la búsqueda fue por placa, las demás placas de la unidad se atenúan. */
const hayCoincidencia = computed(() => props.resultado.vehiculos.some((v) => v.coincide));

/** Una fila por ocupante vigente; una unidad sin ocupantes igual muestra su código. */
const filasOcupantes = computed(() =>
  props.resultado.ocupantes.length
    ? props.resultado.ocupantes.map((o, i) => ({
        clave: `${i}-${o.nombre}`,
        nombre: o.nombre,
        detalle: textoOcupante(o, props.resultado.unidad.bloque),
        telefono: o.telefono,
      }))
    : [
        {
          clave: 'vacia',
          nombre: 'Sin ocupantes',
          detalle: props.resultado.unidad.bloque ?? 'Unidad vacía',
          telefono: null,
        },
      ],
);
</script>

<style scoped>
.directorio-tarjeta {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.directorio-tarjeta__fila {
  display: flex;
  align-items: center;
  gap: 12px;
}

.directorio-tarjeta__placa {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 2px solid var(--safic-texto);
  border-radius: 6px;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1px;
  background: #fff8e1;
}

.directorio-tarjeta__placa--apagada {
  opacity: 0.5;
}

.directorio-tarjeta__vehiculo {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.directorio-tarjeta__unidad {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
}

.directorio-tarjeta__unidad--larga {
  font-size: 13px;
}

.directorio-tarjeta__unidad--torre {
  background: #e3efec;
  color: #0b4a47;
}

.directorio-tarjeta__unidad--casa {
  background: #fff1dc;
  color: #8a3f0a;
}

.directorio-tarjeta__textos {
  flex-grow: 1;
  min-width: 0;
}

.directorio-tarjeta__nombre {
  font-size: 15px;
  font-weight: 700;
}

.directorio-tarjeta__relacion {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.directorio-tarjeta__llamar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--q-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.directorio-tarjeta__llamar:hover,
.directorio-tarjeta__llamar:focus-visible {
  color: #ffffff;
  filter: brightness(0.9);
}
</style>
