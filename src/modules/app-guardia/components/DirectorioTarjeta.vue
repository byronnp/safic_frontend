<template>
  <article class="directorio-tarjeta" :aria-label="`${residente.nombre}, ${residente.unidad}`">
    <div
      v-for="vehiculo in residente.vehiculos"
      :key="vehiculo.placa"
      class="directorio-tarjeta__fila"
    >
      <div class="directorio-tarjeta__placa">{{ vehiculo.placa }}</div>
      <div class="directorio-tarjeta__vehiculo">{{ vehiculo.descripcion }}</div>
    </div>
    <div class="directorio-tarjeta__fila">
      <div
        class="directorio-tarjeta__unidad"
        :class="[
          `directorio-tarjeta__unidad--${residente.tipoUnidad}`,
          { 'directorio-tarjeta__unidad--larga': residente.unidad.length > 4 },
        ]"
      >
        {{ residente.unidad }}
      </div>
      <div class="directorio-tarjeta__textos">
        <div class="directorio-tarjeta__nombre">{{ residente.nombre }}</div>
        <div class="directorio-tarjeta__relacion">{{ residente.relacion }}</div>
      </div>
      <a
        :href="`tel:${residente.telefono}`"
        :aria-label="`Llamar a ${residente.nombre}`"
        class="directorio-tarjeta__llamar"
      >
        <q-icon name="sym_r_call" size="22px" />
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { DirectorioResidente } from '@/modules/app-guardia/demo/directorio';

defineProps<{ residente: DirectorioResidente }>();
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
