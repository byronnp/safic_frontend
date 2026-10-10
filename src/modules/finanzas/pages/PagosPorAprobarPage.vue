<template>
  <q-page class="safic-main pagos">
    <PaginaEncabezado miga="Finanzas / Pagos por aprobar" titulo="Pagos por aprobar">
      <template #acciones>
        <div class="pagos__tolerancia">
          Tolerancia bancaria: <strong>{{ formatoMoneda(tolerancia) }}</strong>
        </div>
        <q-btn
          v-if="estado === 'pendiente'"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          :label="`Aprobar seleccionados (${marcados.length})`"
          :disable="marcados.length === 0 || ocupado"
          :loading="lote.isPending.value"
          @click="aprobarSeleccionados"
        />
      </template>
    </PaginaEncabezado>

    <div class="pagos__pestanas" role="tablist" aria-label="Estado de los pagos">
      <button
        v-for="p in PESTANAS_PAGOS"
        :key="p.valor"
        type="button"
        role="tab"
        class="safic-pildora"
        :class="{ 'safic-pildora--activa': p.valor === estado }"
        :aria-selected="p.valor === estado"
        @click="cambiarEstado(p.valor)"
      >
        {{ p.etiqueta }} ({{ conteos[p.valor] }})
      </button>
    </div>

    <div v-if="textoResultado" class="pagos__resultado" role="status">
      {{ textoResultado }}
      <ul v-if="omitidos.length" class="pagos__omitidos">
        <li v-for="o in omitidos" :key="o.id">
          <strong>{{ o.unidad }}</strong> · {{ o.mensaje }}
        </li>
      </ul>
    </div>

    <div class="pagos__cuerpo">
      <section class="safic-card pagos__lista" aria-label="Pagos">
        <div class="pagos__desplazable">
          <div class="pagos__fila pagos__fila--cabecera" role="row">
            <div />
            <div>UNIDAD</div>
            <div>PAGADOR · BANCO</div>
            <div class="text-right">MONTO</div>
            <div class="text-right">CUOTAS</div>
            <div class="pagos__col-validacion">
              {{ estado === 'pendiente' ? 'VALIDACIÓN' : 'ESTADO' }}
            </div>
          </div>

          <div v-if="consulta.isPending.value" aria-busy="true" class="q-pa-md">
            <q-skeleton v-for="i in 4" :key="i" type="rect" height="44px" class="q-mb-sm" />
          </div>
          <div v-else-if="consulta.isError.value" class="safic-alerta q-ma-md" role="alert">
            {{ consulta.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
          </div>
          <template v-else>
            <div
              v-for="pago in pagos"
              :key="pago.id"
              class="pagos__fila"
              :class="{ 'pagos__fila--activa': pago.id === seleccionadoId }"
            >
              <label class="pagos__check">
                <input
                  v-if="estado === 'pendiente'"
                  v-model="marcados"
                  type="checkbox"
                  :value="pago.id"
                  :disabled="ocupado"
                  :aria-label="`Seleccionar pago de ${pago.unidad}`"
                />
              </label>
              <button
                type="button"
                class="pagos__boton pagos__unidad"
                @click="seleccionar(pago.id)"
              >
                {{ pago.unidad }}
              </button>
              <button type="button" class="pagos__boton" @click="seleccionar(pago.id)">
                <div class="text-weight-bold">{{ pago.pagador ?? '—' }}</div>
                <div class="pagos__sub">{{ detalleBanco(pago) }}</div>
              </button>
              <div class="text-right pagos__monto">{{ formatoMoneda(pago.monto) }}</div>
              <div class="text-right pagos__cuotas">{{ textoCuotas(pago) }}</div>
              <div class="pagos__col-validacion">
                <EstadoBadge
                  v-if="pago.validacion"
                  :tono="pago.validacion.nivel === 'ok' ? 'exito' : 'error'"
                >
                  {{ pago.validacion.texto }}
                </EstadoBadge>
                <EstadoBadge v-else-if="pago.recibo" tono="exito"
                  >Recibo {{ pago.recibo }}</EstadoBadge
                >
                <EstadoBadge v-else tono="error">Rechazado</EstadoBadge>
              </div>
            </div>
            <div v-if="pagos.length === 0" class="pagos__vacio">
              <q-icon name="sym_r_task_alt" size="40px" class="text-suave" />
              <div class="text-weight-bold">{{ vacio.titulo }}</div>
              <div class="text-suave">{{ vacio.detalle }}</div>
            </div>
          </template>
        </div>
      </section>

      <aside
        v-if="seleccionadoId !== null"
        class="safic-card pagos__detalle"
        aria-labelledby="pagos-detalle-titulo"
      >
        <template v-if="detalleConsulta.isPending.value">
          <q-skeleton type="rect" height="120px" />
        </template>
        <div v-else-if="detalleConsulta.isError.value" class="safic-alerta" role="alert">
          {{ detalleConsulta.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="detalleConsulta.refetch()" />
        </div>
        <template v-else-if="detalle">
          <div class="pagos__detalle-titulo">
            <h2 id="pagos-detalle-titulo">{{ detalle.unidad }} · {{ detalle.pagador ?? '—' }}</h2>
            <div class="pagos__detalle-monto">{{ formatoMoneda(detalle.monto) }}</div>
          </div>

          <div class="pagos__comprobante">
            <div class="pagos__comprobante-titulo">
              <q-icon name="sym_r_description" size="18px" />
              Comprobante subido por el residente
            </div>
            <div class="pagos__dato">
              <span>Cuenta de destino</span><strong>{{ detalle.cuenta_destino ?? '—' }}</strong>
            </div>
            <div class="pagos__dato">
              <span>N.º de comprobante</span
              ><strong>{{ detalle.numero_comprobante ?? '—' }}</strong>
            </div>
            <div class="pagos__dato">
              <span>Fecha</span><strong>{{ formatoFechaCorta(detalle.fecha) }}</strong>
            </div>
            <div class="pagos__dato">
              <span>Cuotas</span
              ><strong>{{
                detalle.cuotas.map((c) => nombreMes(c.periodo)).join(', ') || '—'
              }}</strong>
            </div>
            <button
              v-if="comprobanteUrl"
              type="button"
              class="pagos__enlace"
              @click="verImagen = true"
            >
              Ver comprobante completo
            </button>
          </div>

          <template v-if="detalle.estado === 'pendiente'">
            <div class="pagos__seccion">VALIDACIONES</div>
            <div v-for="v in detalle.validaciones" :key="v.clave" class="pagos__validacion">
              <span
                class="pagos__punto"
                :style="{ background: v.ok ? COLOR_VALIDACION.ok : COLOR_VALIDACION.error }"
              />
              <span>{{ v.texto }}</span>
            </div>
            <div v-if="detalle.aplicacion" class="pagos__validacion">
              <span class="pagos__punto" :style="{ background: COLOR_VALIDACION.ok }" />
              <span>{{ textoAplicacion(detalle.aplicacion) }}</span>
            </div>

            <label class="pagos__monto-recibido">
              Monto recibido en el banco
              <input
                v-model="montoRecibido"
                inputmode="decimal"
                :disabled="ocupado"
                :aria-invalid="!!errorMonto"
                aria-describedby="pagos-monto-ayuda"
              />
              <span id="pagos-monto-ayuda" class="pagos__ayuda">
                Si el banco acreditó otro valor que el declarado, escríbelo. Si falta menos que la
                tolerancia, la cuota se da por pagada.
              </span>
              <span v-if="errorMonto" class="pagos__error" role="alert">{{ errorMonto }}</span>
            </label>
          </template>

          <template v-else-if="detalle.estado === 'aprobado'">
            <div class="pagos__validacion">
              <span class="pagos__punto" :style="{ background: COLOR_VALIDACION.ok }" />
              <span>Aprobado · recibo N.º {{ detalle.recibo }}</span>
            </div>
            <q-btn
              outline
              no-caps
              color="primary"
              icon="sym_r_download"
              label="Descargar recibo (PDF)"
              :loading="descargando"
              @click="descargarRecibo(detalle)"
            />
          </template>
          <div v-else-if="detalle.estado === 'rechazado'" class="pagos__validacion">
            <span class="pagos__punto" :style="{ background: COLOR_VALIDACION.error }" />
            <span>Rechazado: {{ detalle.motivo_rechazo }}</span>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
          <div class="col-grow" />

          <div v-if="detalle.estado === 'pendiente'" class="pagos__acciones">
            <q-btn
              unelevated
              no-caps
              class="pagos__rechazar"
              label="Rechazar"
              :disable="ocupado"
              @click="pedirMotivo(detalle)"
            />
            <q-btn
              unelevated
              no-caps
              class="pagos__aprobar"
              label="Aprobar"
              :disable="ocupado"
              :loading="aprobar.isPending.value"
              @click="aprobarUno(detalle)"
            />
          </div>
        </template>
      </aside>
    </div>

    <q-dialog v-model="verImagen">
      <q-card class="safic-dialogo q-pa-lg">
        <div class="safic-dialogo__titulo">Comprobante {{ detalle?.numero_comprobante }}</div>
        <img
          v-if="comprobanteUrl && detalle?.comprobante_tipo !== 'pdf'"
          :src="comprobanteUrl"
          alt="Comprobante de la transferencia"
          class="pagos__img"
        />
        <div v-else-if="comprobanteUrl" class="q-mb-md">
          El comprobante es un PDF.
          <a :href="comprobanteUrl" target="_blank" rel="noopener noreferrer"
            >Abrirlo en otra pestaña</a
          >
        </div>
        <div class="row justify-end">
          <q-btn
            v-close-popup
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cerrar"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { guardarArchivo } from '@/core/api/descarga';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';
import { urlSegura } from '@/utils/url';

import {
  useAprobarLote,
  useAprobarPago,
  usePago,
  usePagos,
  useRechazarPago,
} from '../composables/usePagos';
import {
  COLOR_VALIDACION,
  detalleBanco,
  errorMotivo,
  montoParaAprobar,
  PESTANAS_PAGOS,
  textoAplicacion,
  textoCuotas,
} from '../pagos.logica';
import type { EstadoRevision, PagoDetalle } from '../services/pagos.service';
import { pagosService } from '../services/pagos.service';

const $q = useQuasar();

const estado = ref<EstadoRevision>('pendiente');
const consulta = usePagos(estado);
const aprobar = useAprobarPago();
const rechazar = useRechazarPago();
const lote = useAprobarLote();

const pagos = computed(() => consulta.data.value?.pagos ?? []);
const conteos = computed(
  () => consulta.data.value?.conteos ?? { pendiente: 0, aprobado: 0, rechazado: 0 },
);
const tolerancia = computed(() => consulta.data.value?.tolerancia ?? '0.50');

const marcados = ref<number[]>([]);
const seleccionadoId = ref<number | null>(null);
const verImagen = ref(false);
const errorGeneral = ref<string | null>(null);
const errorMonto = ref<string | null>(null);
const textoResultado = ref<string | null>(null);
const descargando = ref(false);
const montoRecibido = ref('');

const detalleConsulta = usePago(seleccionadoId);
const detalle = computed(() => detalleConsulta.data.value ?? null);
const ocupado = computed(
  () =>
    aprobar.isPending.value ||
    rechazar.isPending.value ||
    lote.isPending.value ||
    // El detalle puede estar desactualizado mientras se refresca: no se actúa sobre él
    detalleConsulta.isFetching.value,
);
const comprobanteUrl = computed(() => urlSegura(detalle.value?.comprobante_url));
const omitidos = ref<{ id: number; unidad: string; mensaje: string }[]>([]);

const vacio = computed(() =>
  estado.value === 'pendiente'
    ? {
        titulo: 'No hay pagos por aprobar.',
        detalle: 'Los comprobantes que suban los residentes aparecerán aquí.',
      }
    : estado.value === 'aprobado'
      ? {
          titulo: 'Todavía no hay pagos aprobados.',
          detalle: 'Aquí quedan con su número de recibo.',
        }
      : { titulo: 'No hay pagos rechazados.', detalle: 'Aquí quedan con el motivo del rechazo.' },
);

// El pago elegido siempre existe en la lista visible; si desaparece (se aprobó) pasa al primero
watch(pagos, (lista) => {
  if (!lista.some((p) => p.id === seleccionadoId.value)) {
    seleccionadoId.value = lista[0]?.id ?? null;
  }
  marcados.value = marcados.value.filter((id) => lista.some((p) => p.id === id));
});

// Al abrir otro pago el monto empieza en lo declarado y se limpian los mensajes
watch(
  () => [detalle.value?.id, detalle.value?.monto],
  () => {
    montoRecibido.value = detalle.value?.monto ?? '';
    errorMonto.value = null;
    errorGeneral.value = null;
    verImagen.value = false;
  },
);

function cambiarEstado(valor: EstadoRevision): void {
  if (valor === estado.value || ocupado.value) return;
  estado.value = valor;
  marcados.value = [];
  seleccionadoId.value = null;
  textoResultado.value = null;
  omitidos.value = [];
  verImagen.value = false;
}

function seleccionar(id: number): void {
  verImagen.value = false;
  seleccionadoId.value = id;
}

function aprobarUno(pago: PagoDetalle): void {
  if (ocupado.value) return;
  errorGeneral.value = null;
  const monto = montoParaAprobar(pago.monto, montoRecibido.value);
  if (monto === null) {
    errorMonto.value = 'Escribe un monto válido (hasta dos decimales).';
    return;
  }
  errorMonto.value = null;
  aprobar.mutate(
    { id: pago.id, ...(monto === undefined ? {} : { montoRecibido: monto }) },
    {
      onSuccess: (r) =>
        $q.notify({
          type: 'positive',
          message: `Pago de ${r.unidad} aprobado · recibo N.º ${r.recibo}.`,
        }),
      onError: (e) => mostrarError(e),
    },
  );
}

/** Errores de aprobar o rechazar: el campo si es del monto; «ya resuelto» si otra persona lo revisó antes. */
function mostrarError(e: unknown): void {
  const apiError = aApiError(e);
  const monto = apiError.campo('monto_recibido');
  if (monto) {
    errorMonto.value = monto;
  } else if (apiError.codigo === 'PAGO_NO_PENDIENTE') {
    errorGeneral.value = 'Este pago ya fue resuelto por otra persona. Se actualizó la lista.';
  } else {
    errorGeneral.value = apiError.mensaje;
  }
}

function pedirMotivo(pago: PagoDetalle): void {
  if (ocupado.value) return;
  $q.dialog({
    title: `Rechazar el pago de ${pago.unidad}`,
    message: 'Escribe el motivo: se le envía al residente para que pueda corregirlo.',
    prompt: { model: '', type: 'text', isValid: (v: string) => errorMotivo(v) === null },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Rechazar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk((motivo: string) => {
    if (ocupado.value) return;
    errorGeneral.value = null;
    rechazar.mutate(
      { id: pago.id, motivo: motivo.trim() },
      {
        onSuccess: (r) =>
          $q.notify({ type: 'positive', message: `Pago de ${r.unidad} rechazado.` }),
        onError: (e) => mostrarError(e),
      },
    );
  });
}

function aprobarSeleccionados(): void {
  if (ocupado.value || marcados.value.length === 0) return;
  const ids = [...marcados.value];
  $q.dialog({
    title: 'Aprobar seleccionados',
    message: `Se aprueban ${ids.length} ${ids.length === 1 ? 'pago' : 'pagos'} con lo declarado. Los que no pasen todas las validaciones quedan pendientes para revisarlos uno por uno.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Aprobar', color: 'primary', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    if (ocupado.value) return;
    textoResultado.value = null;
    omitidos.value = [];
    lote.mutate(ids, {
      onSuccess: (r) => {
        marcados.value = [];
        omitidos.value = r.resultados
          .filter((x) => !x.ok)
          .map((x) => ({
            id: x.id,
            unidad: pagos.value.find((p) => p.id === x.id)?.unidad ?? `Pago ${x.id}`,
            mensaje: x.mensaje ?? 'No se pudo aprobar.',
          }));
        const mensaje = r.aprobados === 1 ? '1 pago aprobado.' : `${r.aprobados} pagos aprobados.`;
        textoResultado.value =
          r.omitidos > 0
            ? `${mensaje} ${r.omitidos} no se pudieron aprobar: revísalos uno por uno.`
            : mensaje;
        $q.notify({
          type: r.aprobados > 0 ? 'positive' : 'warning',
          message: textoResultado.value,
        });
      },
      onError: (e) => {
        textoResultado.value = aApiError(e).mensaje;
      },
    });
  });
}

async function descargarRecibo(pago: PagoDetalle): Promise<void> {
  if (descargando.value || pago.recibo === null) return;
  descargando.value = true;
  try {
    guardarArchivo(await pagosService.recibo(pago.id), `recibo-${pago.recibo}.pdf`);
  } catch (e) {
    errorGeneral.value = aApiError(e).mensaje;
  } finally {
    descargando.value = false;
  }
}
</script>

<style scoped>
.pagos.safic-main {
  padding: 24px 32px;
  gap: 16px;
}

.pagos__tolerancia {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.pagos__tolerancia strong {
  color: var(--safic-texto);
}

.pagos__pestanas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagos__monto-recibido {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.pagos__monto-recibido input {
  height: 38px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 10px;
  font-size: 15px;
  font-family: inherit;
  background: #ffffff;
}

.pagos__ayuda {
  font-size: 11px;
  font-weight: 400;
  color: var(--safic-texto-suave);
}

.pagos__error {
  font-size: 12px;
  font-weight: 600;
  color: #9b1c12;
}

.pagos__resultado {
  font-size: 13px;
  font-weight: 600;
  color: var(--safic-texto-2);
  background: #f1efe8;
  border-radius: 10px;
  padding: 10px 12px;
}

.pagos__omitidos {
  margin: 6px 0 0;
  padding-left: 18px;
  font-weight: 400;
}

.pagos__img {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  margin: 0 auto 12px;
  border-radius: 10px;
}

.pagos__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.pagos__lista {
  flex-grow: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pagos__desplazable {
  overflow-x: auto;
}

.pagos__fila {
  display: grid;
  grid-template-columns: 44px 70px 1fr 110px 90px 150px;
  align-items: center;
  padding: 0 16px;
  height: 62px;
  border-bottom: 1px solid var(--safic-linea-2);
  font-size: 14px;
  background: #ffffff;
  min-width: 660px;
}

.pagos__fila--activa {
  background: #f1f6f5;
}

.pagos__fila--cabecera {
  height: auto;
  padding: 12px 16px;
  background: var(--safic-fondo-2);
  border-bottom-color: var(--safic-linea);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.pagos__col-validacion {
  padding-left: 16px;
}

.pagos__check {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.pagos__check input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--q-primary);
  cursor: pointer;
}

.pagos__boton {
  border: none;
  background: transparent;
  text-align: left;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--safic-texto);
  font-family: inherit;
  min-width: 0;
}

.pagos__unidad {
  height: 44px;
  font-weight: 800;
}

.pagos__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.pagos__monto {
  font-weight: 800;
}

.pagos__cuotas {
  color: var(--safic-texto-2);
}

.pagos__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 16px;
  font-size: 14px;
  text-align: center;
}

.pagos__detalle {
  width: 430px;
  flex-shrink: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pagos__detalle-titulo {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.pagos__detalle-titulo h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 800;
  flex-grow: 1;
}

.pagos__detalle-monto {
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
}

.pagos__comprobante {
  background: #f7f6f2;
  border: 1px dashed var(--safic-borde-campo);
  border-radius: 12px;
  padding: 16px 18px;
  font-size: 13px;
  color: var(--safic-texto-2);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pagos__comprobante-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--safic-texto);
  font-size: 14px;
}

.pagos__dato {
  display: flex;
  gap: 8px;
}

.pagos__dato span {
  flex-grow: 1;
}

.pagos__dato strong {
  color: var(--safic-texto);
}

.pagos__enlace {
  align-self: flex-start;
  border: none;
  background: transparent;
  padding: 0;
  margin-top: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--q-primary);
  cursor: pointer;
}

.pagos__seccion {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.pagos__validacion {
  display: flex;
  gap: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--safic-texto-2);
}

.pagos__punto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.pagos__ajustar.q-btn {
  min-height: 46px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  background: #ffffff;
}

.pagos__acciones {
  display: flex;
  gap: 10px;
}

.pagos__rechazar.q-btn,
.pagos__aprobar.q-btn {
  flex-grow: 1;
  flex-basis: 0;
  min-height: 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
}

.pagos__rechazar.q-btn {
  background: #ffffff;
  color: #9b1c12;
  border: 1px solid var(--safic-borde-2);
}

.pagos__aprobar.q-btn {
  background: var(--q-primary);
  color: #ffffff;
}

.pagos__aprobar--bloqueado.q-btn {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.pagos__aprobar--bloqueado.q-btn.disabled {
  opacity: 1 !important;
}

.pagos__imagen {
  margin: 16px 0;
  height: 220px;
  border-radius: 12px;
  border: 1px dashed var(--safic-borde-campo);
  background: #f7f6f2;
  color: var(--safic-texto-suave);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
}

@media (max-width: 1023px) {
  .pagos__cuerpo {
    flex-direction: column;
  }

  .pagos__detalle {
    width: auto;
  }
}

@media (max-width: 599px) {
  .pagos.safic-main {
    padding: 20px 16px;
  }
}
</style>
