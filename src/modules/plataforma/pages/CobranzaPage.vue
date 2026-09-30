<template>
  <q-page class="safic-main cobranza">
    <PaginaEncabezado miga="Plataforma / Cobranza" :titulo="`Cobranza · ${resumen.periodo}`">
      <template #acciones>
        <q-btn
          no-caps
          unelevated
          class="safic-btn safic-btn--secundario cobranza__btn"
          label="Conciliar mi banco"
          @click="avisar('La conciliación del banco de la plataforma estará disponible pronto.')"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="safic-btn cobranza__btn"
          label="Registrar pago"
          @click="avisar('Elige el condominio para registrar su pago.')"
        />
      </template>
    </PaginaEncabezado>

    <div class="cobranza__indicadores">
      <CobranzaIndicador
        etiqueta="Ingreso recurrente mensual"
        :valor="formatoMoneda(resumen.ingresoRecurrente)"
        :nota="`${resumen.condominiosActivos} condominios activos, sin IVA`"
      />
      <CobranzaIndicador
        etiqueta="Facturado del mes"
        :valor="formatoMoneda(resumen.facturadoMes)"
        nota="Con IVA"
      />
      <CobranzaIndicador
        etiqueta="Cobrado"
        :valor="formatoMoneda(resumen.cobrado)"
        color-valor="#0B4A47"
      >
        <div
          class="cobranza__barra"
          role="progressbar"
          :aria-valuenow="resumen.porcentajeCobrado"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Porcentaje cobrado"
        >
          <div
            class="cobranza__barra-relleno"
            :style="{ width: `${resumen.porcentajeCobrado}%` }"
          />
        </div>
      </CobranzaIndicador>
      <CobranzaIndicador
        tono="alerta"
        etiqueta="Pagos por aprobar"
        :valor="`${resumen.porAprobarCantidad} · ${formatoMoneda(resumen.porAprobarMonto)}`"
        :nota="resumen.porAprobarCondominio"
      />
      <CobranzaIndicador
        tono="error"
        etiqueta="Cartera vencida"
        :valor="formatoMoneda(resumen.carteraVencida)"
        :nota="`${resumen.condominiosSuspendidos} condominio suspendido`"
      />
    </div>

    <section class="cobranza__tabla">
      <div class="cobranza__barra-tabla">
        <h2 class="cobranza__subtitulo">Estado de pago por condominio</h2>
        <div class="cobranza__filtros" role="group" aria-label="Filtrar condominios">
          <button
            v-for="f in FILTROS"
            :key="f.clave"
            type="button"
            class="cobranza__filtro"
            :class="{ 'cobranza__filtro--activo': filtro === f.clave }"
            :aria-pressed="filtro === f.clave"
            @click="filtro = f.clave"
          >
            {{ f.etiqueta }}
          </button>
        </div>
      </div>

      <div class="cobranza__desplazable">
        <div class="cobranza__fila cobranza__cabecera">
          <div>CONDOMINIO</div>
          <div>PLAN</div>
          <div class="text-right">UNIDADES</div>
          <div class="text-right">$ / UNIDAD</div>
          <div class="text-right">FACTURA OCT</div>
          <div class="cobranza__sangria">ESTADO DE PAGO</div>
          <div class="text-right">SALDO</div>
          <div class="cobranza__sangria">SUSCRIPCIÓN</div>
        </div>
        <router-link
          v-for="c in filas"
          :key="c.id"
          :to="{ name: 'plataforma-cuenta-condominio', params: { id: c.id } }"
          class="cobranza__fila cobranza__dato"
        >
          <div>
            <div class="cobranza__nombre">{{ c.nombre }}</div>
            <div class="cobranza__codigo">{{ c.codigo }}</div>
          </div>
          <div>{{ c.plan }}</div>
          <div class="text-right">{{ c.unidades }}</div>
          <div class="text-right">{{ formatoMoneda(c.valorUnidad) }}</div>
          <div class="text-right cobranza__factura">
            {{ c.factura === null ? '—' : formatoMoneda(c.factura) }}
          </div>
          <div class="cobranza__sangria">
            <EstadoBadge :tono="TONO_PAGO[c.estadoPago]" :texto="c.estadoPagoTexto" />
          </div>
          <div class="text-right cobranza__saldo">{{ formatoMoneda(c.saldo) }}</div>
          <div class="cobranza__sangria">
            <EstadoBadge
              :tono="SUSCRIPCION[c.suscripcion].tono"
              :texto="SUSCRIPCION[c.suscripcion].texto"
            />
          </div>
        </router-link>
        <div v-if="filas.length === 0" class="cobranza__vacio">
          No hay condominios con este filtro.
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import type { TonoEstado } from '@/components/EstadoBadge.vue';
import { formatoMoneda } from '@/utils/formato';
import CobranzaIndicador from '../components/CobranzaIndicador.vue';
import {
  CONDOMINIOS_COBRANZA,
  RESUMEN_COBRANZA,
  type CondominioCobranza,
  type EstadoPagoCobranza,
  type EstadoSuscripcionCobranza,
} from '../demo/cobranza';

