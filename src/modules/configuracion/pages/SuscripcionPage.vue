<template>
  <q-page class="safic-main suscripcion">
    <section class="suscripcion__principal">
      <PaginaEncabezado miga="Configuración / Mi suscripción" titulo="Mi suscripción">
        <template #acciones>
          <span class="al-dia">Al día</span>
        </template>
      </PaginaEncabezado>

      <div class="kpis">
        <div class="kpi">
          <div class="kpi__etiqueta">Plan</div>
          <div class="kpi__valor">{{ SUSCRIPCION.plan }}</div>
          <div class="kpi__nota">{{ SUSCRIPCION.modulos }}</div>
        </div>
        <div class="kpi">
          <div class="kpi__etiqueta">Unidades registradas</div>
          <div class="kpi__valor">
            {{ SUSCRIPCION.unidadesRegistradas }} de {{ SUSCRIPCION.unidadesLimite }}
          </div>
          <div class="barra" role="presentation">
            <div class="barra__relleno" :style="{ width: `${usoUnidades}%` }" />
          </div>
          <div class="kpi__pie">
            <span class="kpi__limite">Límite alcanzado</span>
            <button type="button" class="enlace" @click="abrir">Solicitar aumento</button>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__etiqueta">Usuarios administrativos</div>
          <div class="kpi__valor">
            {{ SUSCRIPCION.usuariosAdministrativos }} de {{ SUSCRIPCION.usuariosLimite }}
          </div>
          <div class="barra" role="presentation">
            <div class="barra__relleno" :style="{ width: `${usoUsuarios}%` }" />
          </div>
          <div class="kpi__nota kpi__nota--separada">{{ SUSCRIPCION.usuariosDetalle }}</div>
        </div>
        <div class="kpi">
          <div class="kpi__etiqueta">Mensualidad</div>
          <div class="kpi__valor">{{ formatoMoneda(mensualidad.total) }}</div>
          <div class="kpi__nota">
            {{ SUSCRIPCION.unidadesLimite }} × {{ formatoMoneda(SUSCRIPCION.precioPorUnidad) }} =
            {{ formatoMoneda(mensualidad.subtotal) }} + IVA {{ formatoMoneda(mensualidad.iva) }}
          </div>
        </div>
      </div>

      <form v-if="formulario" class="solicitud" @submit.prevent="enviar">
        <div class="solicitud__campo">
          <label for="suscripcion-nuevo">Nuevo total de unidades</label>
          <input
            id="suscripcion-nuevo"
            v-model="nuevo"
            class="solicitud__control"
            inputmode="numeric"
            autofocus
          />
        </div>
        <div class="solicitud__texto">
          Nueva mensualidad estimada: <strong>{{ estimado }}</strong
          ><br /><span class="text-suave"
            >La plataforma aprueba el cambio; se cobra desde la siguiente factura.</span
          >
        </div>
        <div class="solicitud__acciones">
          <button type="button" class="solicitud__btn" @click="formulario = false">Cancelar</button>
          <button type="submit" class="solicitud__btn solicitud__btn--principal">
            Enviar solicitud
          </button>
        </div>
      </form>
      <div v-if="enviada" class="enviada" role="status">
        Solicitud enviada: aumentar a {{ nuevo }} unidades. Te avisaremos cuando la plataforma la
        apruebe.
      </div>

      <div class="facturas">
        <div class="facturas__barra">
          <h2 class="facturas__titulo">Facturas</h2>
        </div>
        <div class="facturas__desplazable">
          <div class="facturas__fila facturas__cabecera">
            <div>NÚMERO</div>
            <div>PERÍODO</div>
            <div>VENCE</div>
            <div class="text-right">TOTAL</div>
            <div class="facturas__estado">ESTADO</div>
            <div>PDF</div>
          </div>
          <div v-for="f in FACTURAS" :key="f.numero" class="facturas__fila facturas__item">
            <div class="text-weight-bold">{{ f.numero }}</div>
            <div class="facturas__periodo">{{ f.periodo }}</div>
            <div class="facturas__vence">{{ f.vence }}</div>
            <div class="text-right text-weight-bold">{{ formatoMoneda(f.total) }}</div>
            <div class="facturas__estado">
              <EstadoBadge tono="exito">{{ f.estado }}</EstadoBadge>
            </div>
            <div>
              <button
                type="button"
                class="enlace enlace--descargar"
                :aria-label="`Descargar factura ${f.numero}`"
                @click="descargar(f.numero)"
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="lateral">
      <div class="pagar">
        <h2 class="pagar__titulo">Cómo pagar</h2>
        <div class="pagar__texto">
          Transfiere el valor de la factura a una de estas cuentas e incluye tu
          <strong>código de cliente</strong> en la descripción.
        </div>
        <div class="codigo">
          <div class="col-grow">
            <div class="codigo__etiqueta">CÓDIGO DE CLIENTE</div>
            <div class="codigo__valor">{{ SUSCRIPCION.codigoCliente }}</div>
          </div>
          <button type="button" class="codigo__copiar" @click="copiar">
            {{ copiado ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <div v-for="c in CUENTAS_BANCARIAS" :key="c.numero" class="cuenta">
          <strong>{{ c.banco }}</strong> · {{ c.tipo }}<br />N.º {{ c.numero }}<br />{{ c.titular
          }}<br />RUC {{ c.ruc }}
        </div>
        <button type="button" class="pagar__subir" @click="archivo?.click()">
          Subir comprobante
        </button>
        <input
          ref="archivo"
          type="file"
          accept="image/*,application/pdf"
          class="hidden"
          aria-label="Comprobante de pago"
          @change="comprobanteElegido"
        />
        <div class="pagar__nota">
          Si pagas con el código, el pago se concilia solo al importar el estado de cuenta. El
          comprobante acelera la aprobación.
        </div>
      </div>
      <div class="politica">
        Si una factura se vence 15 días, el sistema pasa a <strong>solo lectura</strong>; a los 30
        días, se suspende. Tus datos nunca se borran.
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { formatoMoneda } from '@/utils/formato';
import { CUENTAS_BANCARIAS, FACTURAS, SUSCRIPCION } from '../demo/suscripcion';

const $q = useQuasar();

const formulario = ref(false);
const enviada = ref(false);
const nuevo = ref(String(SUSCRIPCION.unidadesSolicitudSugerida));
const copiado = ref(false);
const archivo = ref<HTMLInputElement | null>(null);

const porcentaje = (usado: number, limite: number) =>
  limite > 0 ? Math.min(100, Math.round((usado / limite) * 100)) : 0;

const usoUnidades = porcentaje(SUSCRIPCION.unidadesRegistradas, SUSCRIPCION.unidadesLimite);
const usoUsuarios = porcentaje(SUSCRIPCION.usuariosAdministrativos, SUSCRIPCION.usuariosLimite);

const mensualidad = (() => {
  const subtotal = SUSCRIPCION.unidadesLimite * SUSCRIPCION.precioPorUnidad;
  const iva = Math.round(subtotal * SUSCRIPCION.iva * 100) / 100;
  return { subtotal, iva, total: subtotal + iva };
})();

const estimado = computed(() => {
  const n = parseInt(nuevo.value, 10);
  if (Number.isNaN(n) || n <= 0) {
    return '—';
  }
  return formatoMoneda(n * SUSCRIPCION.precioPorUnidad * (1 + SUSCRIPCION.iva));
});

function abrir() {
  formulario.value = true;
  enviada.value = false;
}

function enviar() {
  formulario.value = false;
  enviada.value = true;
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(SUSCRIPCION.codigoCliente);
  } catch {
    // Sin permiso de portapapeles: igual se muestra el código en pantalla.
  }
  copiado.value = true;
}

function descargar(numero: string) {
  $q.notify({ type: 'positive', message: `Descargando la factura ${numero}.` });
}

function comprobanteElegido(evento: Event) {
  const input = evento.target as HTMLInputElement;
  if (input.files?.length) {
    $q.notify({ type: 'positive', message: 'Comprobante enviado. Te avisaremos al aprobarlo.' });
    input.value = '';
  }
}
</script>

<style scoped>
.suscripcion.safic-main {
  padding: 24px 32px;
  flex-direction: row;
  gap: 20px;
}

.suscripcion__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.al-dia {
  padding: 6px 14px;
  border-radius: 999px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 800;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px 18px;
}

.kpi__etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.kpi__valor {
  font-size: 22px;
  font-weight: 800;
  margin-top: 6px;
}

.kpi__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.kpi__nota--separada {
  margin-top: 8px;
}

.kpi__pie {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
}

.kpi__limite {
  flex-grow: 1;
  color: #8a3f0a;
  font-weight: 700;
}

.barra {
  height: 6px;
  border-radius: 3px;
  background: var(--safic-linea);
  margin-top: 8px;
  overflow: hidden;
}

.barra__relleno {
  height: 6px;
  background: #b8641c;
}

.enlace {
  border: none;
  background: none;
  padding: 0;
  color: var(--q-primary);
  font-size: 12px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
}

.enlace--descargar {
  font-size: 13px;
  font-weight: 700;
}

.solicitud {
  background: #ffffff;
  border: 1px solid var(--q-primary);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.solicitud__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  width: 180px;
}

.solicitud__control {
  height: 42px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--safic-texto);
  box-sizing: border-box;
  width: 100%;
}

