<template>
  <q-page class="safic-main conc">
    <PaginaEncabezado
      miga="Finanzas / Conciliación bancaria"
      :titulo="`Conciliación · ${nombreMes(periodo)}`"
    >
      <template #acciones>
        <label for="conc-mes" class="conc__etiqueta">Mes</label>
        <q-select
          v-model="periodo"
          for="conc-mes"
          class="safic-input conc__select"
          outlined
          dense
          emit-value
          map-options
          :options="opcionesMes"
        />
        <q-btn
          v-if="puedeGestionar"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_upload_file"
          label="Subir estado de cuenta"
          @click="subir"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="conc__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

    <div v-if="estados.isError.value" class="safic-alerta" role="alert">
      {{ estados.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="estados.refetch()" />
    </div>
    <div v-else-if="estados.isPending.value" aria-busy="true">
      <q-skeleton v-for="i in 3" :key="i" type="rect" height="56px" class="q-mb-sm" />
    </div>

    <div v-else-if="lista.length === 0" class="safic-card conc__vacio">
      <q-icon name="sym_r_account_balance" size="40px" class="text-suave" />
      <div class="text-weight-bold">
        Aún no hay estado de cuenta de {{ nombreMes(periodo).toLowerCase() }}
      </div>
      <div class="text-suave">
        Sube el archivo del banco para cruzar sus movimientos con los pagos.
      </div>
      <q-btn
        v-if="puedeGestionar"
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        label="Subir estado de cuenta"
        @click="subir"
      />
    </div>

    <template v-else>
      <div v-if="lista.length > 1" role="tablist" aria-label="Cuenta" class="conc__pildoras">
        <button
          v-for="e in lista"
          :key="e.id"
          type="button"
          role="tab"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': e.id === estadoId }"
          :aria-selected="e.id === estadoId"
          @click="elegirEstado(e.id)"
        >
          {{ e.cuenta }}{{ e.pendientes ? ` (${e.pendientes})` : '' }}
        </button>
      </div>

      <div v-if="detalle.isError.value" class="safic-alerta" role="alert">
        {{ detalle.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="detalle.refetch()" />
      </div>
      <div v-else-if="!conciliacion" aria-busy="true">
        <q-skeleton type="rect" height="200px" />
      </div>

      <div v-else class="conc__cuerpo">
        <section class="conc__principal" aria-label="Movimientos">
          <div class="safic-card conc__archivo">
            <div>
              <div class="text-weight-bold">{{ conciliacion.cuenta }}</div>
              <div class="conc__sub">
                {{ conciliacion.archivo_nombre }} · {{ conciliacion.movimientos }} movimientos ·
                {{ conciliacion.duplicados }} duplicados descartados
              </div>
            </div>
            <div class="conc__saldos">
              <div>
                <div class="conc__sub">Saldo inicial banco</div>
                <strong>{{ saldo(conciliacion.cuadre.saldo_inicial) }}</strong>
              </div>
              <div>
                <div class="conc__sub">Saldo final banco</div>
                <strong>{{ saldo(conciliacion.cuadre.saldo_banco) }}</strong>
              </div>
              <EstadoBadge :tono="conciliacion.cuadre.archivo_cuadra === false ? 'error' : 'exito'">
                {{ textoArchivoCuadra(conciliacion.cuadre) }}
              </EstadoBadge>
            </div>
          </div>

          <div role="tablist" aria-label="Estado de las líneas" class="conc__tabs">
            <button
              v-for="p in PESTANAS"
              :key="p.clave"
              type="button"
              role="tab"
              class="conc__tab"
              :class="{ 'conc__tab--activa': p.clave === pestana }"
              :aria-selected="p.clave === pestana"
              @click="pestana = p.clave"
            >
              {{ p.etiqueta }}
              <span class="conc__cuenta">{{ conciliacion.conteos[p.clave] }}</span>
            </button>
          </div>

          <q-checkbox
            v-if="pestana !== 'automaticos' && puedeGestionar"
            v-model="guardarRegla"
            label="Guardar la clasificación como regla para líneas parecidas"
          />

          <div class="safic-card conc__lineas">
            <div v-for="l in lineas" :key="l.id" class="conc__linea">
              <div class="conc__fecha">{{ formatoFechaCorta(l.fecha) }}</div>
              <div class="conc__desc">
                <div class="text-weight-bold">{{ l.descripcion }}</div>
                <div class="conc__sub">
                  <template v-if="l.referencia">Ref. {{ l.referencia }} · </template>
                  <template v-if="pestana === 'automaticos'">{{ nombreTipo(l.tipo) }}</template>
                  <template v-else>{{
                    l.propuesta?.texto ?? 'Sin regla: elige el tipo.'
                  }}</template>
                </div>
              </div>
              <div class="conc__monto" :class="{ 'conc__monto--entra': esCredito(l) }">
                {{ montoConSigno(l.monto) }}
              </div>
              <div v-if="puedeGestionar" class="conc__accion">
                <template v-if="pestana === 'automaticos'">
                  <q-btn
                    flat
                    no-caps
                    dense
                    label="Deshacer"
                    :disable="ocupado"
                    @click="deshacer(l)"
                  />
                </template>
                <template v-else-if="pestana === 'sugeridos'">
                  <q-btn
                    v-if="accionDeSugerida(l)"
                    unelevated
                    no-caps
                    color="primary"
                    class="safic-btn"
                    :label="accionDeSugerida(l)?.etiqueta"
                    :disable="ocupado"
                    @click="aplicarSugerencia(l)"
                  />
                </template>
                <q-btn-dropdown
                  v-else
                  outline
                  no-caps
                  color="primary"
                  label="Clasificar como"
                  :disable="ocupado"
                >
                  <q-list>
                    <q-item
                      v-for="t in tiposPara(l)"
                      :key="t.valor"
                      v-close-popup
                      clickable
                      @click="clasificar(l, t.valor)"
                    >
                      <q-item-section>{{ t.etiqueta }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div v-if="lineas.length === 0" class="conc__vacio-lista">
              <q-icon name="sym_r_task_alt" size="36px" class="text-suave" />
              <div class="text-weight-bold">{{ vacioLista }}</div>
            </div>
          </div>
        </section>

        <aside class="safic-card conc__cuadre" aria-labelledby="conc-cuadre">
          <h2 id="conc-cuadre" class="conc__h2">Cuadre del mes</h2>
          <dl class="conc__valores">
            <dt>Saldo inicial</dt>
            <dd>{{ saldo(conciliacion.cuadre.saldo_inicial) }}</dd>
            <dt>+ Pagos de residentes</dt>
            <dd>{{ saldo(conciliacion.cuadre.pagos_residentes) }}</dd>
            <dt>+ Intereses</dt>
            <dd>{{ saldo(conciliacion.cuadre.intereses) }}</dd>
            <dt>− Gastos pagados</dt>
            <dd>{{ saldo(conciliacion.cuadre.gastos_pagados) }}</dd>
            <dt>− Comisiones bancarias</dt>
            <dd>{{ saldo(conciliacion.cuadre.comisiones) }}</dd>
            <template v-if="aCentavos(conciliacion.cuadre.otros) !== 0">
              <dt>± Otros movimientos</dt>
              <dd>{{ saldo(conciliacion.cuadre.otros) }}</dd>
            </template>
            <template v-if="aCentavos(conciliacion.cuadre.ajustes) !== 0">
              <dt>± Ajustes</dt>
              <dd>{{ saldo(conciliacion.cuadre.ajustes) }}</dd>
            </template>
            <dt class="conc__total">Saldo en la app</dt>
            <dd class="conc__total">{{ saldo(conciliacion.cuadre.saldo_app) }}</dd>
            <dt>Saldo en el banco</dt>
            <dd>{{ saldo(conciliacion.cuadre.saldo_banco) }}</dd>
            <dt class="conc__total">Diferencia</dt>
            <dd class="conc__total" :class="`conc__dif--${nota.tono}`">
              {{ saldo(conciliacion.cuadre.diferencia) }}
            </dd>
          </dl>
          <div class="conc__nota" :class="`conc__nota--${nota.tono}`" role="status">
            {{ nota.texto }}
          </div>

          <q-btn
            v-if="puedeGestionar"
            outline
            no-caps
            color="primary"
            label="Registrar ajuste con motivo"
            :disable="ocupado"
            @click="ajustar"
          />
          <q-btn
            v-if="puedeVerCierre"
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            icon="sym_r_lock"
            :label="`Ir al cierre de ${nombreMes(periodo).toLowerCase()}`"
            :to="{ name: 'finanzas-cierre-mes' }"
          />
        </aside>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { aCentavos } from '@/utils/dinero';
import { hoyEcuador } from '@/utils/fecha';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import AjusteConciliacionDialog from '../components/AjusteConciliacionDialog.vue';
import ImportarEstadoDialog from '../components/ImportarEstadoDialog.vue';
import { mesAnterior } from '../cierre-mes.logica';
import {
  accionDeSugerida,
  ajusteSugerido,
  esCredito,
  montoConSigno,
  nombreTipo,
  notaDiferencia,
  PESTANAS,
  textoArchivoCuadra,
  TIPOS_MANUALES,
  type Pestana,
} from '../conciliacion.logica';
import {
  useClasificarLinea,
  useConciliacion,
  useDeshacerLinea,
  useEstadosCuenta,
  useVincularLinea,
} from '../composables/useConciliacion';
import { usePeriodos } from '../composables/usePeriodos';
import { opcionesDeMes } from '../resumen.logica';
import type {
  LineaBanco,
  ResultadoImportacion,
  TipoManual,
} from '../services/conciliacion.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige conciliacion.gestionar y finanzas.ver igual.
const puedeGestionar = computed(() => session.tienePermiso('conciliacion.gestionar'));
const puedeVerCierre = computed(() => session.tienePermiso('finanzas.ver'));

const periodo = ref(mesAnterior(hoyEcuador().slice(0, 7)));
const pestana = ref<Pestana>('sugeridos');
const guardarRegla = ref(false);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const elegido = ref<number | null>(null);

const periodos = usePeriodos();
const opcionesMes = computed(() => opcionesDeMes(periodos.data.value ?? [], periodo.value));

const estados = useEstadosCuenta(periodo);
const lista = computed(() => estados.data.value ?? []);
// El estado elegido, o el primero del mes si no hay (o el elegido ya no está)
const estadoId = computed(() => {
  const e = lista.value.find((x) => x.id === elegido.value) ?? lista.value[0];
  return e?.id ?? null;
});
const detalle = useConciliacion(estadoId);
const conciliacion = computed(() =>
  detalle.data.value && detalle.data.value.id === estadoId.value ? detalle.data.value : null,
);

const vincular = useVincularLinea();
const clasificarMutacion = useClasificarLinea();
const deshacerMutacion = useDeshacerLinea();
const ocupado = computed(
  () =>
    vincular.isPending.value ||
    clasificarMutacion.isPending.value ||
    deshacerMutacion.isPending.value,
);

const lineas = computed(() => {
  const c = conciliacion.value;
  if (!c) return [];
  return pestana.value === 'automaticos'
    ? c.automaticos
    : pestana.value === 'sugeridos'
      ? c.sugeridos
      : c.sin_identificar;
});
const vacioLista = computed(() =>
  pestana.value === 'automaticos'
    ? 'Todavía no hay líneas conciliadas.'
    : pestana.value === 'sugeridos'
      ? 'No hay sugerencias pendientes.'
      : 'No hay líneas sin identificar.',
);
const nota = computed(() =>
  conciliacion.value
    ? notaDiferencia(conciliacion.value.cuadre)
    : { tono: 'info' as const, texto: '' },
);

const saldo = (v: string | null): string => (v === null ? '—' : formatoMoneda(v));

// Al cambiar de mes o de condominio no quedan avisos ni selecciones del anterior
watch([periodo, () => session.condominioId], () => {
  elegido.value = null;
  resultado.value = null;
  errorAccion.value = null;
});

function elegirEstado(id: number): void {
  elegido.value = id;
  resultado.value = null;
}

function tiposPara(l: LineaBanco) {
  // Una comisión es un débito y un interés un crédito; «otro» sirve para ambos
  return TIPOS_MANUALES.filter((t) =>
    t.valor === 'comision' ? !esCredito(l) : t.valor === 'interes' ? esCredito(l) : true,
  );
}

function subir(): void {
  errorAccion.value = null;
  $q.dialog({
    component: ImportarEstadoDialog,
    componentProps: {
      periodo: periodo.value,
      cuentaBancariaId: conciliacion.value?.cuenta_bancaria_id ?? null,
    },
  }).onOk((r: ResultadoImportacion) => {
    // Primero se actualiza la lista de estados: así el nuevo ya está cuando se elige
    void estados.refetch().then(() => {
      elegido.value = r.conciliacion.id;
      pestana.value =
        r.conciliacion.conteos.sugeridos > 0
          ? 'sugeridos'
          : r.conciliacion.conteos.sin_identificar > 0
            ? 'sin_identificar'
            : 'automaticos';
    });
    resultado.value = `Importado: ${r.nuevos} movimientos nuevos, ${r.duplicados} duplicados descartados${r.fueraDelMes ? `, ${r.fueraDelMes} fuera del mes` : ''}.`;
  });
}

function alFallar(error: unknown): void {
  errorAccion.value = aApiError(error).mensaje;
}

function aplicarSugerencia(l: LineaBanco): void {
  const accion = accionDeSugerida(l);
  if (!accion || ocupado.value || !l.propuesta) return;
  errorAccion.value = null;
  if (accion.tipo === 'vincular' && l.propuesta.id !== null) {
    vincular.mutate(
      {
        id: l.id,
        tipo: l.propuesta.tipo as 'pago_residente' | 'pago_proveedor',
        pagoId: l.propuesta.id,
      },
      { onSuccess: () => (resultado.value = 'Línea conciliada.'), onError: alFallar },
    );
  } else {
    clasificarMutacion.mutate(
      { id: l.id, tipo: l.propuesta.tipo as TipoManual, guardarRegla: guardarRegla.value },
      { onSuccess: () => (resultado.value = 'Línea clasificada.'), onError: alFallar },
    );
  }
}

function clasificar(l: LineaBanco, tipo: TipoManual): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  clasificarMutacion.mutate(
    { id: l.id, tipo, guardarRegla: guardarRegla.value },
    { onSuccess: () => (resultado.value = 'Línea clasificada.'), onError: alFallar },
  );
}

function deshacer(l: LineaBanco): void {
  errorAccion.value = null;
  $q.dialog({
    title: 'Deshacer la conciliación',
    message: `La línea «${l.descripcion}» vuelve a clasificarse y su pago queda libre.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Deshacer', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    if (ocupado.value) return;
    deshacerMutacion.mutate(l.id, {
      onSuccess: () => (resultado.value = 'Conciliación deshecha.'),
      onError: alFallar,
    });
  });
}

function ajustar(): void {
  const c = conciliacion.value;
  if (!c) return;
  errorAccion.value = null;
  $q.dialog({
    component: AjusteConciliacionDialog,
    componentProps: { estadoId: c.id, sugerido: ajusteSugerido(c.cuadre) },
  }).onOk(() => {
    resultado.value = 'Ajuste registrado.';
  });
}
</script>

<style scoped>
.conc {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conc__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.conc__select {
  min-width: 190px;
}

.conc__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.conc__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
}

.conc__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.conc__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.conc__principal {
  flex: 1 1 620px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.conc__archivo {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 18px;
}

.conc__saldos {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.conc__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.conc__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--safic-borde);
}

.conc__tab {
  height: 44px;
  padding: 0 14px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--safic-texto-suave);
  cursor: pointer;
}

.conc__tab--activa {
  font-weight: 800;
  color: var(--q-primary);
  border-bottom-color: var(--q-primary);
}

.conc__tab:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.conc__cuenta {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--safic-fondo);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.conc__lineas {
  overflow: hidden;
}

.conc__linea {
  display: grid;
  grid-template-columns: 70px 1fr 120px auto;
  gap: 12px;
  align-items: center;
  padding: 12px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.conc__linea:first-child {
  border-top: none;
}

.conc__monto {
  text-align: right;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.conc__monto--entra {
  color: #0b4a47;
}

.conc__accion {
  min-width: 120px;
  text-align: right;
}

.conc__vacio-lista {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 16px;
  text-align: center;
}

.conc__cuadre {
  flex: 0 0 340px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.conc__h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.conc__valores {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 10px;
  margin: 0;
  font-size: 14px;
}

.conc__valores dt {
  color: var(--safic-texto-suave);
}

.conc__valores dd {
  margin: 0;
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.conc__valores .conc__total {
  padding-top: 8px;
  border-top: 1px solid var(--safic-borde);
  color: inherit;
  font-weight: 800;
}

.conc__dif--exito {
  color: #0b4a47;
}

.conc__dif--error {
  color: #9b1c12;
}

.conc__nota {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.conc__nota--exito {
  background: #e3efec;
  color: #0b4a47;
}

.conc__nota--error {
  background: #fde8e6;
  color: #7f1810;
}

.conc__nota--info {
  background: #f1efe8;
  color: #3d3a33;
}
</style>
