<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 460px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div>
            <div class="safic-dialogo__titulo">Ingreso sin QR</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Confirma con el residente (o la administración) antes de dejar pasar.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <q-btn-toggle
            v-model="f.tipo"
            no-caps
            unelevated
            toggle-color="primary"
            :options="opcionesTipo"
            aria-label="Tipo de ingreso"
          />

          <div class="safic-campo">
            <label for="sq-nombre" class="safic-campo__etiqueta">Nombre</label>
            <q-input
              v-model="f.nombre"
              for="sq-nombre"
              class="safic-input"
              outlined
              maxlength="120"
              autofocus
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 150px">
              <label for="sq-unidad" class="safic-campo__etiqueta">
                Unidad{{ f.tipo === 'visita' ? '' : ' (opcional)' }}
              </label>
              <q-input
                v-model="f.unidad"
                for="sq-unidad"
                class="safic-input"
                outlined
                maxlength="20"
                placeholder="Ej.: A-102"
                hide-bottom-space
                :error="!!errores.unidad"
                :error-message="errores.unidad"
              />
            </div>
            <div v-if="f.tipo !== 'visita'" class="safic-campo col" style="min-width: 150px">
              <label for="sq-destino" class="safic-campo__etiqueta">Lugar</label>
              <q-input
                v-model="f.destino"
                for="sq-destino"
                class="safic-input"
                outlined
                maxlength="80"
                placeholder="Ej.: Torre B"
                hide-bottom-space
                :error="!!errores.destino"
                :error-message="errores.destino"
              />
            </div>
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 150px">
              <label for="sq-cedula" class="safic-campo__etiqueta">Cédula (opcional)</label>
              <q-input
                v-model="f.cedula"
                for="sq-cedula"
                class="safic-input"
                outlined
                maxlength="20"
                hide-bottom-space
                :error="!!errores.cedula"
                :error-message="errores.cedula"
              />
            </div>
            <div class="safic-campo col" style="min-width: 150px">
              <label for="sq-placa" class="safic-campo__etiqueta">Placa (opcional)</label>
              <q-input
                v-model="f.placa"
                for="sq-placa"
                class="safic-input"
                outlined
                maxlength="8"
                hide-bottom-space
                :error="!!errores.placa"
                :error-message="errores.placa"
              />
            </div>
          </div>

          <div class="safic-campo">
            <div class="safic-campo__etiqueta">¿Quién autorizó?</div>
            <q-option-group
              v-model="f.autorizadoPor"
              type="radio"
              inline
              :options="[
                { label: 'Llamada al residente', value: 'llamada' },
                { label: 'Administración', value: 'administracion' },
              ]"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="registrando.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              v-if="f.unidad.trim() !== '' && offline.enLinea.value"
              outline
              no-caps
              color="primary"
              class="safic-btn"
              label="Preguntar al residente"
              :loading="preguntando.isPending.value"
              :disable="registrando.isPending.value"
              @click="preguntar"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Registrar ingreso"
              :loading="registrando.isPending.value"
              :disable="preguntando.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { onBeforeUnmount, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { useIngresoSinQr, usePedirPermiso } from '../composables/useGarita';
import { sinRed, useGaritaOffline } from '../composables/useGaritaOffline';
import { ingresoLibreLocal } from '../offline.logica';
import {
  peticionSinQr,
  sinQrVacio,
  TIPOS_ACCESO,
  validarSinQr,
  type ErroresSinQr,
} from '../garita.logica';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const opcionesTipo = TIPOS_ACCESO.map((t) => ({ label: t.singular, value: t.id }));
const f = reactive(sinQrVacio());
const errores = reactive<ErroresSinQr>({});
const errorGeneral = ref<string | null>(null);
const registrando = useIngresoSinQr();
const preguntando = usePedirPermiso();
const offline = useGaritaOffline();
onBeforeUnmount(() => offline.liberar());

/** Guarda el ingreso en el teléfono para enviarlo al volver la red. */
async function guardarSinConexion(): Promise<void> {
  const p = peticionSinQr(f);
  const guardado = await offline.registrarIngreso(
    ingresoLibreLocal(
      { ...p, autorizado_por: p.autorizado_por as 'llamada' | 'administracion' },
      Date.now(),
    ),
  );
  if (!guardado) {
    errorGeneral.value =
      'No se pudo guardar en el teléfono (sin espacio o modo privado). Anota el ingreso a mano y no cierres esta pestaña.';
    return;
  }
  onDialogOK(`Ingreso de ${p.nombre} guardado sin conexión. Se enviará al volver la red.`);
}

/** En vez de llamar por teléfono: el residente decide desde su app y el guardia ve la respuesta en la lista. */
async function preguntar(): Promise<void> {
  if (preguntando.isPending.value || registrando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresSinQr)[]) errores[k] = undefined;

  const problemas = validarSinQr(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await preguntando.mutateAsync({
      unidad_codigo: f.unidad.trim(),
      nombre: f.nombre.trim(),
      tipo: f.tipo,
      placa: f.placa.trim() === '' ? null : f.placa.trim().toUpperCase(),
    });
    onDialogOK(
      `Se le preguntó a ${f.unidad.trim().toUpperCase()} por ${f.nombre.trim()}. Tiene 3 minutos para responder.`,
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.nombre = apiError.campo('nombre');
    errores.placa = apiError.campo('placa');
    if (apiError.codigo === 'UNIDAD_NO_ENCONTRADA') errores.unidad = apiError.mensaje;
    // Nadie de la unidad usa la app, o ya se le preguntó: el guardia sigue por teléfono / espera
    if (apiError.codigo === 'SIN_RESIDENTES_CON_CUENTA') {
      errorGeneral.value =
        'Nadie de esa unidad usa la app. Llama por teléfono y usa «Registrar ingreso».';
    } else if (apiError.codigo === 'SOLICITUD_ABIERTA') {
      errorGeneral.value =
        'Ya le preguntaste a esa unidad por esta persona. Espera su respuesta en la lista.';
    } else if (!Object.values(errores).some(Boolean)) {
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa la lista de solicitudes antes de reintentar: la pregunta pudo enviarse.`
          : apiError.mensaje;
    }
  }
}

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se registra dos veces
  if (registrando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresSinQr)[]) errores[k] = undefined;

  const problemas = validarSinQr(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  if (!navigator.onLine) {
    await guardarSinConexion();
    return;
  }

  try {
    await registrando.mutateAsync(peticionSinQr(f));
    onDialogOK(`Ingreso de ${f.nombre.trim()} registrado.`);
  } catch (error) {
    // Se cayó la red al enviar: el ingreso no se pierde, queda en el teléfono
    if (sinRed(error)) {
      await guardarSinConexion();
      return;
    }
    const apiError = aApiError(error);
    errores.nombre = apiError.campo('nombre');
    errores.cedula = apiError.campo('documento');
    errores.placa = apiError.campo('placa');
    if (apiError.codigo === 'UNIDAD_NO_ENCONTRADA' || apiError.codigo === 'UNIDAD_REQUERIDA') {
      errores.unidad = apiError.mensaje;
    } else if (apiError.codigo === 'DESTINO_REQUERIDO') {
      errores.destino = apiError.mensaje;
    }
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el ingreso pudo registrarse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa «Dentro ahora» antes de reintentar: el ingreso pudo registrarse.`
          : apiError.mensaje;
    }
  }
}
</script>
