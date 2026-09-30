<template>
  <q-page class="safic-main pagos">
    <PaginaEncabezado miga="Finanzas / Pagos por aprobar" titulo="Pagos por aprobar">
      <template #acciones>
        <div class="pagos__tolerancia">
          Tolerancia bancaria: <strong>{{ formatoMoneda(PAGOS_TOLERANCIA_BANCARIA) }}</strong>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          :label="`Aprobar seleccionados (${seleccionados.length})`"
          :disable="seleccionados.length === 0"
          @click="aprobarSeleccionados"
        />
      </template>
    </PaginaEncabezado>

    <div class="pagos__cuerpo">
      <section class="safic-card pagos__lista" aria-label="Pagos por aprobar">
        <div class="pagos__desplazable">
          <div class="pagos__fila pagos__fila--cabecera" role="row">
            <div />
            <div>UNIDAD</div>
            <div>PAGADOR · BANCO</div>
            <div class="text-right">MONTO</div>
            <div class="text-right">CUOTAS</div>
            <div class="pagos__col-validacion">VALIDACIÓN</div>
          </div>
          <div
            v-for="pago in pagos"
            :key="pago.id"
            class="pagos__fila"
            :class="{ 'pagos__fila--activa': pago.id === seleccionadoId }"
          >
            <label class="pagos__check">
              <input
                v-model="marcados"
                type="checkbox"
                :value="pago.id"
                :aria-label="`Seleccionar pago de ${pago.unidad}`"
              />
            </label>
            <button type="button" class="pagos__boton pagos__unidad" @click="seleccionar(pago.id)">
              {{ pago.unidad }}
            </button>
            <button type="button" class="pagos__boton" @click="seleccionar(pago.id)">
              <div class="text-weight-bold">{{ pago.pagador }}</div>
              <div class="pagos__sub">{{ pago.banco }} · {{ pago.fecha }}</div>
            </button>
            <div class="text-right pagos__monto">{{ formatoMoneda(pago.monto) }}</div>
            <div class="text-right pagos__cuotas">{{ pago.cuotas }}</div>
            <div class="pagos__col-validacion">
              <EstadoBadge :tono="ESTADOS[pago.estado].tono">
                {{ ESTADOS[pago.estado].texto }}
              </EstadoBadge>
            </div>
          </div>
          <div v-if="pagos.length === 0" class="pagos__vacio">
            <q-icon name="sym_r_task_alt" size="40px" class="text-suave" />
            <div class="text-weight-bold">No hay pagos por aprobar.</div>
            <div class="text-suave">Los comprobantes que suban los residentes aparecerán aquí.</div>
          </div>
        </div>
      </section>

      <aside
        v-if="detalle"
        class="safic-card pagos__detalle"
        aria-labelledby="pagos-detalle-titulo"
      >
        <div class="pagos__detalle-titulo">
          <h2 id="pagos-detalle-titulo">{{ detalle.unidad }} · {{ detalle.pagador }}</h2>
          <div class="pagos__detalle-monto">{{ formatoMoneda(detalle.monto) }}</div>
        </div>

        <div class="pagos__comprobante">
          <div class="pagos__comprobante-titulo">
            <q-icon name="sym_r_description" size="18px" />
            Comprobante subido por el residente
          </div>
          <div class="pagos__dato">
            <span>Banco de origen</span><strong>{{ detalle.banco }}</strong>
          </div>
          <div class="pagos__dato">
            <span>N.º de comprobante</span><strong>{{ detalle.comprobante }}</strong>
          </div>
          <div class="pagos__dato">
            <span>Fecha</span><strong>{{ detalle.fecha }}</strong>
          </div>
          <div class="pagos__dato">
            <span>Concepto</span><strong>{{ detalle.concepto }}</strong>
          </div>
          <button type="button" class="pagos__enlace" @click="verImagen = true">
            Ver imagen completa
          </button>
        </div>

        <div class="pagos__seccion">VALIDACIONES</div>
        <div v-for="(v, i) in detalle.validaciones" :key="i" class="pagos__validacion">
          <span class="pagos__punto" :style="{ background: COLOR_NIVEL[v.nivel] }" />
          <span>{{ v.texto }}</span>
        </div>

        <div class="col-grow" />

        <q-btn
          v-if="detalle.estado === 'monto_no_cubre'"
          outline
          no-caps
          color="primary"
          class="pagos__ajustar"
          label="Aplicar a 1 cuota completa y $ 20,00 a saldo a favor"
          @click="resolver(detalle, 'Pago aplicado a 1 cuota; $ 20,00 quedan como saldo a favor.')"
        />
        <div class="pagos__acciones">
          <q-btn
            unelevated
            no-caps
            class="pagos__rechazar"
            label="Rechazar"
            @click="resolver(detalle, `Pago de ${detalle.unidad} rechazado.`)"
          />
          <q-btn
            unelevated
            no-caps
            class="pagos__aprobar"
            :class="{ 'pagos__aprobar--bloqueado': bloqueado }"
            label="Aprobar"
            :disable="bloqueado"
            @click="resolver(detalle, `Pago de ${detalle.unidad} aprobado.`)"
          />
        </div>
      </aside>
    </div>

    <q-dialog v-model="verImagen">
      <q-card class="safic-dialogo q-pa-lg">
        <div class="safic-dialogo__titulo">Comprobante {{ detalle?.comprobante }}</div>
        <div class="pagos__imagen">
          <q-icon name="sym_r_image" size="40px" />
          <div>La imagen del comprobante se mostrará cuando exista la API.</div>
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
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import type { TonoEstado } from '@/components/EstadoBadge.vue';
import { formatoMoneda } from '@/utils/formato';
import {
  PAGOS_POR_APROBAR,
  PAGOS_SELECCIONADOS_INICIALES,
  PAGOS_TOLERANCIA_BANCARIA,
} from '../demo/pagos-por-aprobar';
import type {
  EstadoValidacionPago,
  NivelValidacion,
  PagoPorAprobar,
} from '../demo/pagos-por-aprobar';

