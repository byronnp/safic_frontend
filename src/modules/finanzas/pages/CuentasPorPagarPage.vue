<template>
  <q-page class="safic-main cxp">
    <section class="cxp__principal">
      <PaginaEncabezado miga="Finanzas / Cuentas por pagar" titulo="Cuentas por pagar">
        <template #acciones>
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario cxp__accion"
            label="Gastos recurrentes"
            @click="aviso('Gastos recurrentes')"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn cxp__accion"
            label="Subir factura (XML)"
            @click="xmlInput?.click()"
          />
          <input
            ref="xmlInput"
            type="file"
            accept=".xml,text/xml"
            class="hidden"
            aria-label="Factura electrónica (XML)"
            @change="alSubirXml"
          />
        </template>
      </PaginaEncabezado>

      <div class="cxp__indicadores">
        <div class="cxp__kpi cxp__kpi--alerta">
          <div class="cxp__kpi-etiqueta">Por aprobar</div>
          <div class="cxp__kpi-valor">
            {{ porAprobar.length }} · {{ formatoMoneda(sumaSaldos(porAprobar)) }}
          </div>
          <div class="cxp__kpi-sub">Registradas por el tesorero</div>
        </div>
        <div class="cxp__kpi">
          <div class="cxp__kpi-etiqueta">Aprobadas por pagar</div>
          <div class="cxp__kpi-valor">
            {{ porPagar.length }} · {{ formatoMoneda(sumaSaldos(porPagar)) }}
          </div>
          <div class="cxp__kpi-sub">Las paga el tesorero</div>
        </div>
        <div class="cxp__kpi cxp__kpi--error">
          <div class="cxp__kpi-etiqueta">Vencidas</div>
          <div class="cxp__kpi-valor">{{ formatoMoneda(sumaSaldos(vencidas)) }}</div>
          <div class="cxp__kpi-sub">
            {{ vencidas.length }} {{ vencidas.length === 1 ? 'factura' : 'facturas' }}
          </div>
        </div>
        <div class="cxp__kpi">
          <div class="cxp__kpi-etiqueta">Pagado en {{ CXP_PAGADO_MES.mes }}</div>
          <div class="cxp__kpi-valor">{{ formatoMoneda(CXP_PAGADO_MES.monto) }}</div>
          <div class="cxp__kpi-sub">{{ CXP_PAGADO_MES.nota }}</div>
        </div>
      </div>

      <div class="safic-card cxp__tabla">
        <div class="cxp__filtros">
          <button
            v-for="f in FILTROS"
            :key="f.clave"
            type="button"
            class="safic-pildora cxp__pildora"
            :class="{ 'safic-pildora--activa cxp__pildora--activa': filtro === f.clave }"
            :aria-pressed="filtro === f.clave"
            @click="filtro = f.clave"
          >
            {{ f.etiqueta }}
          </button>
          <div class="col-grow" />
          <span class="cxp__umbral">
            2.ª aprobación sobre {{ formatoMoneda(CXP_UMBRAL_SEGUNDA_APROBACION) }}
          </span>
        </div>
        <div class="cxp__desplazable">
          <div class="cxp__fila cxp__fila--cabecera">
            <div>PROVEEDOR · FACTURA</div>
            <div>VENCE</div>
            <div class="text-right">TOTAL</div>
            <div class="text-right">SALDO</div>
            <div class="cxp__col-estado">ESTADO</div>
          </div>
          <button
            v-for="f in filas"
            :key="f.id"
            type="button"
            class="cxp__fila cxp__fila--dato"
            :class="{ 'cxp__fila--activa': f.id === seleccionadaId }"
            :aria-pressed="f.id === seleccionadaId"
            @click="seleccionadaId = f.id"
          >
            <div class="cxp__proveedor">
              <div class="cxp__proveedor-nombre">{{ f.proveedor }}</div>
              <div class="cxp__sub">{{ f.categoria }} · {{ f.factura }}</div>
            </div>
            <div :class="f.vencida && f.saldo > 0 ? 'cxp__vence--vencida' : 'cxp__vence'">
              {{ f.vence }}
            </div>
            <div class="text-right text-weight-bold">{{ formatoMoneda(f.total) }}</div>
            <div class="text-right text-weight-bolder">{{ formatoMoneda(f.saldo) }}</div>
            <div class="cxp__col-estado">
              <EstadoBadge :tono="ESTADOS[f.estado].tono">{{
                ESTADOS[f.estado].texto
              }}</EstadoBadge>
            </div>
          </button>
          <div v-if="filas.length === 0" class="cxp__vacio">No hay facturas en este filtro.</div>
        </div>
      </div>
    </section>

    <aside v-if="detalle" class="safic-card cxp__detalle" aria-label="Detalle de la factura">
      <div>
        <div class="cxp__detalle-cat">{{ detalle.categoria }}</div>
        <div class="cxp__detalle-prov">{{ detalle.proveedor }}</div>
        <div class="cxp__sub q-mt-xs">RUC {{ detalle.ruc }} · Factura {{ detalle.factura }}</div>
      </div>
      <div class="cxp__sri">
        <q-icon name="sym_r_check" size="16px" class="cxp__sri-icono" />
        XML válido en el SRI · PDF adjunto
      </div>
      <div class="cxp__valores">
        <div class="cxp__valor">
          <span>Subtotal</span><span>{{ formatoMoneda(desglose.subtotal) }}</span>
        </div>
        <div class="cxp__valor">
          <span>IVA 15 %</span><span>{{ formatoMoneda(desglose.iva) }}</span>
        </div>
        <div class="cxp__valor cxp__valor--total">
          <span>Total</span><span>{{ formatoMoneda(detalle.total) }}</span>
        </div>
      </div>

      <div class="cxp__seccion">APROBACIÓN</div>
      <div v-for="paso in pasos" :key="paso.titulo" class="cxp__paso">
        <span class="cxp__punto" :style="{ background: paso.color }" />
        <div>
          <div class="text-weight-bold">{{ paso.titulo }}</div>
          <div class="cxp__paso-sub">{{ paso.detalle }}</div>
        </div>
      </div>

      <div class="col-grow" />

      <div v-if="detalle.estado === 'pen'" class="cxp__botones">
        <q-btn unelevated no-caps class="cxp__rechazar" label="Rechazar" @click="rechazar" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="cxp__aprobar"
          label="Aprobar"
          @click="aprobar"
        />
      </div>
      <div v-if="nota" class="cxp__nota" :style="{ background: nota.fondo, color: nota.texto }">
        {{ nota.mensaje }}
      </div>
      <q-btn
        v-if="detalle.estado === 'apr' || detalle.estado === 'par'"
        unelevated
        no-caps
        color="primary"
        class="cxp__pagar"
        icon="sym_r_payments"
        label="Registrar pago"
        :to="{ name: 'finanzas-pago-proveedor', params: { id: detalle.id } }"
      />
    </aside>
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
  CXP_FACTURAS,
  CXP_PAGADO_MES,
  CXP_TARIFA_IVA,
  CXP_UMBRAL_SEGUNDA_APROBACION,
} from '../demo/cuentas-por-pagar';
import type { EstadoFactura, FacturaProveedor } from '../demo/cuentas-por-pagar';

