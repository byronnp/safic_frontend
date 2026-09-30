<template>
  <section class="garita-lista" :aria-label="titulo">
    <div class="garita-lista__cabecera">
      <h2 class="garita-lista__titulo">{{ titulo }}</h2>
      <div class="garita-lista__conteo">{{ visitas.length }}</div>
    </div>
    <div v-if="visitas.length" class="garita-lista__caja">
      <div v-for="visita in visitas" :key="visita.id" class="garita-lista__fila">
        <div class="garita-lista__textos">
          <div class="garita-lista__nombre">{{ visita.nombre }}</div>
          <div class="garita-lista__detalle">{{ visita.detalle }}</div>
        </div>
        <button
          v-if="accion"
          type="button"
          class="garita-lista__accion"
          :aria-label="`${accion} de ${visita.nombre}`"
          @click="emit('accion', visita.id)"
        >
          {{ accion }}
        </button>
      </div>
    </div>
    <div v-else class="garita-lista__caja garita-lista__vacio">{{ vacio }}</div>
  </section>
</template>

<script setup lang="ts">
interface GaritaFilaVisita {
  id: string;
  nombre: string;
  detalle: string;
}

defineProps<{
  titulo: string;
  visitas: GaritaFilaVisita[];
  vacio: string;
  accion?: string;
}>();

const emit = defineEmits<{ accion: [id: string] }>();
</script>

<style scoped>
.garita-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.garita-lista__cabecera {
  display: flex;
  align-items: baseline;
}

.garita-lista__titulo {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: normal;
  flex-grow: 1;
}

.garita-lista__conteo {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.garita-lista__caja {
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
}

.garita-lista__fila {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--safic-linea-2);
}

.garita-lista__fila:last-child {
  border-bottom: none;
}

.garita-lista__textos {
  flex-grow: 1;
  min-width: 0;
}

.garita-lista__nombre {
  font-size: 14px;
  font-weight: 700;
}

.garita-lista__detalle {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.garita-lista__accion {
  flex-shrink: 0;
  height: 44px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.garita-lista__vacio {
  padding: 14px 12px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}
</style>