type FiltroCobranza = 'todos' | 'deben' | 'aprobar' | 'vencidos';

const FILTROS: { clave: FiltroCobranza; etiqueta: string }[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'deben', etiqueta: 'Con saldo' },
  { clave: 'aprobar', etiqueta: 'Por aprobar' },
  { clave: 'vencidos', etiqueta: 'Vencidos' },
];

const COINCIDE: Record<FiltroCobranza, (c: CondominioCobranza) => boolean> = {
  todos: () => true,
  deben: (c) => ['por_aprobar', 'pendiente', 'vencido'].includes(c.estadoPago),
  aprobar: (c) => c.estadoPago === 'por_aprobar',
  vencidos: (c) => c.estadoPago === 'vencido',
};

const TONO_PAGO: Record<EstadoPagoCobranza, TonoEstado> = {
  al_dia: 'exito',
  por_aprobar: 'alerta',
  pendiente: 'info',
  vencido: 'error',
  prueba: 'neutro',
};

const SUSCRIPCION: Record<EstadoSuscripcionCobranza, { texto: string; tono: TonoEstado }> = {
  activa: { texto: 'Activa', tono: 'exito' },
  prueba: { texto: 'Prueba', tono: 'neutro' },
  suspendida: { texto: 'Suspendida', tono: 'error' },
};

const $q = useQuasar();
const resumen = RESUMEN_COBRANZA;
const filtro = ref<FiltroCobranza>('todos');
const filas = computed(() => CONDOMINIOS_COBRANZA.filter(COINCIDE[filtro.value]));

function avisar(mensaje: string): void {
  $q.notify({ type: 'info', message: mensaje });
}
</script>

<style scoped>
.cobranza.safic-main {
  padding: 28px 36px;
  gap: 18px;
}

.cobranza__btn.q-btn {
  padding: 0 16px;
}

.cobranza__indicadores {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.cobranza__barra {
  height: 6px;
  border-radius: 3px;
  background: #ece9e0;
  margin-top: 8px;
  overflow: hidden;
}

.cobranza__barra-relleno {
  height: 6px;
  background: var(--q-primary);
}

.cobranza__tabla {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cobranza__barra-tabla {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #ece9e0;
  flex-wrap: wrap;
}

.cobranza__subtitulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 800;
  flex-grow: 1;
  letter-spacing: 0;
}

.cobranza__filtros {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cobranza__filtro {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  background: #ffffff;
  color: #3d3a33;
  border: 1px solid #d8d4c8;
}

.cobranza__filtro--activo {
  background: #1c1b18;
  color: #ffffff;
  border-color: #1c1b18;
}

.cobranza__desplazable {
  overflow-x: auto;
}

.cobranza__fila {
  display: grid;
  grid-template-columns: minmax(180px, 1.6fr) 120px 90px 90px 110px 170px 110px 130px;
  min-width: 1020px;
}

.cobranza__cabecera {
  padding: 10px 18px;
  background: #faf9f5;
  font-size: 12px;
  font-weight: 700;
  color: #5f5b52;
  letter-spacing: 0.3px;
}

.cobranza__dato {
  align-items: center;
  padding: 0 18px;
  height: 56px;
  border-top: 1px solid #f0ede5;
  font-size: 14px;
  color: #1c1b18;
  text-decoration: none;
}

.cobranza__dato:hover {
  background: #faf9f5;
}

.cobranza__dato:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.cobranza__nombre {
  font-weight: 800;
}

.cobranza__codigo {
  font-size: 12px;
  color: #5f5b52;
}

.cobranza__factura {
  font-weight: 700;
}

.cobranza__saldo {
  font-weight: 800;
}

.cobranza__sangria {
  padding-left: 16px;
}

.cobranza__vacio {
  padding: 28px 18px;
  text-align: center;
  font-size: 14px;
  color: #5f5b52;
  border-top: 1px solid #f0ede5;
}

@media (max-width: 1279px) {
  .cobranza__indicadores {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .cobranza__indicadores {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .cobranza.safic-main {
    padding: 20px 16px;
  }
}
</style>