type Grupo = 'todas' | 'aprobar' | 'pagar' | 'pagadas';

const ESTADOS: Record<EstadoFactura, { texto: string; tono: TonoEstado }> = {
  pen: { texto: 'Por aprobar', tono: 'alerta' },
  n2: { texto: 'Falta 2.ª aprobación', tono: 'alerta' },
  apr: { texto: 'Aprobada · por pagar', tono: 'info' },
  par: { texto: 'Pagada parcial', tono: 'info' },
  pag: { texto: 'Pagada', tono: 'exito' },
  rec: { texto: 'Rechazada', tono: 'error' },
};

const FILTROS: { clave: Grupo; etiqueta: string }[] = [
  { clave: 'todas', etiqueta: 'Todas' },
  { clave: 'aprobar', etiqueta: 'Por aprobar' },
  { clave: 'pagar', etiqueta: 'Por pagar' },
  { clave: 'pagadas', etiqueta: 'Pagadas' },
];

const COLOR_OK = '#0E5E5B';
const COLOR_PENDIENTE = '#F0B35A';
const COLOR_ESPERA = '#D8D4C8';
const COLOR_ERROR = '#9B1C12';
/** Quien aprueba en esta vista previa (administradora). */
const APROBADOR = 'María Rodríguez';

const $q = useQuasar();

const facturas = ref<FacturaProveedor[]>(CXP_FACTURAS.map((f) => ({ ...f })));
const filtro = ref<Grupo>('todas');
const seleccionadaId = ref<number>(CXP_FACTURAS[0]?.id ?? 0);
const xmlInput = ref<HTMLInputElement | null>(null);

