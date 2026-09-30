<template>
  <!-- Botón de filtro del mockup Main ("Bloque: Todos ⌄") con su menú de opciones -->
  <button type="button" class="filtro" :class="{ 'filtro--activo': !!modelValue }">
    {{ etiqueta }}: {{ textoActual }}
    <q-icon name="sym_r_expand_more" size="14px" />
    <q-menu :offset="[0, 6]" class="unidades-filtro-menu">
      <q-list dense style="min-width: 180px">
        <q-item
          v-for="opcion in opcionesConTodos"
          :key="opcion.valor"
          v-close-popup
          clickable
          :active="opcion.valor === modelValue"
          active-class="unidades-filtro-menu__activo"
          @click="emit('update:modelValue', opcion.valor)"
        >
          <q-item-section>{{ opcion.texto }}</q-item-section>
          <q-item-section v-if="opcion.valor === modelValue" side>
            <q-icon name="sym_r_check" size="18px" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface OpcionFiltro {
  valor: string;
  texto: string;
}

const props = defineProps<{ etiqueta: string; opciones: OpcionFiltro[]; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();

const opcionesConTodos = computed<OpcionFiltro[]>(() => [
  { valor: '', texto: 'Todos' },
  ...props.opciones,
]);

const textoActual = computed(
  () => opcionesConTodos.value.find((o) => o.valor === props.modelValue)?.texto ?? 'Todos',
);
</script>

<style scoped>
.filtro {
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: var(--safic-texto-2);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.filtro--activo {
  border-color: var(--q-primary);
  color: var(--q-primary);
  font-weight: 700;
}

.filtro:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
</style>

<style>
.unidades-filtro-menu {
  border-radius: 10px;
  font-size: 14px;
}

.unidades-filtro-menu__activo {
  color: var(--safic-texto);
  font-weight: 700;
  background: #f2f7f6;
}
</style>
