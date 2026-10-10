<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div>
            <div class="safic-dialogo__titulo">Registrar pago en efectivo</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Unidad {{ codigo }}. El pago se aprueba al registrarlo, se aplica a las cuotas más
              antiguas y genera su recibo.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="efectivo-monto" class="safic-campo__etiqueta">Monto recibido (USD)</label>
            <q-input
              v-model="monto"
              for="efectivo-monto"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              autofocus
              hide-bottom-space
              :error="!!errorMonto"
              :error-message="errorMonto"
            />
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
              label="Registrar pago"
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
import { ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { aCentavos } from '@/utils/dinero';

import { useRegistrarEfectivo } from '../composables/useEstadoCuenta';
import { normalizarMonto } from '../cuotas.logica';
import type { PagoEfectivoRegistrado } from '../services/estado-cuenta.service';

const props = defineProps<{ unidadId: number; codigo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<PagoEfectivoRegistrado>();

const monto = ref('');
const errorMonto = ref<string | undefined>(undefined);
const errorGeneral = ref<string | null>(null);

const registrar = useRegistrarEfectivo();

async function guardar(): Promise<void> {
  // Enter dentro del campo también envía el formulario: sin esto se registraría dos veces
  if (registrar.isPending.value) return;
  errorMonto.value = undefined;
  errorGeneral.value = null;

  const normalizado = normalizarMonto(monto.value);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalizado)) {
    errorMonto.value = 'Escribe un monto válido (hasta dos decimales).';
    return;
  }
  if (aCentavos(normalizado) <= 0) {
    errorMonto.value = 'El monto debe ser mayor a cero.';
    return;
  }

  try {
    onDialogOK(await registrar.mutateAsync({ unidadId: props.unidadId, monto: normalizado }));
  } catch (error) {
    const apiError = aApiError(error);
    errorMonto.value = apiError.campo('monto');
    if (!errorMonto.value) {
      // Sin respuesta del servidor (red, tiempo, 5xx) el pago pudo guardarse: no se reintenta a ciegas
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa el estado de cuenta antes de reintentar: el pago pudo registrarse.`
        : apiError.mensaje;
    }
  }
}
</script>
