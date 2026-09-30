<template>
  <q-page class="safic-main cuenta">
    <section class="cuenta__principal">
      <div>
        <div class="safic-miga">
          <router-link :to="{ name: 'plataforma-cobranza' }" class="cuenta__miga-enlace">
            Cobranza
          </router-link>
          / {{ cuenta.codigo }}
        </div>
        <div class="cuenta__titulo-fila">
          <h1 class="safic-titulo cuenta__titulo">{{ cuenta.nombre }}</h1>
          <EstadoBadge
            class="cuenta__insignia"
            :tono="cuenta.suscripcion.tono"
            :texto="cuenta.suscripcion.texto"
          />
          <EstadoBadge
            class="cuenta__insignia"
            :tono="cuenta.estadoPago.tono"
            :texto="cuenta.estadoPago.texto"
          />
        </div>
      </div>

      <div class="cuenta__indicadores">
        <CobranzaIndicador
          :tamano="22"
          etiqueta="Plan"
          :valor="cuenta.plan"
          :nota="`Desde ${cuenta.planDesde}`"
        />
        <CobranzaIndicador
          :tamano="22"
          etiqueta="Cálculo mensual"
          :valor="`${cuenta.unidades} × ${formatoMoneda(cuenta.valorUnidad)}`"
          :nota="`${formatoMoneda(cuenta.subtotal)} + IVA ${cuenta.ivaPorcentaje} % ${formatoMoneda(cuenta.iva)}`"
        />
        <CobranzaIndicador
          :tamano="22"
          etiqueta="Mensualidad"
          :valor="formatoMoneda(cuenta.mensualidad)"
          :nota="`Se factura el día ${cuenta.diaFacturacion}`"
        />
        <CobranzaIndicador
          :tamano="22"
          tono="alerta"
          etiqueta="Saldo pendiente"
          :valor="formatoMoneda(cuenta.saldoPendiente)"
          :nota="cuenta.saldoNota"
        />
      </div>

      <div class="cuenta__tabla">
        <div class="cuenta__pestanas" role="tablist" aria-label="Movimientos de la cuenta">
          <button
            v-for="p in PESTANAS"
            :key="p.clave"
            type="button"
            role="tab"
            class="safic-pestana cuenta__pestana"
            :class="{ 'safic-pestana--activa': pestana === p.clave }"
            :aria-selected="pestana === p.clave"
            @click="pestana = p.clave"
          >
            {{ p.etiqueta }}
          </button>
        </div>
        <div class="cuenta__desplazable" role="tabpanel">
          <div class="cuenta__fila cuenta__cabecera" :style="{ gridTemplateColumns: vista.grilla }">
            <div
              v-for="col in vista.columnas"
              :key="col.etiqueta"
              class="cuenta__celda"
              :class="col.clase"
            >
              {{ col.etiqueta }}
            </div>
          </div>
          <div
            v-for="(fila, i) in vista.filas"
            :key="i"
            class="cuenta__fila cuenta__dato"
            :style="{ gridTemplateColumns: vista.grilla }"
          >
            <template v-for="(celda, j) in fila" :key="j">
              <div v-if="celda.estado" class="cuenta__celda">
                <EstadoBadge
                  class="cuenta__estado"
                  :tono="celda.estado.tono"
                  :texto="celda.estado.texto"
                />
              </div>
              <div v-else class="cuenta__celda" :class="vista.columnas[j]?.celda">
                {{ celda.texto }}
              </div>
            </template>
          </div>
        </div>
        <div class="cuenta__relleno" />
        <div class="cuenta__pie">
          Cada movimiento queda auditado. Las facturas se anulan solo con nota de crédito; nunca se
          editan.
        </div>
      </div>
    </section>

    <aside class="cuenta__lateral">
      <div class="cuenta__tarjeta cuenta__acciones">
        <h2 class="cuenta__subtitulo">Acciones</h2>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="safic-btn cuenta__accion cuenta__accion--principal"
          label="Registrar pago"
          @click="avisar('Registrar pago')"
        />
        <q-btn
          v-for="a in ACCIONES"
          :key="a"
          no-caps
          unelevated
          class="safic-btn safic-btn--secundario cuenta__accion"
          :label="a"
          @click="avisar(a)"
        />
        <div class="cuenta__nota">
          Los cambios de valor, unidades o plan se aplican desde la siguiente factura y guardan
          historial.
        </div>
      </div>

      <div class="cuenta__tarjeta cuenta__datos">
        <h2 class="cuenta__subtitulo cuenta__subtitulo--datos">Datos de facturación</h2>
        <div>
          <span class="cuenta__etiqueta">Razón social</span><br /><strong>{{
            cuenta.razonSocial
          }}</strong>
        </div>
        <div>
          <span class="cuenta__etiqueta">RUC</span><br /><strong>{{ cuenta.ruc }}</strong>
        </div>
        <div>
          <span class="cuenta__etiqueta">Correo de facturas</span><br /><strong
            class="cuenta__correo"
            >{{ cuenta.correoFacturas }}</strong
          >
        </div>
        <div>
          <span class="cuenta__etiqueta">Unidades registradas</span><br /><strong
            >{{ cuenta.unidadesRegistradas }} de {{ cuenta.unidades }}</strong
          >
        </div>
      </div>

      <div class="cuenta__suspension">
        <strong>Suspensión:</strong> día 15 de vencido pasa a solo lectura; día 30, suspendida. Se
        reactiva al registrar el pago.
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { formatoMoneda } from '@/utils/formato';
import CobranzaIndicador from '../components/CobranzaIndicador.vue';
import { CUENTA_CONDOMINIO, type EstadoCuenta } from '../demo/cuenta-condominio';

