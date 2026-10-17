<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">
              {{ recurrente ? `Editar: ${recurrente.nombre}` : 'Nuevo gasto recurrente' }}
            </div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Cada mes, desde su día, se crea el gasto y se avisa para adjuntar la factura real.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="rec-nombre" class="safic-campo__etiqueta">Gasto</label>
            <q-input
              v-model="f.nombre"
              for="rec-nombre"
              class="safic-input"
              outlined
              maxlength="80"
              autofocus
              hide-bottom-space
              placeholder="Ej.: Guardianía"
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="safic-campo">
            <label for="rec-prov" class="safic-campo__etiqueta">Proveedor</label>
            <q-select
              v-model="f.proveedorId"
              for="rec-prov"
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

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 180px">
              <label for="rec-categoria" class="safic-campo__etiqueta">Categoría (opcional)</label>
              <q-input
                v-model="f.categoria"
                for="rec-categoria"
                class="safic-input"
                outlined
                maxlength="60"
                hide-bottom-space
              />
            </div>
            <div class="safic-campo col" style="min-width: 120px">
              <label for="rec-dia" class="safic-campo__etiqueta">Día del mes</label>
              <q-input
                v-model="f.dia"
                for="rec-dia"
                class="safic-input"
                outlined
                inputmode="numeric"
                hide-bottom-space
                :error="!!errores.dia"
                :error-message="errores.dia"
              />
            </div>
          </div>

          <div class="safic-campo">
            <q-checkbox v-model="f.variable" label="Monto variable" />
            <div class="text-suave" style="font-size: 12px">
              Para luz y agua: se crea sin monto y se completa con la factura.
            </div>
            <q-input
              v-if="!f.variable"
              v-model="f.monto"
              class="safic-input q-mt-sm"
              outlined
              inputmode="decimal"
              prefix="$"
              label="Monto"
              hide-bottom-space
              :error="!!errores.monto"
              :error-message="errores.monto"
            />
          </div>

          <div v-if="!f.variable" class="safic-campo">
            <q-checkbox v-model="f.aprobacionAutomatica" label="Aprobación automática de nivel 1" />
            <div class="text-suave" style="font-size: 12px">
              Solo si la factura coincide con el monto. Sobre el umbral de segunda aprobación igual
              pasa por la directiva.
            </div>
          </div>

          <div class="row justify-between items-center" style="gap: 10px">
            <q-btn
              v-if="recurrente"
              flat
              no-caps
              :color="recurrente.activo ? 'negative' : 'primary'"
              :label="recurrente.activo ? 'Pausar' : 'Reanudar'"
              :disable="ocupado"
              @click="alternarPausa"
            />
            <span v-else />
            <div class="row" style="gap: 10px">
              <q-btn
                unelevated
                no-caps
                class="safic-btn safic-btn--secundario"
                label="Cancelar"
                :disable="ocupado"
                @click="onDialogCancel"
              />
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="safic-btn"
                label="Guardar"
                :loading="ocupado"
              />
            </div>
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { useCrearRecurrente, useEditarRecurrente } from '../composables/useRecurrentes';
import { useProveedores } from '../composables/useProveedores';
import {
  cambiosDeRecurrente,
  formularioDeRecurrente,
  peticionRecurrente,
  recurrenteVacio,
  validarRecurrente,
  type ErroresRecurrente,
} from '../recurrentes.logica';
import type { GastoRecurrente } from '../services/recurrentes.service';

const props = defineProps<{ recurrente?: GastoRecurrente }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: el proveedor ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const f = reactive(props.recurrente ? formularioDeRecurrente(props.recurrente) : recurrenteVacio());
const errores = reactive<ErroresRecurrente>({});
const errorGeneral = ref<string | null>(null);

const proveedores = useProveedores(ref('todos'), ref(''));
const opciones = computed(() =>
  (proveedores.data.value?.proveedores ?? []).map((p) => ({
    value: p.id,
    label: `${p.razon_social} · RUC ${p.ruc}`,
  })),
);

const crear = useCrearRecurrente();
const editar = useEditarRecurrente();
const ocupado = computed(() => crear.isPending.value || editar.isPending.value);

function mostrarError(error: unknown): void {
  const apiError = aApiError(error);
  errores.nombre = apiError.campo('nombre');
  errores.proveedorId = apiError.campo('proveedor_id');
  errores.monto = apiError.campo('monto');
  errores.dia = apiError.campo('dia_mes');
  if (!Object.values(errores).some(Boolean)) {
    // Sin respuesta o 5xx el cambio pudo guardarse: se avisa para no crear el gasto dos veces
    const incierto = apiError.estado === 0 || apiError.estado >= 500;
    errorGeneral.value = incierto
      ? `${apiError.mensaje} Revisa la lista antes de reintentar: el cambio pudo guardarse.`
      : apiError.mensaje;
  }
}

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se guarda dos veces
  if (ocupado.value) return;
  errorGeneral.value = null;
  for (const k of ['nombre', 'proveedorId', 'monto', 'dia'] as const) errores[k] = undefined;

  const problemas = validarRecurrente(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    if (props.recurrente) {
      const cambios = cambiosDeRecurrente(props.recurrente, f);
      if (Object.keys(cambios).length === 0) {
        onDialogCancel();
        return;
      }
      await editar.mutateAsync({ id: props.recurrente.id, cambios });
      onDialogOK(`${f.nombre.trim()}: cambios guardados.`);
    } else {
      await crear.mutateAsync(peticionRecurrente(f));
      onDialogOK(`Gasto recurrente «${f.nombre.trim()}» creado.`);
    }
  } catch (error) {
    mostrarError(error);
  }
}

async function alternarPausa(): Promise<void> {
  if (ocupado.value || !props.recurrente) return;
  errorGeneral.value = null;
  const pausar = props.recurrente.activo;
  try {
    await editar.mutateAsync({ id: props.recurrente.id, cambios: { activo: !pausar } });
    onDialogOK(`${props.recurrente.nombre}: ${pausar ? 'pausado' : 'reanudado'}.`);
  } catch (error) {
    mostrarError(error);
  }
}
</script>
