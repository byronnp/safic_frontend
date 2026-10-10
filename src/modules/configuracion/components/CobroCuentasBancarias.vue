<template>
  <!-- Cuentas a las que transfieren los residentes (mockup F2Pagar) -->
  <section class="cuentas safic-card" aria-labelledby="cuentas-titulo">
    <div class="cuentas__encabezado">
      <div>
        <h2 id="cuentas-titulo" class="cuentas__titulo">CUENTAS PARA RECIBIR PAGOS</h2>
        <p class="cuentas__ayuda">
          Los residentes ven la cuenta principal para transferir sus cuotas.
        </p>
      </div>
      <q-btn outline no-caps color="primary" label="Agregar cuenta" @click="abrirNueva" />
    </div>

    <div v-if="consulta.isPending.value" aria-busy="true">
      <q-skeleton v-for="i in 2" :key="i" type="rect" height="52px" class="q-mb-sm" />
    </div>
    <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>
    <template v-else>
      <div v-if="errorLista" class="safic-alerta" role="alert">{{ errorLista }}</div>
      <div v-if="!cuentas.length" class="cuentas__vacio">
        Aún no hay cuentas. Agrega la del condominio para que los residentes puedan pagar.
      </div>
      <ul v-else class="cuentas__lista">
        <li
          v-for="c in cuentas"
          :key="c.id"
          class="cuenta"
          :class="{ 'cuenta--inactiva': !c.activa }"
        >
          <div class="cuenta__datos">
            <div class="cuenta__banco">
              {{ c.banco }} · {{ etiquetaTipo(c.tipo) }} {{ numeroEnmascarado(c.numero) }}
              <span v-if="c.es_principal" class="cuenta__chip">Principal</span>
              <span v-if="!c.activa" class="cuenta__chip cuenta__chip--apagado">Inactiva</span>
            </div>
            <div class="cuenta__titular">{{ c.titular }}</div>
          </div>
          <div class="cuenta__acciones">
            <button type="button" :disabled="ocupado" @click="abrirEditar(c)">Editar</button>
            <button
              v-if="c.activa && !c.es_principal"
              type="button"
              :disabled="ocupado"
              @click="marcarPrincipal(c)"
            >
              Hacer principal
            </button>
            <button type="button" :disabled="ocupado" @click="alternarActiva(c)">
              {{ c.activa ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </li>
      </ul>
    </template>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="cuentas__dialogo">
        <q-form novalidate @submit="guardar">
          <q-card-section>
            <div class="text-h6">{{ editando ? 'Editar cuenta' : 'Agregar cuenta' }}</div>
          </q-card-section>
          <q-card-section class="column" style="gap: 12px">
            <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
            <q-input
              v-model="formulario.banco"
              outlined
              dense
              label="Banco"
              maxlength="60"
              :error="!!errores.banco"
              :error-message="errores.banco"
            />
            <q-select
              v-model="formulario.tipo"
              outlined
              dense
              label="Tipo de cuenta"
              emit-value
              map-options
              :options="TIPOS_CUENTA.map((t) => ({ label: t.etiqueta, value: t.valor }))"
            />
            <q-input
              v-model="formulario.numero"
              outlined
              dense
              label="Número de cuenta"
              maxlength="30"
              :error="!!errores.numero"
              :error-message="errores.numero"
            />
            <q-input
              v-model="formulario.titular"
              outlined
              dense
              label="Titular"
              maxlength="120"
              :error="!!errores.titular"
              :error-message="errores.titular"
            />
            <q-checkbox
              v-model="formulario.esPrincipal"
              label="Es la cuenta principal (la que ven los residentes)"
              :disable="editando?.es_principal === true"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" :disable="guardando" @click="dialogo = false" />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Guardar"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import {
  cambiosDe,
  FORMULARIO_CUENTA_VACIO,
  formularioDesde,
  numeroEnmascarado,
  peticionNueva,
  TIPOS_CUENTA,
  validarCuenta,
  type ErroresCuenta,
  type FormularioCuenta,
} from '../cuentas-bancarias.logica';
import {
  useCrearCuentaBancaria,
  useCuentasBancarias,
  useEditarCuentaBancaria,
} from '../composables/useCuentasBancarias';
import type { CuentaBancaria } from '../services/cuentas-bancarias.service';

const $q = useQuasar();
const consulta = useCuentasBancarias();
const crear = useCrearCuentaBancaria();
const editar = useEditarCuentaBancaria();

const cuentas = computed(() => consulta.data.value ?? []);
const guardando = computed(() => crear.isPending.value || editar.isPending.value);
const ocupado = guardando;

const dialogo = ref(false);
const editando = ref<CuentaBancaria | null>(null);
const formulario = reactive<FormularioCuenta>({ ...FORMULARIO_CUENTA_VACIO });
const errores = reactive<ErroresCuenta>({});
const errorGeneral = ref<string | null>(null);
const errorLista = ref<string | null>(null);

function etiquetaTipo(tipo: string): string {
  return TIPOS_CUENTA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

function limpiar(): void {
  errores.banco = undefined;
  errores.numero = undefined;
  errores.titular = undefined;
  errorGeneral.value = null;
}

function abrirNueva(): void {
  limpiar();
  editando.value = null;
  Object.assign(formulario, FORMULARIO_CUENTA_VACIO);
  dialogo.value = true;
}

function abrirEditar(cuenta: CuentaBancaria): void {
  limpiar();
  editando.value = cuenta;
  Object.assign(formulario, formularioDesde(cuenta));
  dialogo.value = true;
}

function mostrarErrorApi(e: unknown): void {
  const apiError = aApiError(e);
  errores.banco = apiError.campo('banco');
  errores.numero = apiError.campo('numero');
  errores.titular = apiError.campo('titular');
  if (!errores.banco && !errores.numero && !errores.titular) {
    errorGeneral.value = apiError.mensaje;
  }
}

async function guardar(): Promise<void> {
  if (guardando.value) return;
  limpiar();
  Object.assign(errores, validarCuenta(formulario));
  if (errores.banco || errores.numero || errores.titular) return;

  try {
    if (editando.value) {
      const cambios = cambiosDe(editando.value, formulario);
      if (Object.keys(cambios).length > 0) {
        await editar.mutateAsync({ id: editando.value.id, cambios });
      }
    } else {
      await crear.mutateAsync(peticionNueva(formulario));
    }
    dialogo.value = false;
    $q.notify({ type: 'positive', message: 'Cuenta guardada.' });
  } catch (e) {
    mostrarErrorApi(e);
  }
}

async function cambio(
  cuenta: CuentaBancaria,
  cambios: { es_principal?: boolean; activa?: boolean },
  mensaje: string,
): Promise<void> {
  errorLista.value = null;
  try {
    await editar.mutateAsync({ id: cuenta.id, cambios });
    $q.notify({ type: 'positive', message: mensaje });
  } catch (e) {
    errorLista.value = aApiError(e).mensaje;
  }
}

function marcarPrincipal(cuenta: CuentaBancaria): void {
  void cambio(cuenta, { es_principal: true }, 'Ahora es la cuenta principal.');
}

function alternarActiva(cuenta: CuentaBancaria): void {
  if (!cuenta.activa) {
    void cambio(cuenta, { activa: true }, 'Cuenta activada.');
    return;
  }
  // Los residentes dejan de verla para transferir: se pide confirmar
  $q.dialog({
    title: 'Desactivar cuenta',
    message: `${cuenta.banco} ${numeroEnmascarado(cuenta.numero)} dejará de usarse para recibir pagos${cuenta.es_principal ? ' y la principal pasará a otra cuenta activa' : ''}.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Desactivar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => void cambio(cuenta, { activa: false }, 'Cuenta desactivada.'));
}
</script>

<style scoped>
.cuentas {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cuentas__encabezado {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.cuentas__titulo {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--safic-texto-suave);
}

.cuentas__ayuda {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--safic-texto-2);
}

.cuentas__vacio {
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.cuentas__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cuenta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  padding: 12px 14px;
}

.cuenta--inactiva {
  opacity: 0.6;
}

.cuenta__datos {
  flex: 1 1 240px;
  min-width: 0;
}

.cuenta__banco {
  font-size: 14px;
  font-weight: 700;
}

.cuenta__titular {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cuenta__chip {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 11px;
  font-weight: 800;
}

.cuenta__chip--apagado {
  background: #f1efe8;
  color: #6b675d;
}

.cuenta__acciones {
  display: flex;
  gap: 12px;
}

.cuenta__acciones button {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  color: var(--q-primary);
  cursor: pointer;
  text-decoration: underline;
}

.cuenta__acciones button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cuentas__dialogo {
  width: 440px;
  max-width: 92vw;
}
</style>
