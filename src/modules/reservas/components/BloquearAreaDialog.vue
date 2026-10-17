<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Bloquear área</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Nadie podrá reservar el área en ese horario.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div v-if="avisoReservas" class="safic-alerta" role="alert">
            {{ avisoReservas }}
            <q-checkbox v-model="f.cancelar" label="Cancelar esas reservas y bloquear" />
          </div>

          <div class="safic-campo">
            <label for="blq-area" class="safic-campo__etiqueta">Área</label>
            <q-select
              v-model="f.areaId"
              for="blq-area"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="opciones"
              :error="!!errores.areaId"
              :error-message="errores.areaId"
            />
          </div>

          <div class="safic-campo">
            <label for="blq-fecha" class="safic-campo__etiqueta">Fecha</label>
            <q-input
              v-model="f.fecha"
              for="blq-fecha"
              class="safic-input"
              outlined
              type="date"
              :min="hoy"
              hide-bottom-space
              :error="!!errores.fecha"
              :error-message="errores.fecha"
            />
          </div>

          <q-checkbox v-model="f.todoElDia" label="Todo el día" />
          <div v-if="!f.todoElDia" class="row" style="gap: 12px">
            <div class="safic-campo col">
              <label for="blq-ini" class="safic-campo__etiqueta">Desde</label>
              <q-input
                v-model="f.inicio"
                for="blq-ini"
                class="safic-input"
                outlined
                type="time"
                hide-bottom-space
                :error="!!errores.inicio"
                :error-message="errores.inicio"
              />
            </div>
            <div class="safic-campo col">
              <label for="blq-fin" class="safic-campo__etiqueta">Hasta</label>
              <q-input
                v-model="f.fin"
                for="blq-fin"
                class="safic-input"
                outlined
                type="time"
                hide-bottom-space
                :error="!!errores.fin"
                :error-message="errores.fin"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="blq-motivo" class="safic-campo__etiqueta">Motivo</label>
            <q-input
              v-model="f.motivo"
              for="blq-motivo"
              class="safic-input"
              outlined
              maxlength="120"
              hide-bottom-space
              placeholder="Ej.: Mantenimiento de la parrilla"
              :error="!!errores.motivo"
              :error-message="errores.motivo"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="bloqueando.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              :label="avisoReservas ? 'Bloquear y cancelar' : 'Bloquear'"
              :loading="bloqueando.isPending.value"
            />
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
import { hoyEcuador } from '@/utils/fecha';

import { validarBloqueo, type ErroresBloqueo } from '../bloqueo.logica';
import { useBloquearArea } from '../composables/useAgenda';
import type { AreaAgenda } from '../services/agenda.service';

const props = defineProps<{ areas: AreaAgenda[]; fecha?: string; areaId?: number }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: las áreas ya no serían de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const hoy = hoyEcuador();
const f = reactive({
  areaId: props.areaId ?? props.areas[0]?.id ?? null,
  fecha: props.fecha ?? hoy,
  todoElDia: true,
  inicio: '08:00',
  fin: '12:00',
  motivo: '',
  cancelar: false,
});
const errores = reactive<ErroresBloqueo>({});
const errorGeneral = ref<string | null>(null);
const avisoReservas = ref<string | null>(null);
const bloqueando = useBloquearArea();

// Un aviso de reservas afectadas era de la selección anterior: al cambiarla hay que volver a confirmar
watch(
  () => [f.areaId, f.fecha, f.todoElDia, f.inicio, f.fin],
  () => {
    avisoReservas.value = null;
    f.cancelar = false;
  },
);

const opciones = computed(() => props.areas.map((a) => ({ value: a.id, label: a.nombre })));

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se bloquea dos veces
  if (bloqueando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['areaId', 'fecha', 'inicio', 'fin', 'motivo'] as const) errores[k] = undefined;

  const problemas = validarBloqueo(f, hoy);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    const r = await bloqueando.mutateAsync({
      amenidad_id: f.areaId as number,
      fecha: f.fecha,
      inicio: f.todoElDia ? null : f.inicio,
      fin: f.todoElDia ? null : f.fin,
      motivo: f.motivo.trim(),
      cancelar_reservas: f.cancelar,
    });
    onDialogOK(
      r.reservasCanceladas > 0
        ? `Área bloqueada. Se cancelaron ${r.reservasCanceladas} reserva(s) y se avisó a los residentes.`
        : 'Área bloqueada.',
    );
  } catch (error) {
    const apiError = aApiError(error);
    if (apiError.codigo === 'HAY_RESERVAS_AFECTADAS') {
      // Se pide confirmar: nada se bloqueó ni se canceló todavía
      avisoReservas.value = apiError.mensaje;
      f.cancelar = false;
      return;
    }
    errores.areaId = apiError.campo('amenidad_id');
    errores.fecha = apiError.campo('fecha');
    errores.inicio = apiError.campo('inicio');
    errores.fin = apiError.campo('fin');
    errores.motivo = apiError.campo('motivo');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el bloqueo pudo crearse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa la agenda antes de reintentar: el bloqueo pudo crearse.`
          : apiError.mensaje;
    }
  }
}
</script>
