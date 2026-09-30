<template>
  <!-- Cuadro con iniciales de la amenidad, del color de su categoría -->
  <span
    class="icono"
    :style="{
      width: `${tamano}px`,
      height: `${tamano}px`,
      fontSize: `${tamano > 40 ? 16 : 13}px`,
      background: CATEGORIAS_AMENIDAD[categoria].color,
    }"
    aria-hidden="true"
  >
    {{ texto }}
  </span>
</template>

<script setup lang="ts">
import { CATEGORIAS_AMENIDAD } from '@/modules/plataforma/demo/catalogo-amenidades';
import type { CategoriaAmenidad } from '@/modules/plataforma/demo/catalogo-amenidades';

defineProps<{ texto: string; categoria: CategoriaAmenidad; tamano: number }>();
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
