<template>
  <q-page class="safic-main resumen">
    <PaginaEncabezado miga="Finanzas / Resumen" :titulo="indicadores.periodo">
      <template #acciones>
        <EstadoBadge v-if="indicadores.periodoAbierto" tono="exito" class="resumen__periodo">
          Periodo abierto
        </EstadoBadge>
        <q-btn
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario resumen__accion"
          label="Cuota extraordinaria"
          @click="pendiente('Cuota extraordinaria')"
        />
        <q-btn
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario resumen__accion"
          label="Registrar gasto"
          @click="pendiente('Registrar gasto')"
        />
      </template>
    </PaginaEncabezado>

    <div class="safic-indicadores">
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Recaudado del mes</div>
        <div class="resumen__valor">{{ formatoMoneda(indicadores.recaudado) }}</div>
        <div
          class="resumen__progreso"
          role="progressbar"
          :aria-valuenow="porcentajeRecaudado"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Recaudado del mes"
        >
          <div class="resumen__progreso-barra" :style="{ width: `${porcentajeRecaudado}%` }" />
        </div>
        <div class="resumen__nota resumen__nota--progreso">
          {{ formatoPorcentaje(porcentajeRecaudado, 0) }} de
          {{ formatoMoneda(indicadores.esperado) }} esperado
        </div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Cartera vencida</div>
        <div class="resumen__valor resumen__valor--error">
          {{ formatoMoneda(indicadores.carteraVencida) }}
        </div>
        <div class="resumen__nota">
          {{ indicadores.unidadesVencidas }} unidades con cuotas vencidas
        </div>
      </div>
      <div class="safic-indicador">
        <div class="safic-indicador__etiqueta">Gastos del mes</div>
        <div class="resumen__valor">{{ formatoMoneda(indicadores.gastos) }}</div>
        <div class="resumen__nota">{{ indicadores.gastosDetalle }}</div>
      </div>
      <router-link
        :to="{ name: 'finanzas-pagos-por-aprobar' }"
        class="safic-indicador resumen__pendientes"
      >
        <div class="resumen__pendientes-etiqueta">Pagos por aprobar</div>
        <div class="resumen__valor">{{ indicadores.pagosPorAprobar }}</div>
        <div class="resumen__nota resumen__nota--fuerte">
          {{ formatoMoneda(indicadores.montoPorAprobar) }} en comprobantes · Revisar
        </div>
      </router-link>
    </div>

    <div class="resumen__cuerpo">
      <section class="safic-card resumen__cartera" aria-labelledby="resumen-cartera-titulo">
        <div class="resumen__fila-titulo">
          <h2 id="resumen-cartera-titulo" class="resumen__h2">Cartera por antigüedad</h2>
          <router-link :to="{ name: 'unidades' }" class="resumen__enlace">Ver unidades</router-link>
        </div>
        <div v-for="tramo in cartera" :key="tramo.etiqueta" class="resumen__tramo">
          <div class="text-weight-bold">{{ tramo.etiqueta }}</div>
          <div class="resumen__tramo-pista">
            <div
              class="resumen__tramo-barra"
              :style="{ width: `${tramo.porcentaje}%`, background: tramo.color }"
            />
          </div>
          <div class="resumen__tramo-monto">{{ formatoMoneda(tramo.monto) }}</div>
          <div class="resumen__tramo-unidades">{{ tramo.unidades }} unid.</div>
        </div>
        <div class="resumen__metodo">
          Método de cobro: <strong>{{ metodo.metodo }}</strong>
          <template v-for="valor in metodo.valores" :key="valor.tipo">
            · {{ valor.tipo }} {{ formatoMoneda(valor.monto) }}
          </template>
          · Vence el día {{ metodo.diaVencimiento }}
        </div>
      </section>

      <section class="resumen__lateral">
        <div class="safic-card resumen__tarjeta">
          <div class="resumen__fila-titulo q-mb-md">
            <h2 class="resumen__h2">Conciliación bancaria</h2>
            <EstadoBadge v-if="diferencia !== 0" tono="alerta">
              Diferencia {{ formatoMoneda(Math.abs(diferencia)) }}
            </EstadoBadge>
            <EstadoBadge v-else tono="exito">Cuadrado</EstadoBadge>
          </div>
          <div class="resumen__saldos">
            <div class="row no-wrap">
              <span class="col-grow">{{ conciliacion.cuenta }}</span>
              <strong>{{ formatoMoneda(conciliacion.saldoBanco) }}</strong>
            </div>
            <div class="row no-wrap">
              <span class="col-grow">Saldo en la app</span>
              <strong>{{ formatoMoneda(conciliacion.saldoApp) }}</strong>
            </div>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn full-width resumen__conciliar"
            :label="`Conciliar ${conciliacion.mes}`"
            :to="{ name: 'finanzas-conciliacion' }"
          />
        </div>
        <div class="safic-card resumen__tarjeta resumen__ultimos">
          <h2 class="resumen__h2 q-mb-md">Últimos pagos aprobados</h2>
          <div v-for="pago in ultimosPagos" :key="pago.unidad" class="resumen__pago">
            <div class="resumen__pago-unidad">{{ pago.unidad }}</div>
            <div class="resumen__pago-detalle">{{ pago.detalle }}</div>
            <div class="text-weight-bold">{{ formatoMoneda(pago.monto) }}</div>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { formatoMoneda, formatoPorcentaje } from '@/utils/formato';
