<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Registrar gasto de caja chica</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Disponible: {{ formatoMoneda(disponible) }}. La foto del respaldo es obligatoria.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="cc-concepto" class="safic-campo__etiqueta">¿En qué se gastó?</label>
            <q-input
              v-model="f.concepto"
              for="cc-concepto"
              class="safic-input"
              outlined
              maxlength="120"
              autofocus
              hide-bottom-space
              :error="!!errores.concepto"
              :error-message="errores.concepto"
            />
          </div>

          <div class="safic-campo">
            <label for="cc-comercio" class="safic-campo__etiqueta">Comercio (opcional)</label>
            <q-input
              v-model="f.comercio"
              for="cc-comercio"
              class="safic-input"
              outlined
              maxlength="80"
              hide-bottom-space
            />
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 150px">
              <label for="cc-monto" class="safic-campo__etiqueta">Monto</label>
              <q-input
                v-model="f.monto"
                for="cc-monto"
                class="safic-input"
                outlined
                inputmode="decimal"
                prefix="$"
                hide-bottom-space
                :error="!!errores.monto"
                :error-message="errores.monto"
              />
            </div>
            <div class="safic-campo col" style="min-width: 150px">
              <label for="cc-fecha" class="safic-campo__etiqueta">Fecha</label>
              <q-input
                v-model="f.fecha"
                for="cc-fecha"
                class="safic-input"
                outlined
                type="date"
                :max="hoy"
                hide-bottom-space
                :error="!!errores.fecha"
                :error-message="errores.fecha"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="cc-respaldo" class="safic-campo__etiqueta">Respaldo (foto o PDF)</label>
            <q-file
              v-model="f.respaldo"
              for="cc-respaldo"
              class="safic-input"
              outlined
              accept=".jpg,.jpeg,.png,.pdf"
              max-file-size="5242880"
              hide-bottom-space
              clearable
              :error="!!errores.respaldo"
              :error-message="errores.respaldo"
              @rejected="errores.respaldo = 'Sube una foto (JPG o PNG) o un PDF de hasta 5 MB.'"
            >
              <template #prepend><q-icon :name="ICONOS.archivo" /></template>
            </q-file>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="registrar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Registrar gasto"
              :loading="registrar.isPending.value"
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
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';

import { useRegistrarGastoCajaChica } from '../composables/useCajaChica';
import { gastoCajaVacio, validarGastoCaja, type ErroresGastoCaja } from '../caja-chica.logica';
import { normalizarMonto } from '../cuotas.logica';

const props = defineProps<{ disponible: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: el gasto sería de otra caja
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const hoy = hoyEcuador();
const f = reactive(gastoCajaVacio(hoy));
const errores = reactive<ErroresGastoCaja>({});
const errorGeneral = ref<string | null>(null);
const registrar = useRegistrarGastoCajaChica();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se registra dos veces
  if (registrar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['concepto', 'monto', 'fecha', 'respaldo'] as const) errores[k] = undefined;

  const problemas = validarGastoCaja(f, hoy, props.disponible);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await registrar.mutateAsync({
      concepto: f.concepto.trim(),
      comercio: f.comercio.trim() === '' ? null : f.comercio.trim(),
      monto: normalizarMonto(f.monto),
      fecha: f.fecha,
      respaldo: f.respaldo as File,
    });
    onDialogOK(`Gasto «${f.concepto.trim()}» registrado.`);
  } catch (error) {
    const apiError = aApiError(error);
    errores.concepto = apiError.campo('concepto');
    errores.monto = apiError.campo('monto');
    errores.fecha = apiError.campo('fecha');
    errores.respaldo = apiError.campo('respaldo');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el gasto pudo registrarse: se avisa para no duplicarlo
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa la lista antes de reintentar: el gasto pudo registrarse.`
        : apiError.mensaje;
    }
  }
}
</script>
