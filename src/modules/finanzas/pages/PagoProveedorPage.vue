<template>
  <q-page class="safic-main pago">
    <section class="pago__principal">
      <PaginaEncabezado miga="Finanzas / Pagos a proveedores" titulo="Registrar pago" />

      <div v-if="registrado" class="pago__exito" role="status">
        <q-icon name="sym_r_check_circle" size="22px" />
        <div class="pago__exito-texto">
          <strong>
            Pago {{ registrado.codigo }} registrado por {{ formatoMoneda(registrado.monto) }}.
          </strong>
          Quedó aplicado a {{ registrado.facturas.length }}
          {{ registrado.facturas.length === 1 ? 'factura' : 'facturas' }}.
        </div>
        <q-btn
          outline
          no-caps
          color="primary"
          label="Volver a cuentas por pagar"
          :to="{ name: 'finanzas-cuentas-por-pagar' }"
        />
      </div>

      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

      <q-form v-if="!registrado" novalidate class="safic-card pago__bloque" @submit="guardar">
        <div class="safic-campo">
          <label for="pago-prov" class="safic-campo__etiqueta">Proveedor</label>
          <q-select
            v-model="formulario.proveedorId"
            for="pago-prov"
            class="safic-input"
            outlined
            emit-value
            map-options
            hide-bottom-space
            :options="opcionesProveedor"
            :loading="proveedores.isPending.value"
            :error="!!errores.proveedorId"
            :error-message="errores.proveedorId"
            @update:model-value="alCambiarProveedor"
          />
        </div>

        <fieldset class="pago__facturas">
          <legend class="safic-campo__etiqueta">Facturas aprobadas pendientes</legend>
          <div v-if="gastos.isPending.value" aria-busy="true">
            <q-skeleton v-for="i in 2" :key="i" type="rect" height="52px" class="q-mb-sm" />
          </div>
          <label
            v-for="g in facturas"
            :key="g.id"
            class="pago__factura"
            :class="{ 'pago__factura--activa': formulario.facturas.includes(g.id) }"
          >
            <input v-model="formulario.facturas" type="checkbox" :value="g.id" @change="alElegir" />
            <span class="pago__factura-texto">
              <strong>{{ g.numero }}</strong>
              <span class="pago__sub">{{ g.descripcion ?? g.categoria ?? '' }}</span>
              <span class="pago__sub" :class="{ pago__vencida: g.vencida }">
                {{ textoVence(g)
                }}<template v-if="g.pagada_parcial">
                  · abonado {{ formatoMoneda(g.pagado) }}</template
                >
              </span>
            </span>
            <span class="pago__saldo">
              <span class="pago__sub">Saldo</span>
              {{ formatoMoneda(g.saldo) }}
            </span>
          </label>
          <div
            v-if="
              formulario.proveedorId !== null && !gastos.isPending.value && facturas.length === 0
            "
            class="pago__sub"
          >
            Este proveedor no tiene facturas aprobadas con saldo.
          </div>
          <div v-if="errores.facturas" class="pago__error" role="alert">{{ errores.facturas }}</div>
        </fieldset>

        <div class="pago__fila">
          <div class="safic-campo">
            <label for="pago-monto" class="safic-campo__etiqueta">Monto pagado (USD)</label>
            <q-input
              v-model="formulario.monto"
              for="pago-monto"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              hide-bottom-space
              :error="!!errores.monto"
              :error-message="errores.monto"
              @update:model-value="formulario.montoEditado = true"
            />
          </div>
          <div class="safic-campo">
            <label for="pago-origen" class="safic-campo__etiqueta">Pagado desde</label>
            <q-select
              v-model="formulario.cuentaBancariaId"
              for="pago-origen"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="opcionesOrigen"
              :loading="cuentas.isPending.value"
              :error="!!errores.cuentaBancariaId"
              :error-message="errores.cuentaBancariaId"
            />
          </div>
        </div>

        <div class="pago__fila">
          <div class="safic-campo">
            <label for="pago-fecha" class="safic-campo__etiqueta">Fecha de la transferencia</label>
            <q-input
              v-model="formulario.fechaPago"
              for="pago-fecha"
              class="safic-input"
              outlined
              type="date"
              :max="hoy"
              hide-bottom-space
              :error="!!errores.fechaPago"
              :error-message="errores.fechaPago"
            />
          </div>
          <div class="safic-campo">
            <label for="pago-ref" class="safic-campo__etiqueta">Referencia del banco</label>
            <q-input
              v-model="formulario.referencia"
              for="pago-ref"
              class="safic-input"
              outlined
              maxlength="40"
              hide-bottom-space
              :error="!!errores.referencia"
              :error-message="errores.referencia"
            />
          </div>
        </div>

        <div class="safic-campo">
          <label for="pago-comprobante" class="safic-campo__etiqueta">Comprobante (opcional)</label>
          <input
            id="pago-comprobante"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            @change="alElegirComprobante"
          />
          <div v-if="errorComprobante" class="pago__error" role="alert">{{ errorComprobante }}</div>
        </div>

        <div class="pago__aviso" :class="`pago__aviso--${aviso.tono}`" role="status">
          {{ aviso.texto }}
        </div>

        <div class="row justify-end" style="gap: 10px">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cancelar"
            :disable="registrar.isPending.value"
            :to="{ name: 'finanzas-cuentas-por-pagar' }"
          />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            class="safic-btn"
            label="Registrar pago"
            :loading="registrar.isPending.value"
          />
        </div>
      </q-form>
    </section>

    <aside v-if="proveedor" class="safic-card pago__lateral" aria-labelledby="pago-cuenta">
      <h2 id="pago-cuenta" class="pago__lateral-titulo">Cuenta del proveedor</h2>
      <div class="pago__sub">Úsala para transferir desde tu banca en línea.</div>
      <dl v-if="proveedor.cuenta" class="pago__cuenta">
        <dt>Banco</dt>
        <dd>{{ proveedor.cuenta.banco }}</dd>
        <dt>Tipo</dt>
        <dd>{{ etiquetaTipoCuenta(proveedor.cuenta.tipo) }}</dd>
        <dt>Número</dt>
        <dd>{{ proveedor.cuenta.numero }}</dd>
        <dt>Titular</dt>
        <dd>{{ proveedor.cuenta.titular }}</dd>
        <dt>RUC</dt>
        <dd>{{ proveedor.ruc }}</dd>
      </dl>
      <div v-else class="safic-alerta" role="alert">
        Este proveedor aún no tiene una cuenta para pagos. Regístrala en Proveedores antes de pagar.
      </div>
      <div v-if="proveedor.cambio_de_cuenta" class="pago__cambio" role="status">
        <q-icon name="sym_r_schedule" size="20px" />
        <div>
          Hay un cambio de cuenta en espera. {{ textoCambioDeCuenta(proveedor.cambio_de_cuenta) }}
          Paga a la cuenta que ves arriba.
        </div>
      </div>
      <div class="pago__sub">
        <strong>Reglas.</strong> Solo aparecen facturas aprobadas. Con proveedores se permiten
        abonos: si pagas menos del saldo, la factura queda pagada parcial. No puedes pagar más del
        saldo elegido.
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useCuentasBancarias } from '@/modules/configuracion/composables/useCuentasBancarias';
import { aCentavos, deCentavos } from '@/utils/dinero';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';