type PestanaCuenta = 'cc' | 'fac' | 'pag';

interface ColumnaCuenta {
  etiqueta: string;
  /** Clase de la cabecera. */
  clase?: string;
  /** Clase de las celdas de datos. */
  celda?: string;
}

interface CeldaCuenta {
  texto?: string;
  estado?: EstadoCuenta;
}

interface VistaCuenta {
  grilla: string;
  columnas: ColumnaCuenta[];
  filas: CeldaCuenta[][];
}

const PESTANAS: { clave: PestanaCuenta; etiqueta: string }[] = [
  { clave: 'cc', etiqueta: 'Cuenta corriente' },
  { clave: 'fac', etiqueta: 'Facturas' },
  { clave: 'pag', etiqueta: 'Pagos' },
];

const ACCIONES = [
  'Emitir nota de crédito',
  'Cambiar valor por unidad',
  'Cambiar total de unidades',
  'Cambiar plan',
];

const $q = useQuasar();
const cuenta = CUENTA_CONDOMINIO;
const pestana = ref<PestanaCuenta>('cc');

function monto(valor: number | null): string {
  return valor === null ? '' : formatoMoneda(valor);
}

const vista = computed<VistaCuenta>(() => {
  if (pestana.value === 'fac') {
    return {
      grilla: '170px minmax(0, 1fr) 110px 120px 120px 150px',
      columnas: [
        { etiqueta: 'NÚMERO', celda: 'cuenta__enlace' },
        { etiqueta: 'PERÍODO', celda: 'cuenta__fuerte' },
        { etiqueta: 'EMISIÓN' },
        { etiqueta: 'VENCE' },
        { etiqueta: 'TOTAL', clase: 'text-right', celda: 'text-right cuenta__negrita' },
        { etiqueta: 'ESTADO', clase: 'cuenta__sangria' },
      ],
      filas: cuenta.facturas.map((f) => [
        { texto: f.numero },
        { texto: f.periodo },
        { texto: f.emision },
        { texto: f.vence },
        { texto: formatoMoneda(f.total) },
        { estado: f.estado },
      ]),
    };
  }
  if (pestana.value === 'pag') {
    return {
      grilla: '110px 120px minmax(0, 1fr) 150px 120px 150px',
      columnas: [
        { etiqueta: 'FECHA' },
        { etiqueta: 'NÚMERO', celda: 'cuenta__enlace' },
        { etiqueta: 'ORIGEN', celda: 'cuenta__fuerte' },
        { etiqueta: 'REFERENCIA', celda: 'cuenta__tenue' },
        { etiqueta: 'MONTO', clase: 'text-right', celda: 'text-right cuenta__negrita' },
        { etiqueta: 'ESTADO', clase: 'cuenta__sangria' },
      ],
      filas: cuenta.pagos.map((p) => [
        { texto: p.fecha },
        { texto: p.numero },
        { texto: p.origen },
        { texto: p.referencia },
        { texto: formatoMoneda(p.monto) },
        { estado: p.estado },
      ]),
    };
  }
  return {
    grilla: '110px minmax(0, 1.6fr) 150px 120px 120px 120px',
    columnas: [
      { etiqueta: 'FECHA', celda: 'cuenta__tenue' },
      { etiqueta: 'CONCEPTO', celda: 'cuenta__fuerte' },
      { etiqueta: 'DOCUMENTO', celda: 'cuenta__enlace cuenta__documento' },
      { etiqueta: 'DEBE', clase: 'text-right', celda: 'text-right' },
      { etiqueta: 'HABER', clase: 'text-right', celda: 'text-right cuenta__haber' },
      { etiqueta: 'SALDO', clase: 'text-right', celda: 'text-right cuenta__saldo' },
    ],
    filas: cuenta.movimientos.map((m) => [
      { texto: m.fecha },
      { texto: m.concepto },
      { texto: m.documento },
      { texto: monto(m.debe) },
      { texto: monto(m.haber) },
      { texto: formatoMoneda(m.saldo) },
    ]),
  };
});

