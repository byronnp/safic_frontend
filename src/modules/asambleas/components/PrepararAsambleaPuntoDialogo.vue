<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="safic-dialogo">
      <q-form @submit.prevent="guardar">
        <q-card-section class="dialogo__cuerpo">
          <div class="safic-dialogo__titulo">Agregar punto</div>
          <div class="safic-campo">
            <label class="safic-campo__etiqueta" for="punto-titulo">Punto</label>
            <q-input
              v-model="titulo"
              for="punto-titulo"
              outlined
              class="safic-input"
              :error="!!error"
              :error-message="error"
              no-error-icon
              autofocus
            />
          </div>
          <div class="safic-campo">
            <label class="safic-campo__etiqueta" for="punto-tipo">Tipo</label>
            <q-select
              v-model="tipo"
              for="punto-tipo"
              outlined
              class="safic-input"
              :options="opcionesTipo"
              emit-value
              map-options
            />
          </div>
          <div class="safic-campo">
            <label class="safic-campo__etiqueta" for="punto-mayoria">Mayoría</label>
            <q-select
              v-model="mayoria"
              for="punto-mayoria"
              outlined
              class="safic-input"
              :options="[...MAYORIAS_PUNTO]"
            />
          </div>
          <q-checkbox v-model="conAdjunto" label="Lleva documento adjunto (PDF)" color="primary" />
        </q-card-section>
        <q-card-actions align="right" class="dialogo__acciones">
          <q-btn
            v-close-popup
            flat
            no-caps
            unelevated
            label="Cancelar"
            class="safic-btn safic-btn--secundario"
          />
          <q-btn
            type="submit"
            no-caps
            unelevated
            color="primary"
            label="Agregar"
            class="safic-btn"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { MAYORIAS_PUNTO, TIPOS_PUNTO } from '@/modules/asambleas/demo/preparar';
import type { PuntoOrdenDia, TipoPunto } from '@/modules/asambleas/demo/preparar';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [valor: boolean];
  agregar: [punto: PuntoOrdenDia];
}>();

const opcionesTipo = (Object.keys(TIPOS_PUNTO) as TipoPunto[]).map((valor) => ({
  value: valor,
  label: TIPOS_PUNTO[valor].nombre,
}));

const titulo = ref('');
const tipo = ref<TipoPunto>('vot');
const mayoria = ref<string>('Simple · presentes');
const conAdjunto = ref(false);
const error = ref('');

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      titulo.value = '';
      tipo.value = 'vot';
      mayoria.value = 'Simple · presentes';
      conAdjunto.value = false;
      error.value = '';
    }
  },
);

function guardar(): void {
  const texto = titulo.value.trim();
  if (!texto) {
    error.value = 'Escribe el punto';
    return;
  }
  emit('agregar', {
    titulo: texto,
    tipo: tipo.value,
    mayoria: mayoria.value,
    adjunto: conAdjunto.value ? 'PDF' : '',
  });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.dialogo__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 22px 8px;
}

.dialogo__acciones {
  padding: 12px 22px 20px;
  gap: 8px;
}
</style>