function grupo(estado: EstadoFactura): Grupo | 'otras' {
  if (estado === 'pen' || estado === 'n2') return 'aprobar';
  if (estado === 'apr' || estado === 'par') return 'pagar';
  if (estado === 'pag') return 'pagadas';
  return 'otras';
}

function sumaSaldos(lista: FacturaProveedor[]): number {
  return lista.reduce((suma, f) => suma + Math.round(f.saldo * 100), 0) / 100;
}

const porAprobar = computed(() => facturas.value.filter((f) => grupo(f.estado) === 'aprobar'));
const porPagar = computed(() => facturas.value.filter((f) => grupo(f.estado) === 'pagar'));
const vencidas = computed(() =>
  facturas.value.filter((f) => f.vencida && f.saldo > 0 && f.estado !== 'rec'),
);

const filas = computed(() =>
  facturas.value.filter((f) => filtro.value === 'todas' || grupo(f.estado) === filtro.value),
);

const detalle = computed(() => facturas.value.find((f) => f.id === seleccionadaId.value) ?? null);

const desglose = computed(() => {
  const total = Math.round((detalle.value?.total ?? 0) * 100);
  const subtotal = Math.round(total / (1 + CXP_TARIFA_IVA));
  return { subtotal: subtotal / 100, iva: (total - subtotal) / 100 };
});

const pasos = computed(() => {
  const f = detalle.value;
  if (!f) return [];
  const lista = [{ titulo: 'Registrada', detalle: f.registradaPor, color: COLOR_OK }];
  if (f.estado === 'rec') {
    lista.push({
      titulo: 'Rechazada',
      detalle: `${APROBADOR} · hoy · factura con valor incorrecto`,
      color: COLOR_ERROR,
    });
    return lista;
  }
  lista.push(
    f.nivel1
      ? { titulo: 'Nivel 1 · administrador', detalle: `Aprobada por ${f.nivel1}`, color: COLOR_OK }
      : { titulo: 'Nivel 1 · administrador', detalle: 'Pendiente', color: COLOR_PENDIENTE },
  );
  if (f.total > CXP_UMBRAL_SEGUNDA_APROBACION) {
    const titulo = 'Nivel 2 · presidente o vicepresidente';
    lista.push(
      f.nivel2
        ? { titulo, detalle: `Aprobada por ${f.nivel2}`, color: COLOR_OK }
        : {
            titulo,
            detalle: f.nivel1 ? 'Pendiente · se les notificó' : 'Se pide después del nivel 1',
            color: COLOR_ESPERA,
          },
    );
  }
  return lista;
});

const nota = computed(() => {
  const f = detalle.value;
  if (!f) return null;
  switch (f.estado) {
    case 'n2':
      return {
        mensaje: `Tu parte está hecha. Falta la aprobación del presidente o del vicepresidente porque supera ${formatoMoneda(CXP_UMBRAL_SEGUNDA_APROBACION)}.`,
        fondo: '#FFF7EC',
        texto: '#7A3808',
      };
    case 'apr':
      return {
        mensaje:
          'Lista para pago. El tesorero la paga desde el banco y la registra en Pagos a proveedores.',
        fondo: '#E6ECF7',
        texto: '#23407A',
      };
    case 'par':
      return { mensaje: f.notaPago ?? '', fondo: '#FDE8E6', texto: '#7F1810' };
    case 'pag':
      return { mensaje: f.notaPago ?? '', fondo: '#E3EFEC', texto: '#0B4A47' };
    case 'rec':
      return {
        mensaje: 'Rechazada. El tesorero puede corregir y volver a subirla.',
        fondo: '#FDE8E6',
        texto: '#7F1810',
      };
    default:
      return null;
  }
});

function actualizar(cambios: Partial<FacturaProveedor>): void {
  facturas.value = facturas.value.map((f) =>
    f.id === seleccionadaId.value ? { ...f, ...cambios } : f,
  );
}

function aprobar(): void {
  const f = detalle.value;
  if (!f) return;
  const requiereNivel2 = f.total > CXP_UMBRAL_SEGUNDA_APROBACION;
  actualizar({ estado: requiereNivel2 ? 'n2' : 'apr', nivel1: `${APROBADOR} · hoy` });
  $q.notify({
    type: 'positive',
    message: requiereNivel2
      ? 'Factura aprobada. Falta la aprobación del presidente o vicepresidente.'
      : 'Factura aprobada y lista para pago.',
  });
}

