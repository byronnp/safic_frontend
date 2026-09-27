<template>
  <!-- Encabezado de página de los mockups: miga de pan, título y acciones a la derecha -->
  <div class="safic-encabezado">
    <div class="safic-encabezado__textos">
      <div v-if="miga" class="safic-miga">{{ miga }}</div>
      <h1 class="safic-titulo">
        <slot name="titulo">{{ titulo }}</slot>
      </h1>
      <div v-if="subtitulo || $slots.subtitulo" class="encabezado__subtitulo">
        <slot name="subtitulo">{{ subtitulo }}</slot>
      </div>
    </div>
    <div v-if="$slots.acciones" class="encabezado__acciones">
      <slot name="acciones" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ titulo?: string; miga?: string; subtitulo?: string }>();
</script>

<style scoped>
.encabezado__subtitulo {
  margin-top: 4px;
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.encabezado__acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
