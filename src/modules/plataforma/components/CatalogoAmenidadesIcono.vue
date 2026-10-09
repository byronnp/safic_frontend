<template>
  <!-- Cuadro con iniciales de la amenidad, del color de su categoría -->
  <span
    class="icono"
    :style="{
      width: `${tamano}px`,
      height: `${tamano}px`,
      fontSize: `${tamano > 40 ? 16 : 13}px`,
      background: categoria ? COLOR_CATEGORIA[categoria] : COLOR_SIN_CATEGORIA,
    }"
    aria-hidden="true"
  >
    {{ texto }}
  </span>
</template>

<script setup lang="ts">
import { COLOR_CATEGORIA, COLOR_SIN_CATEGORIA } from '@/modules/configuracion/amenidades.logica';
import type { CategoriaAmenidad } from '@/modules/configuracion/services/amenidades.service';

defineProps<{ texto: string; categoria: CategoriaAmenidad | null; tamano: number }>();
</script>

<style scoped>
.icono {
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffffff;
}
</style>
