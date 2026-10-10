<template>
  <section class="reglas safic-card" aria-labelledby="reglas-titulo">
    <div>
      <h2 id="reglas-titulo" class="reglas__titulo">REGLAS DE DINERO</h2>
      <p class="reglas__ayuda">
        Cuándo una factura necesita una segunda aprobación, quién puede pagarla y cuánto se perdona
        de diferencia con el banco.
      </p>
    </div>

    <div v-if="consulta.isPending.value" aria-busy="true">
      <q-skeleton v-for="i in 3" :key="i" type="rect" height="52px" class="q-mb-sm" />
    </div>
    <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <q-form v-else novalidate class="reglas__form" @submit="guardar">
      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
      <div v-if="guardado" class="reglas__ok" role="status">Reglas guardadas.</div>

      <div class="safic-campo">
        <label for="reglas-umbral" class="safic-campo__etiqueta">
          Segunda aprobación desde (USD)
        </label>
        <q-input
          v-model="f.umbral"
          for="reglas-umbral"
          class="safic-input"
          outlined
          inputmode="decimal"
          prefix="$"
          hide-bottom-space
          :error="!!errores.umbral"
          :error-message="errores.umbral"
        />
        <div class="reglas__nota">
          Las facturas que superan este monto necesitan, además de la administración, la aprobación
          del presidente o del vicepresidente.
        </div>
      </div>

      <div class="safic-campo">
        <label for="reglas-tolerancia" class="safic-campo__etiqueta">
          Tolerancia bancaria (USD)
        </label>
        <q-input
          v-model="f.tolerancia"
          for="reglas-tolerancia"
          class="safic-input"
          outlined
          inputmode="decimal"
          prefix="$"
          hide-bottom-space
          :error="!!errores.tolerancia"
          :error-message="errores.tolerancia"
        />
        <div class="reglas__nota">
          Si a una cuota le faltan menos centavos que esto, se da por pagada y la diferencia queda
          registrada.
        </div>
      </div>

      <q-checkbox
        v-model="f.aprobadorPuedePagar"
        label="Quien aprobó una factura también puede pagarla"
      />
      <div class="reglas__nota">
        Desactivado es lo más seguro: quien aprueba y quien paga son personas distintas.
      </div>

      <div class="row justify-end">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="safic-btn"
          label="Guardar reglas"
          :loading="mutacion.isPending.value"
        />
      </div>
    </q-form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { useSessionStore } from '@/stores/session';

import { aApiError } from '@/core/api/errors';

import { useGuardarReglasFinanzas, useReglasFinanzas } from '../composables/useReglasFinanzas';
import {
  cambiosDeReglas,
  formularioDeReglas,
  validarReglas,
  type ErroresReglas,
  type FormularioReglas,
} from '../reglas-finanzas.logica';

const session = useSessionStore();
const consulta = useReglasFinanzas();
const mutacion = useGuardarReglasFinanzas();

const f = reactive<FormularioReglas>({ umbral: '', aprobadorPuedePagar: false, tolerancia: '' });
const errores = reactive<ErroresReglas>({});
const errorGeneral = ref<string | null>(null);
const guardado = ref(false);

watch(
  () => consulta.data.value,
  (r) => {
    if (r) Object.assign(f, formularioDeReglas(r));
  },
  { immediate: true },
);

// Al cambiar de condominio no queda el aviso ni los errores del anterior
watch(
  () => session.condominioId,
  () => {
    guardado.value = false;
    errorGeneral.value = null;
    errores.umbral = undefined;
    errores.tolerancia = undefined;
  },
);

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario
  if (mutacion.isPending.value || !consulta.data.value) return;
  errorGeneral.value = null;
  guardado.value = false;
  errores.umbral = undefined;
  errores.tolerancia = undefined;

  const problemas = validarReglas(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  const cambios = cambiosDeReglas(consulta.data.value, f);
  if (Object.keys(cambios).length === 0) {
    guardado.value = true;
    return;
  }

  try {
    await mutacion.mutateAsync(cambios);
    guardado.value = true;
  } catch (error) {
    const apiError = aApiError(error);
    errores.umbral = apiError.campo('umbral_segunda_aprobacion');
    errores.tolerancia = apiError.campo('tolerancia_bancaria');
    if (!errores.umbral && !errores.tolerancia) errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.reglas {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
}

.reglas__titulo {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: var(--safic-texto-suave);
}

.reglas__ayuda,
.reglas__nota {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.reglas__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}

.reglas__ok {
  padding: 10px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}
</style>