const ESTADOS: Record<EstadoValidacionPago, { texto: string; tono: TonoEstado }> = {
  coincide: { texto: 'Todo coincide', tono: 'exito' },
  tolerancia: { texto: 'Tolerancia', tono: 'alerta' },
  duplicado: { texto: 'Duplicado', tono: 'error' },
  monto_no_cubre: { texto: 'Monto no cubre', tono: 'error' },
};

const COLOR_NIVEL: Record<NivelValidacion, string> = {
  ok: '#0E5E5B',
  alerta: '#C98A2B',
  error: '#9B1C12',
};

const $q = useQuasar();

const pagos = ref<PagoPorAprobar[]>([...PAGOS_POR_APROBAR]);
const marcados = ref<number[]>([...PAGOS_SELECCIONADOS_INICIALES]);
const seleccionadoId = ref<number | null>(PAGOS_POR_APROBAR[0]?.id ?? null);
const verImagen = ref(false);

const detalle = computed(() => pagos.value.find((p) => p.id === seleccionadoId.value) ?? null);
const seleccionados = computed(() => pagos.value.filter((p) => marcados.value.includes(p.id)));

function esBloqueado(pago: PagoPorAprobar): boolean {
  return pago.estado === 'duplicado' || pago.estado === 'monto_no_cubre';
}

const bloqueado = computed(() => (detalle.value ? esBloqueado(detalle.value) : true));

function seleccionar(id: number): void {
  seleccionadoId.value = id;
}

function quitar(ids: number[]): void {
  const indiceActual = pagos.value.findIndex((p) => p.id === seleccionadoId.value);
  pagos.value = pagos.value.filter((p) => !ids.includes(p.id));
  marcados.value = marcados.value.filter((id) => !ids.includes(id));
  if (!pagos.value.some((p) => p.id === seleccionadoId.value)) {
    const siguiente = pagos.value[Math.min(Math.max(indiceActual, 0), pagos.value.length - 1)];
    seleccionadoId.value = siguiente?.id ?? null;
  }
}

function resolver(pago: PagoPorAprobar, mensaje: string): void {
  quitar([pago.id]);
  $q.notify({ type: 'positive', message: mensaje });
}

function aprobarSeleccionados(): void {
  const aprobables = seleccionados.value.filter((p) => !esBloqueado(p));
  const omitidos = seleccionados.value.length - aprobables.length;
  quitar(aprobables.map((p) => p.id));
  $q.notify({
    type: 'positive',
    message: aprobables.length === 1 ? '1 pago aprobado.' : `${aprobables.length} pagos aprobados.`,
    ...(omitidos > 0
      ? { caption: `${omitidos} no se pueden aprobar: revísalos uno por uno.` }
      : {}),
  });
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
