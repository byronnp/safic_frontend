<template>
  <q-page class="safic-main provs">
    <PaginaEncabezado miga="Finanzas / Proveedores" titulo="Proveedores">
      <template #acciones>
        <ImportarFacturaXmlBoton
          v-if="puedeRegistrar"
          @importada="resultado = null"
          @error="(m) => (errorImportar = m)"
        />
        <q-btn
          v-if="puedeEditar"
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          icon="sym_r_add"
          label="Nuevo proveedor"
          @click="nuevo"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="errorImportar" class="safic-alerta" role="alert">{{ errorImportar }}</div>
    <div v-if="resultado" class="provs__resultado" role="status">{{ resultado }}</div>

    <div class="provs__filtros">
      <div role="tablist" aria-label="Filtro de proveedores" class="provs__pildoras">
        <button
          v-for="f in FILTROS_PROVEEDORES"
          :key="f.valor"
          type="button"
          role="tab"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': f.valor === filtro }"
          :aria-selected="f.valor === filtro"
          @click="filtro = f.valor"
        >
          {{ f.etiqueta }}{{ lista ? ` (${lista.conteos[f.valor]})` : '' }}
        </button>
      </div>
      <q-input
        v-model="buscar"
        class="safic-input provs__buscar"
        outlined
        dense
        clearable
        placeholder="Nombre o RUC"
        aria-label="Buscar proveedor por nombre o RUC"
      >
        <template #prepend><q-icon name="sym_r_search" /></template>
      </q-input>
    </div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="provs__cuerpo">
      <section class="safic-card provs__tabla" aria-label="Proveedores">
        <div class="provs__fila provs__fila--cabecera" role="row">
          <div>PROVEEDOR</div>
          <div>CATEGORÍA</div>
          <div class="text-right">SALDO POR PAGAR</div>
          <div>ESTADO</div>
        </div>

        <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
          <q-skeleton v-for="i in 5" :key="i" type="rect" height="44px" class="q-mb-sm" />
        </div>
        <template v-else-if="lista">
          <button
            v-for="p in lista.proveedores"
            :key="p.id"
            type="button"
            class="provs__fila provs__fila--dato"
            :class="{ 'provs__fila--activa': p.id === seleccionadoId }"
            :aria-pressed="p.id === seleccionadoId"
            @click="seleccionadoId = p.id"
          >
            <div>
              <div class="text-weight-bold">{{ p.razon_social }}</div>
              <div class="provs__sub">RUC {{ p.ruc }}</div>
            </div>
            <div>{{ p.categoria ?? '—' }}</div>
            <div class="text-right provs__monto">{{ formatoMoneda(p.saldo_por_pagar) }}</div>
            <div>
              <EstadoBadge :tono="estadoDe(p).tono">{{ estadoDe(p).texto }}</EstadoBadge>
            </div>
          </button>

          <div v-if="lista.proveedores.length === 0" class="provs__vacio">
            <q-icon name="sym_r_local_shipping" size="40px" class="text-suave" />
            <div class="text-weight-bold">{{ vacio.titulo }}</div>
            <div class="text-suave">{{ vacio.detalle }}</div>
            <q-btn
              v-if="puedeEditar && filtro === 'todos' && buscar === ''"
              unelevated
              no-caps
              color="primary"
              class="safic-btn"
              label="Agregar el primero"
              @click="nuevo"
            />
          </div>
        </template>
      </section>

      <aside v-if="seleccionado" class="safic-card provs__detalle" aria-labelledby="provs-detalle">
        <div>
          <h2 id="provs-detalle" class="provs__detalle-titulo">{{ seleccionado.razon_social }}</h2>
          <div class="provs__sub">
            RUC {{ seleccionado.ruc }}
            <template v-if="seleccionado.email"> · {{ seleccionado.email }}</template>
            <template v-if="seleccionado.telefono"> · {{ seleccionado.telefono }}</template>
          </div>
        </div>

        <div class="provs__seccion">CUENTA PARA PAGOS</div>
        <dl v-if="seleccionado.cuenta" class="provs__cuenta">
          <dt>Banco</dt>
          <dd>{{ seleccionado.cuenta.banco }}</dd>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoCuenta(seleccionado.cuenta.tipo) }}</dd>
          <dt>Número</dt>
          <dd>{{ seleccionado.cuenta.numero }}</dd>
          <dt>Titular</dt>
          <dd>{{ seleccionado.cuenta.titular }}</dd>
        </dl>
        <div v-else class="provs__sub">Todavía no tiene una cuenta registrada.</div>

        <div v-if="seleccionado.cambio_de_cuenta" class="provs__cambio" role="status">
          <q-icon name="sym_r_schedule" size="20px" />
          <div>
            <div class="text-weight-bold">Cambio de cuenta solicitado</div>
            <div class="provs__sub">
              {{ seleccionado.cambio_de_cuenta.banco }} ·
              {{ etiquetaTipoCuenta(seleccionado.cambio_de_cuenta.tipo) }}.
              {{ textoCambioDeCuenta(seleccionado.cambio_de_cuenta) }}
            </div>
            <q-btn
              v-if="puedeEditar"
              flat
              no-caps
              dense
              color="negative"
              label="Detener el cambio"
              :loading="detener.isPending.value"
              @click="detenerCambio(seleccionado)"
            />
          </div>
        </div>

        <div v-if="errorDetalle" class="safic-alerta" role="alert">{{ errorDetalle }}</div>

        <div class="provs__acciones">
          <q-btn
            v-if="puedeEditar && !seleccionado.cambio_de_cuenta"
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            :label="seleccionado.cuenta ? 'Cambiar la cuenta' : 'Agregar cuenta'"
            @click="cambiarCuenta(seleccionado)"
          />
          <q-btn
            v-if="puedeEditar"
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Editar datos"
            @click="editar(seleccionado)"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            label="Ver facturas"
            :to="{ name: 'finanzas-cuentas-por-pagar', query: { buscar: seleccionado.ruc } }"
          />
        </div>
        <div v-if="puedeEditar" class="provs__sub">
          Cambiar la cuenta pide tu contraseña, avisa a administración y tesorería y espera 24
          horas.
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { formatoMoneda } from '@/utils/formato';