function avisar(accion: string): void {
  $q.notify({ type: 'info', message: `${accion}: disponible cuando exista el servicio.` });
}
</script>

<style scoped>
.cuenta.safic-main {
  padding: 28px 36px;
  gap: 20px;
  flex-direction: row;
  align-items: stretch;
}

.cuenta__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.cuenta__miga-enlace {
  text-decoration: none;
  color: var(--q-primary);
}

.cuenta__titulo-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.cuenta__titulo {
  margin: 0;
}

.cuenta__insignia {
  padding: 5px 12px;
  font-weight: 800;
}

.cuenta__indicadores {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.cuenta__tabla {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cuenta__pestanas {
  display: flex;
  gap: 4px;
  padding: 0 14px;
  border-bottom: 1px solid #ece9e0;
  overflow-x: auto;
}

.cuenta__pestana {
  height: 48px;
  color: #6b675d;
}

.cuenta__pestana.safic-pestana--activa {
  color: #1c1b18;
}

.cuenta__desplazable {
  overflow-x: auto;
}

.cuenta__fila {
  display: grid;
  min-width: 780px;
}

.cuenta__cabecera {
  padding: 10px;
  background: #faf9f5;
  font-size: 12px;
  font-weight: 700;
  color: #5f5b52;
  letter-spacing: 0.3px;
}

.cuenta__dato {
  align-items: center;
  padding: 0 10px;
  min-height: 52px;
  padding-top: 6px;
  padding-bottom: 6px;
  border-top: 1px solid #f0ede5;
  font-size: 14px;
}

.cuenta__celda {
  padding: 0 8px;
  min-width: 0;
}

.cuenta__sangria {
  padding-left: 24px;
}

.cuenta__estado {
  margin-left: 8px;
}

.cuenta__tenue {
  color: #3d3a33;
}

.cuenta__fuerte {
  font-weight: 600;
}

.cuenta__negrita {
  font-weight: 700;
}

.cuenta__enlace {
  color: var(--q-primary);
  font-weight: 700;
}

.cuenta__documento {
  font-size: 13px;
}

.cuenta__haber {
  color: #0b4a47;
}

.cuenta__saldo {
  font-weight: 800;
}

.cuenta__relleno {
  flex-grow: 1;
}

.cuenta__pie {
  padding: 12px 18px;
  background: #faf9f5;
  border-top: 1px solid #ece9e0;
  font-size: 12px;
  color: #5f5b52;
}

.cuenta__lateral {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cuenta__tarjeta {
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
}

.cuenta__acciones {
  gap: 10px;
}

.cuenta__subtitulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: 0;
}

.cuenta__subtitulo--datos {
  margin-bottom: 4px;
}

.cuenta__accion.q-btn {
  min-height: 42px;
  height: 42px;
  padding: 0 16px;
}

.cuenta__accion--principal.q-btn {
  min-height: 46px;
  height: 46px;
}

.cuenta__nota {
  font-size: 12px;
  color: #5f5b52;
  line-height: 1.5;
}

.cuenta__datos {
  font-size: 13px;
  gap: 8px;
}

.cuenta__etiqueta {
  color: #5f5b52;
}

.cuenta__correo {
  overflow-wrap: anywhere;
}

.cuenta__suspension {
  background: #f1efe8;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 12px;
  color: #3d3a33;
  line-height: 1.5;
}

@media (max-width: 1199px) {
  .cuenta.safic-main {
    flex-direction: column;
  }

  .cuenta__lateral {
    width: auto;
  }
}

@media (max-width: 1023px) {
  .cuenta__indicadores {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .cuenta.safic-main {
    padding: 20px 16px;
  }
}
</style>
