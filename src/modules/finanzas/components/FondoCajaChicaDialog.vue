<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 440px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Fondo y responsable</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              El fondo es fijo: cada reposición lo devuelve a este monto.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="fondo-monto" class="safic-campo__etiqueta">Fondo</label>
            <q-input
              v-model="f.fondo"
              for="fondo-monto"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              autofocus
              hide-bottom-space
              :error="!!errores.fondo"
              :error-message="errores.fondo"
            />
          </div>

          <div class="safic-campo">
            <label for="fondo-resp" class="safic-campo__etiqueta">Responsable del fondo</label>
            <q-input
              v-model="f.responsable"
              for="fondo-resp"
              class="safic-input"
              outlined
              maxlength="80"
              hide-bottom-space
              :error="!!errores.responsable"
              :error-message="errores.responsable"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="guardando.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Guardar"
              :loading="guardando.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { validarFondo, type ErroresFondo } from '../caja-chica.logica';
import { useGuardarCajaChica } from '../composables/useCajaChica';
import { normalizarMonto } from '../cuotas.logica';

const props = defineProps<{ fondo: string; responsable: string; gastado: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const f = reactive({ fondo: props.fondo, responsable: props.responsable });
const errores = reactive<ErroresFondo>({});
const errorGeneral = ref<string | null>(null);
const guardando = useGuardarCajaChica();

async function guardar(): Promise<void> {
  if (guardando.isPending.value) return;
  errorGeneral.value = null;
  errores.fondo = undefined;
  errores.responsable = undefined;

  const problemas = validarFondo(f, props.gastado);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await guardando.mutateAsync({
      fondo: normalizarMonto(f.fondo),
      responsable_nombre: f.responsable.trim(),
    });
    onDialogOK('Caja chica guardada.');
  } catch (error) {
    const apiError = aApiError(error);
    errores.fondo = apiError.campo('fondo');
    errores.responsable = apiError.campo('responsable_nombre');
    if (!errores.fondo && !errores.responsable) errorGeneral.value = apiError.mensaje;
  }
}
</script>