.solicitud__control:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}

.solicitud__texto {
  flex-grow: 1;
  flex-basis: 260px;
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
  padding-bottom: 4px;
}

.solicitud__acciones {
  display: flex;
  gap: 14px;
}

.solicitud__btn {
  height: 42px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.solicitud__btn--principal {
  padding: 0 16px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.enviada {
  background: #e3efec;
  color: #0b4a47;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 600;
}

.facturas {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.facturas__barra {
  padding: 14px 20px;
  border-bottom: 1px solid var(--safic-linea);
}

.facturas__titulo,
.pagar__titulo {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.facturas__desplazable {
  overflow-x: auto;
}

.facturas__fila {
  display: grid;
  grid-template-columns: 170px 1fr 110px 120px 130px 90px;
  min-width: 760px;
}

.facturas__cabecera {
  padding: 10px 20px;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.facturas__item {
  align-items: center;
  padding: 0 20px;
  height: 52px;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
}

.facturas__periodo {
  font-weight: 600;
}

.facturas__vence {
  color: var(--safic-texto-2);
}

.facturas__estado {
  padding-left: 20px;
}

.lateral {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pagar {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pagar__texto {
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.codigo {
  background: var(--safic-tinta);
  color: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
}

.codigo__etiqueta {
  font-size: 11px;
  color: #b9cdc9;
  font-weight: 700;
}

.codigo__valor {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
}

.codigo__copiar {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: none;
  background: #f0b35a;
  color: var(--safic-tinta);
  font-size: 12px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
}

.cuenta {
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.55;
}

.pagar__subir {
  height: 46px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.pagar__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.politica {
  background: #f1efe8;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 12px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

@media (max-width: 1199px) {
  .suscripcion.safic-main {
    flex-direction: column;
  }

  .lateral {
    width: 100%;
  }

  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .suscripcion.safic-main {
    padding: 20px 16px;
  }

  .kpis {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