import { useGastos } from '../composables/useGastos';
import { useRegistrarPagoProveedor } from '../composables/usePagosProveedor';
import { useProveedores } from '../composables/useProveedores';
import {
  avisoDePago,
  etiquetaTipoCuenta,
  pagoProveedorVacio,
  peticionPagoProveedor,
  saldoElegido,
  textoCambioDeCuenta,
  textoVence,
  validarPagoProveedor,
  type ErroresPagoProveedor,
} from '../proveedores.logica';
import type { PagoProveedor } from '../services/pagos-proveedor.service';

const route = useRoute();
const hoy = hoyEcuador();

const proveedorInicial = Number(route.params.id) || null;
const facturaInicial = Number(route.query.factura) || null;

const formulario = reactive(pagoProveedorVacio(hoy, proveedorInicial));
const errores = reactive<ErroresPagoProveedor>({});
const errorGeneral = ref<string | null>(null);
const errorComprobante = ref<string | null>(null);
const comprobante = ref<File | null>(null);
const registrado = ref<PagoProveedor | null>(null);

const proveedores = useProveedores(ref('todos'), ref(''));
const gastos = useGastos(ref('por_pagar'), ref(''));
const cuentas = useCuentasBancarias();
const registrar = useRegistrarPagoProveedor();

const opcionesProveedor = computed(() =>
  (proveedores.data.value?.proveedores ?? []).map((p) => ({
    value: p.id,
    label: `${p.razon_social} · RUC ${p.ruc}`,
  })),
);
const proveedor = computed(
  () => proveedores.data.value?.proveedores.find((p) => p.id === formulario.proveedorId) ?? null,
);
const opcionesOrigen = computed(() =>
  (cuentas.data.value ?? [])
    .filter((c) => c.activa)
    .map((c) => ({
      value: c.id,
      label: `${c.banco} · ${etiquetaTipoCuenta(c.tipo)} •••• ${c.numero.slice(-4)}`,
    })),
);

