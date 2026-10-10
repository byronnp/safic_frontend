<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div>
            <div class="safic-dialogo__titulo">Registrar factura a mano</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Si tienes el XML del SRI, súbelo mejor: trae todos los datos. La factura queda por
              aprobar.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="fac-prov" class="safic-campo__etiqueta">Proveedor</label>
            <q-select
              v-model="formulario.proveedorId"
              for="fac-prov"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="opciones"
              :loading="proveedores.isPending.value"
              :error="!!errores.proveedorId"
              :error-message="errores.proveedorId"
            />
          </div>

          <div class="safic-campo">
            <label for="fac-numero" class="safic-campo__etiqueta">Número de factura</label>
            <q-input
              v-model="formulario.numero"
              for="fac-numero"
              class="safic-input"
              outlined
              maxlength="17"
              placeholder="001-001-000000123"
              hide-bottom-space
              :error="!!errores.numero"
              :error-message="errores.numero"
            />
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 160px">
              <label for="fac-emision" class="safic-campo__etiqueta">Emisión</label>
              <q-input
                v-model="formulario.fechaEmision"
                for="fac-emision"
                class="safic-input"
                outlined
                type="date"
                :max="hoy"
                hide-bottom-space
                :error="!!errores.fechaEmision"
                :error-message="errores.fechaEmision"
              />
            </div>
            <div class="safic-campo col" style="min-width: 160px">
              <label for="fac-vence" class="safic-campo__etiqueta">Vence (opcional)</label>
              <q-input
                v-model="formulario.venceEl"
                for="fac-vence"
                class="safic-input"
                outlined
                type="date"
                hide-bottom-space
                :error="!!errores.venceEl"
                :error-message="errores.venceEl"
              />
              <div class="text-suave" style="font-size: 12px">
                Sin fecha: 30 días desde la emisión.
              </div>
            </div>
          </div>

          <div class="safic-campo">
            <label for="fac-subtotal" class="safic-campo__etiqueta">Subtotal (USD)</label>
            <q-input
              v-model="formulario.subtotal"
              for="fac-subtotal"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              hide-bottom-space
              :error="!!errores.subtotal"
              :error-message="errores.subtotal"
            />
            <q-checkbox v-model="formulario.conIva" label="Lleva IVA 15 %" />
            <div v-if="totalValido" class="text-suave" style="font-size: 13px">
              IVA {{ formatoMoneda(iva) }} · Total <strong>{{ formatoMoneda(total) }}</strong>
            </div>
          </div>

          <div class="safic-campo">
            <label for="fac-detalle" class="safic-campo__etiqueta">Detalle (opcional)</label>
            <q-input
              v-model="formulario.descripcion"
              for="fac-detalle"
              class="safic-input"
              outlined
              maxlength="200"
              hide-bottom-space
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
              label="Registrar factura"
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
import { computed, reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';

import { useRegistrarFactura } from '../composables/useGastos';
import { useProveedores } from '../composables/useProveedores';
import { normalizarMonto } from '../cuotas.logica';
import {
  facturaVacia,
  ivaDe,
  peticionFactura,
  totalDe,
  validarFactura,
  type ErroresFactura,
} from '../proveedores.logica';
import type { Gasto } from '../services/gastos.service';

const props = defineProps<{ proveedorId?: number }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<Gasto>();

const hoy = hoyEcuador();
const formulario = reactive({ ...facturaVacia(hoy), proveedorId: props.proveedorId ?? null });
const errores = reactive<ErroresFactura>({});
const errorGeneral = ref<string | null>(null);

const proveedores = useProveedores(ref('todos'), ref(''));
const opciones = computed(() =>
  (proveedores.data.value?.proveedores ?? []).map((p) => ({
    value: p.id,
    label: `${p.razon_social} · RUC ${p.ruc}`,
  })),
);

const subtotal = computed(() => normalizarMonto(formulario.subtotal));
const totalValido = computed(() => /^\d{1,8}(\.\d{1,2})?$/.test(subtotal.value));
const iva = computed(() => ivaDe(subtotal.value, formulario.conIva));
const total = computed(() => totalDe(subtotal.value, formulario.conIva));

const registrar = useRegistrarFactura();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se registra dos veces
  if (registrar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['proveedorId', 'numero', 'fechaEmision', 'venceEl', 'subtotal'] as const)
    errores[k] = undefined;

  const problemas = validarFactura(formulario, hoy);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    onDialogOK(await registrar.mutateAsync(peticionFactura(formulario)));
  } catch (error) {
    const apiError = aApiError(error);
    errores.proveedorId = apiError.campo('proveedor_id');
    errores.numero = apiError.campo('numero');
    errores.fechaEmision = apiError.campo('fecha_emision');
    errores.venceEl = apiError.campo('vence_el');
    errores.subtotal = apiError.campo('subtotal');
    if (!Object.values(errores).some(Boolean)) {
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa la lista antes de reintentar: la factura pudo registrarse.`
        : apiError.mensaje;
    }
  }
}
</script>
