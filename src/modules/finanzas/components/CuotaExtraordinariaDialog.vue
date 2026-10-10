<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div>
            <div class="safic-dialogo__titulo">Cuota extraordinaria</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Se suma a la cuenta de cada unidad de {{ mesEnFrase(periodo) }}. No reemplaza la cuota
              ordinaria.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="extra-detalle" class="safic-campo__etiqueta">Detalle</label>
            <q-input
              v-model="formulario.detalle"
              for="extra-detalle"
              class="safic-input"
              outlined
              maxlength="80"
              autofocus
              hide-bottom-space
              placeholder="Ej.: Reparación de la bomba de agua"
              :error="!!errores.detalle"
              :error-message="errores.detalle"
            />
          </div>

          <fieldset class="safic-campo cuota-extra__modos">
            <legend class="safic-campo__etiqueta">¿Cómo se reparte?</legend>
            <label v-for="m in MODOS_EXTRAORDINARIA" :key="m.valor" class="cuota-extra__modo">
              <input v-model="formulario.modo" type="radio" name="extra-modo" :value="m.valor" />
              <span>
                <strong>{{ m.etiqueta }}</strong>
                <span class="text-suave"> · {{ m.ayuda }}</span>
              </span>
            </label>
          </fieldset>

          <div class="safic-campo">
            <label for="extra-monto" class="safic-campo__etiqueta">
              {{
                formulario.modo === 'alicuota' ? 'Total a repartir (USD)' : 'Monto por unidad (USD)'
              }}
            </label>
            <q-input
              v-model="formulario.monto"
              for="extra-monto"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              hide-bottom-space
              :error="!!errores.monto"
              :error-message="errores.monto"
            />
          </div>

          <div class="safic-campo">
            <label for="extra-vence" class="safic-campo__etiqueta">Vence el</label>
            <q-input
              v-model="formulario.venceEl"
              for="extra-vence"
              class="safic-input"
              outlined
              type="date"
              :min="hoy"
              hide-bottom-space
              :error="!!errores.venceEl"
              :error-message="errores.venceEl"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="crear.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Crear cuota"
              :loading="crear.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { hoyEcuador } from '@/utils/fecha';
import { mesEnFrase } from '@/utils/periodo';

import { useCrearCuotaExtraordinaria } from '../composables/useCuotas';
import {
  formularioExtraordinariaVacio,
  MODOS_EXTRAORDINARIA,
  peticionExtraordinaria,
  validarExtraordinaria,
  type ErroresExtraordinaria,
} from '../cuotas.logica';
import type { CuotaExtraordinariaCreada } from '../services/cuotas.service';

const props = defineProps<{ periodo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<CuotaExtraordinariaCreada>();

const hoy = hoyEcuador();
const formulario = reactive(formularioExtraordinariaVacio(hoy));
const errores = reactive<ErroresExtraordinaria>({});
const errorGeneral = ref<string | null>(null);

const crear = useCrearCuotaExtraordinaria();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: sin esto se crearían dos cuotas
  if (crear.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['detalle', 'monto', 'venceEl'] as const) errores[k] = undefined;

  const problemas = validarExtraordinaria(formulario, hoy);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    onDialogOK(await crear.mutateAsync(peticionExtraordinaria(formulario, props.periodo)));
  } catch (error) {
    const apiError = aApiError(error);
    errores.detalle = apiError.campo('detalle');
    errores.monto = apiError.campo('monto');
    errores.venceEl = apiError.campo('vence_el');
    if (!errores.detalle && !errores.monto && !errores.venceEl) {
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa las cuotas del mes antes de reintentar: la cuota pudo crearse.`
        : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.cuota-extra__modos {
  border: none;
  padding: 0;
  margin: 0;
}

.cuota-extra__modo {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  cursor: pointer;
}
</style>