import CambiarCuentaProveedorDialog from '../components/CambiarCuentaProveedorDialog.vue';
import ImportarFacturaXmlBoton from '../components/ImportarFacturaXmlBoton.vue';
import ProveedorDialog from '../components/ProveedorDialog.vue';
import { useDetenerCambioCuenta, useProveedores } from '../composables/useProveedores';
import {
  estadoProveedor,
  etiquetaTipoCuenta,
  FILTROS_PROVEEDORES,
  textoCambioDeCuenta,
} from '../proveedores.logica';
import type { FiltroProveedores, Proveedor } from '../services/proveedores.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige proveedores.editar y gastos.registrar igual.
const puedeEditar = computed(() => session.tienePermiso('proveedores.editar'));
const puedeRegistrar = computed(() => session.tienePermiso('gastos.registrar'));

const filtro = ref<FiltroProveedores>('todos');
const buscar = ref('');
const buscarFino = refDebounced(buscar, 300);
const seleccionadoId = ref<number | null>(null);
const resultado = ref<string | null>(null);
const errorImportar = ref<string | null>(null);
const errorDetalle = ref<string | null>(null);

const consulta = useProveedores(
  filtro,
  computed(() => buscarFino.value ?? ''),
);
const detener = useDetenerCambioCuenta();

const lista = computed(() => consulta.data.value);
const seleccionado = computed(
  () => lista.value?.proveedores.find((p) => p.id === seleccionadoId.value) ?? null,
);
watch([filtro, buscarFino], () => (errorDetalle.value = null));

const estadoDe = (p: Proveedor) => estadoProveedor(p.estado, p.proximo_vencimiento);

const vacio = computed(() =>
  filtro.value !== 'todos' || buscar.value !== ''
    ? { titulo: 'Sin resultados', detalle: 'Prueba con otro filtro o con otra búsqueda.' }
    : {
        titulo: 'Aún no hay proveedores',
        detalle: 'Agrégalos a mano o sube el XML de una factura.',
      },
);

function nuevo(): void {
  $q.dialog({ component: ProveedorDialog }).onOk((p: Proveedor) => {
    seleccionadoId.value = p.id;
    resultado.value = `Proveedor ${p.razon_social} agregado.`;
  });
}

function editar(p: Proveedor): void {
  $q.dialog({ component: ProveedorDialog, componentProps: { proveedor: p } }).onOk(() => {
    resultado.value = 'Cambios guardados.';
  });
}

function cambiarCuenta(p: Proveedor): void {
  $q.dialog({ component: CambiarCuentaProveedorDialog, componentProps: { proveedor: p } }).onOk(
    (r: Proveedor) => {
      resultado.value = r.cambio_de_cuenta
        ? 'Cambio solicitado: se activa en 24 horas. Se avisó a administración y tesorería.'
        : 'Cuenta guardada.';
    },
  );
}

function detenerCambio(p: Proveedor): void {
  errorDetalle.value = null;
  $q.dialog({
    title: 'Detener el cambio de cuenta',
    message: `Se mantiene la cuenta actual de ${p.razon_social}. ¿Detener el cambio?`,
    cancel: { label: 'No', flat: true, noCaps: true },
    ok: { label: 'Sí, detenerlo', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    detener.mutate(p.id, {
      onSuccess: () => (resultado.value = 'Cambio de cuenta detenido.'),
      onError: (error) => (errorDetalle.value = aApiError(error).mensaje),
    });
  });
}
</script>

<style scoped>
.provs {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.provs__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.provs__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.provs__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.provs__buscar {
  margin-left: auto;
  width: 240px;
}

.provs__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.provs__tabla {
  flex: 1 1 560px;
  min-width: 0;
  overflow-x: auto;
}

.provs__fila {
  display: grid;
  grid-template-columns: 1.6fr 1fr 150px 150px;
  gap: 12px;
  align-items: center;
  min-width: 600px;
  min-height: 56px;
  padding: 8px 18px;
  border: none;
  border-top: 1px solid var(--safic-borde);
  background: transparent;
  font: inherit;
  font-size: 14px;
  text-align: left;
  width: 100%;
}

.provs__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.provs__fila--dato {
  cursor: pointer;
}

.provs__fila--dato:hover,
.provs__fila--activa {
  background: var(--safic-fondo);
}

.provs__fila--dato:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.provs__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.provs__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.provs__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}

.provs__detalle {
  flex: 0 0 340px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.provs__detalle-titulo {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.provs__seccion {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: var(--safic-texto-suave);
}

.provs__cuenta {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 6px 10px;
  margin: 0;
  font-size: 14px;
}

.provs__cuenta dt {
  color: var(--safic-texto-suave);
}

.provs__cuenta dd {
  margin: 0;
  font-weight: 700;
  word-break: break-all;
}

.provs__cambio {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff1dc;
  color: #8a3f0a;
}

.provs__acciones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
