<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 440px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Dar de baja</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              {{ nombre }} deja de ser {{ relacion.toLowerCase() }} de la unidad. No se borra: queda
              en el historial.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="fo-fin" class="safic-campo__etiqueta">Fecha de fin</label>
            <q-input
              v-model="fechaFin"
              for="fo-fin"
              class="safic-input"
              outlined
              type="date"
              :min="fechaInicio"
              hide-bottom-space
              :error="!!errorFecha"
              :error-message="errorFecha"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="finalizar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Dar de baja"
              :loading="finalizar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useFinalizarOcupante, useInvalidarUnidades } from '../composables/useUnidades';
import { hoyEcuador } from '../persona.formulario';
import type { Ocupante } from '../services/unidades.service';

const props = defineProps<{
  ocupanteId: number;
  nombre: string;
  relacion: string;
  fechaInicio: string;
}>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Ocupante>();

const fechaFin = ref(hoyEcuador() < props.fechaInicio ? props.fechaInicio : hoyEcuador());
const errorFecha = ref<string | undefined>();
const errorGeneral = ref<string | null>(null);

const $q = useQuasar();
const finalizar = useFinalizarOcupante();
const invalidar = useInvalidarUnidades();

async function guardar(): Promise<void> {
  errorFecha.value = undefined;
  errorGeneral.value = null;

  if (!fechaFin.value) {
    errorFecha.value = 'Indica la fecha de fin.';
    return;
  }
  if (fechaFin.value < props.fechaInicio) {
    errorFecha.value = 'La fecha de fin no puede ser anterior al inicio.';
    return;
  }

  try {
    onDialogOK(
      await finalizar.mutateAsync({ ocupanteId: props.ocupanteId, fechaFin: fechaFin.value }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    if (apiError.codigo === 'OCUPANTE_FINALIZADO' || apiError.estado === 404) {
      // Otra persona ya la dio de baja (o la unidad cambió): se refrescan los datos
      void invalidar();
      $q.notify({ type: 'info', message: apiError.mensaje });
      onDialogCancel();
      return;
    }
    errorFecha.value = apiError.campo('fecha_fin');
    if (!errorFecha.value) errorGeneral.value = apiError.mensaje;
  }
}
</script>