function rechazar(): void {
  actualizar({ estado: 'rec' });
  $q.notify({ type: 'positive', message: 'Factura rechazada. Se avisó al tesorero.' });
}

function aviso(pantalla: string): void {
  $q.notify({ type: 'info', message: `${pantalla}: disponible cuando exista la API.` });
}

function alSubirXml(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  const nombre = input.files?.[0]?.name;
  if (nombre) {
    $q.notify({ type: 'positive', message: `Factura ${nombre} recibida para validar en el SRI.` });
  }
  input.value = '';
}
</script>

<style scoped>
.cxp.safic-main {
  padding: 22px 32px;
  gap: 18px;
  flex-direction: row;
  align-items: stretch;
}

.cxp__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.cxp__accion.q-btn {
  padding: 0 16px;
}

.cxp__indicadores {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.cxp__kpi {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 14px 16px;
  color: var(--safic-texto);
}

.cxp__kpi--alerta {
  background: #fff7ec;
  border-color: #f1d6ae;
  color: #8a3f0a;
}

.cxp__kpi--error {
  background: #fde8e6;
  border-color: #f3b8b2;
  color: #9b1c12;
}

.cxp__kpi-etiqueta {
  font-size: 12px;
  font-weight: 700;
}

.cxp__kpi-valor {
  font-size: 22px;
  line-height: 1.35;
  font-weight: 800;
  margin-top: 4px;
}

.cxp__kpi-sub {
  font-size: 12px;
  font-weight: 600;
}

.cxp__tabla {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cxp__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--safic-linea);
  flex-wrap: wrap;
}

.cxp__pildora {
  height: 34px;
  padding: 0 14px;
}

.cxp__pildora--activa {
  background: var(--safic-tinta);
  border-color: var(--safic-tinta);
}

.cxp__umbral {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.cxp__desplazable {
  overflow-x: auto;
}

.cxp__fila {
  display: grid;
  grid-template-columns: 1.5fr 90px 110px 110px 190px;
  align-items: center;
  min-width: 720px;
  padding: 0 16px;
}

.cxp__fila--cabecera {
  padding: 9px 16px;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.cxp__fila--dato {
  width: 100%;
  text-align: left;
  height: 54px;
  border: none;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
}

.cxp__fila--dato:hover {
  background: var(--safic-fondo-2);
}

.cxp__fila--activa,
.cxp__fila--activa:hover {
  background: #f2f7f6;
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.cxp__col-estado {
  padding-left: 18px;
}

.cxp__proveedor {
  min-width: 0;
}

.cxp__proveedor-nombre {
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cxp__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cxp__proveedor .cxp__sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cxp__vence {
  color: var(--safic-texto-2);
}

.cxp__vence--vencida {
  color: #9b1c12;
  font-weight: 800;
}

.cxp__vacio {
  padding: 32px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.cxp__detalle {
  width: 360px;
  flex-shrink: 0;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cxp__detalle-cat {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.cxp__detalle-prov {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
}

.cxp__sri {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e3efec;
  color: #0b4a47;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
}

.cxp__sri-icono {
  font-variation-settings: 'wght' 700;
}

.cxp__valores {
  background: var(--safic-fondo-2);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cxp__valor {
  display: flex;
}

.cxp__valor span:first-child {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.cxp__valor--total {
  font-weight: 800;
}

.cxp__valor--total span:first-child {
  color: var(--safic-texto);
}

.cxp__seccion {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.cxp__paso {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
}

.cxp__paso-sub {
  color: var(--safic-texto-suave);
  font-size: 12px;
}

.cxp__punto {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.cxp__botones {
  display: flex;
  gap: 10px;
}

.cxp__rechazar.q-btn,
.cxp__aprobar.q-btn,
.cxp__pagar.q-btn {
  min-height: 46px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.cxp__rechazar.q-btn {
  flex: 1 1 0;
  background: #ffffff;
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.cxp__aprobar.q-btn {
  flex: 2 1 0;
}

.cxp__pagar :deep(.q-icon) {
  font-size: 20px;
}

.cxp__nota {
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 600;
}

@media (max-width: 1023px) {
  .cxp.safic-main {
    flex-direction: column;
  }

  .cxp__indicadores {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cxp__detalle {
    width: auto;
  }
}

@media (max-width: 599px) {
  .cxp.safic-main {
    padding: 20px 16px;
  }

  .cxp__kpi-valor {
    font-size: 18px;
  }
}
</style>