import {
  RESUMEN_CARTERA,
  RESUMEN_CONCILIACION,
  RESUMEN_INDICADORES,
  RESUMEN_METODO_COBRO,
  RESUMEN_ULTIMOS_PAGOS,
} from '../demo/resumen';

const $q = useQuasar();

const indicadores = RESUMEN_INDICADORES;
const cartera = RESUMEN_CARTERA;
const metodo = RESUMEN_METODO_COBRO;
const conciliacion = RESUMEN_CONCILIACION;
const ultimosPagos = RESUMEN_ULTIMOS_PAGOS;

const porcentajeRecaudado = computed(() =>
  indicadores.esperado > 0 ? Math.round((indicadores.recaudado / indicadores.esperado) * 100) : 0,
);

/** Diferencia entre la app y el banco, en centavos para no arrastrar errores de float. */
const diferencia = computed(
  () => (Math.round(conciliacion.saldoApp * 100) - Math.round(conciliacion.saldoBanco * 100)) / 100,
);

function pendiente(accion: string): void {
  $q.notify({ type: 'info', message: `${accion}: disponible cuando exista la API.` });
}
</script>

<style scoped>
.resumen.safic-main {
  padding: 26px 32px;
  gap: 18px;
}

.resumen__periodo.resumen__periodo {
  padding: 6px 12px;
  font-size: 13px;
}

.resumen__accion.q-btn {
  padding: 0 16px;
}

.resumen__valor {
  font-size: 28px;
  font-weight: 800;
  margin-top: 6px;
  line-height: 1.3;
}

.resumen__valor--error {
  color: #9b1c12;
}

.resumen__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 4px;
}

.resumen__nota--progreso {
  margin-top: 6px;
}

.resumen__nota--fuerte {
  color: inherit;
  font-weight: 600;
}

.resumen__progreso {
  height: 6px;
  border-radius: 3px;
  background: var(--safic-linea);
  margin-top: 10px;
  overflow: hidden;
}

.resumen__progreso-barra {
  height: 6px;
  background: var(--q-primary);
}

.resumen__pendientes {
  display: block;
  background: #fff7ec;
  border-color: #f1d6ae;
  color: #8a3f0a;
  text-decoration: none;
}

.resumen__pendientes:hover {
  color: #8a3f0a;
  border-color: #e4bd83;
}

.resumen__pendientes-etiqueta {
  font-size: 13px;
  font-weight: 700;
}

.resumen__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.resumen__h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  flex-grow: 1;
}

.resumen__fila-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resumen__enlace {
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.resumen__cartera {
  flex-grow: 1;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.resumen__tramo {
  display: grid;
  grid-template-columns: 120px 1fr 110px 90px;
  align-items: center;
  gap: 14px;
  font-size: 14px;
}

.resumen__tramo-pista {
  height: 14px;
  border-radius: 4px;
  background: #f1efe8;
  overflow: hidden;
}

.resumen__tramo-barra {
  height: 14px;
}

.resumen__tramo-monto {
  text-align: right;
  font-weight: 700;
}

.resumen__tramo-unidades {
  text-align: right;
  color: var(--safic-texto-suave);
}

.resumen__metodo {
  border-top: 1px solid var(--safic-linea);
  padding-top: 12px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.resumen__metodo strong {
  color: var(--safic-texto);
}

.resumen__lateral {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resumen__tarjeta {
  padding: 20px 22px;
}

.resumen__ultimos {
  flex-grow: 1;
}

.resumen__saldos {
  font-size: 14px;
  color: var(--safic-texto-2);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resumen__saldos span {
  min-width: 0;
}

.resumen__saldos strong {
  color: var(--safic-texto);
  white-space: nowrap;
  padding-left: 8px;
}

.resumen__conciliar.q-btn {
  margin-top: 14px;
}

.resumen__pago {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--safic-linea-2);
  font-size: 14px;
}

.resumen__pago-unidad {
  width: 52px;
  flex-shrink: 0;
  font-weight: 800;
}

.resumen__pago-detalle {
  flex-grow: 1;
  color: var(--safic-texto-2);
}

@media (max-width: 1023px) {
  .resumen__cuerpo {
    flex-direction: column;
  }

  .resumen__lateral {
    width: auto;
  }
}

@media (max-width: 599px) {
  .resumen.safic-main {
    padding: 20px 16px;
  }

  .resumen__valor {
    font-size: 22px;
  }

  .resumen__tramo {
    grid-template-columns: 76px 1fr 84px;
    gap: 10px;
    font-size: 13px;
  }

  .resumen__tramo-unidades {
    display: none;
  }
}
</style>