// Las más antiguas primero: así se aplican los abonos
const facturas = computed(() =>
  (gastos.data.value?.gastos ?? []).filter(
    (g) =>
      g.proveedor.id === formulario.proveedorId &&
      g.estado === 'aprobada' &&
      aCentavos(g.saldo) > 0,
  ),
);
const saldo = computed(() => saldoElegido(facturas.value, formulario.facturas));
const aviso = computed(() => avisoDePago(saldo.value, formulario.monto));

// Mientras no escribas el monto, propone el saldo de lo elegido
watch(saldo, (s) => {
  if (!formulario.montoEditado) formulario.monto = s > 0 ? deCentavos(s) : '';
});

// La factura que llega en la dirección se marca cuando carga la lista
watch(
  facturas,
  (lista) => {
    if (
      facturaInicial !== null &&
      formulario.facturas.length === 0 &&
      lista.some((g) => g.id === facturaInicial)
    ) {
      formulario.facturas = [facturaInicial];
    }
  },
  { once: true },
);

// La cuenta de origen: si solo hay una, ya viene elegida
watch(
  opcionesOrigen,
  (o) => {
    if (formulario.cuentaBancariaId === null && o.length === 1)
      formulario.cuentaBancariaId = o[0]?.value ?? null;
  },
  { immediate: true },
);

function alCambiarProveedor(): void {
  formulario.facturas = [];
  formulario.montoEditado = false;
  formulario.monto = '';
}

function alElegir(): void {
  formulario.montoEditado = false;
  formulario.monto = saldo.value > 0 ? deCentavos(saldo.value) : '';
}

const TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'application/pdf'];

function alElegirComprobante(e: Event): void {
  errorComprobante.value = null;
  const entrada = e.target as HTMLInputElement;
  const archivo = entrada.files?.[0] ?? null;
  if (archivo && !TIPOS_COMPROBANTE.includes(archivo.type)) {
    errorComprobante.value = 'El comprobante debe ser una foto (JPG o PNG) o un PDF.';
    comprobante.value = null;
    entrada.value = '';
    return;
  }
  if (archivo && archivo.size > 5 * 1024 * 1024) {
    errorComprobante.value = 'El comprobante pesa más de 5 MB.';
    comprobante.value = null;
    return;
  }
  comprobante.value = archivo;
}

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: el pago no se registra dos veces
  if (registrar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of [
    'proveedorId',
    'facturas',
    'monto',
    'cuentaBancariaId',
    'fechaPago',
    'referencia',
  ] as const)
    errores[k] = undefined;

  const problemas = validarPagoProveedor(formulario, saldo.value, hoy);
  if (Object.keys(problemas).length > 0 || errorComprobante.value) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    registrado.value = await registrar.mutateAsync(
      peticionPagoProveedor(formulario, comprobante.value),
    );
  } catch (error) {
    const apiError = aApiError(error);
    const deCampos: ErroresPagoProveedor = {
      monto: apiError.campo('monto'),
      referencia: apiError.campo('referencia'),
      fechaPago: apiError.campo('fecha_pago'),
      cuentaBancariaId: apiError.campo('cuenta_bancaria_id'),
      facturas: apiError.campo('facturas'),
      proveedorId: apiError.campo('proveedor_id'),
    };
    Object.assign(errores, deCampos);
    // Si ningún campo trae el error, se muestra el mensaje del servidor (decide el código, no el texto)
    if (!Object.values(deCampos).some(Boolean)) {
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa los pagos antes de reintentar: el pago pudo registrarse.`
        : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.pago {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.pago__principal {
  flex: 1 1 560px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pago__bloque {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
}

.pago__exito {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-radius: 12px;
  background: #e3efec;
  color: #0b4a47;
}

.pago__exito-texto {
  flex: 1 1 260px;
}

.pago__facturas {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pago__factura {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  cursor: pointer;
}

.pago__factura--activa {
  border: 2px solid var(--q-primary);
  padding: 11px 13px;
}

.pago__factura-texto {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pago__saldo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.pago__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.pago__vencida {
  color: #9b1c12;
  font-weight: 700;
}

.pago__error {
  font-size: 12px;
  font-weight: 700;
  color: #9b1c12;
}

.pago__fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.pago__aviso {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.pago__aviso--info {
  background: #f1efe8;
  color: #3d3a33;
}

.pago__aviso--error {
  background: #fde8e6;
  color: #7f1810;
}

.pago__aviso--alerta {
  background: #fff7ec;
  color: #7a3808;
}

.pago__aviso--exito {
  background: #e3efec;
  color: #0b4a47;
}

.pago__lateral {
  flex: 0 0 340px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pago__lateral-titulo {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.pago__cuenta {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 6px 10px;
  margin: 0;
  font-size: 14px;
}

.pago__cuenta dt {
  color: var(--safic-texto-suave);
}

.pago__cuenta dd {
  margin: 0;
  font-weight: 700;
  word-break: break-all;
}

.pago__cambio {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 13px;
}
</style>
