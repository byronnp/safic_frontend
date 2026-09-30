<template>
  <q-page class="safic-main pago">
    <section class="pago__principal">
      <PaginaEncabezado miga="Finanzas / Pagos a proveedores" titulo="Registrar pago" />

      <div v-if="registro" class="pago__exito" role="status">
        <q-icon name="sym_r_check" size="22px" class="pago__exito-icono" />
        <div class="pago__exito-texto">
          <strong>
            Pago {{ registro.numero }} registrado por {{ formatoMoneda(registro.monto) }}.
          </strong>
          {{ registro.detalle }} Se conciliará al importar el estado de cuenta de
          {{ PAGO_FORMULARIO_INICIAL.bancoConciliacion }}.
        </div>
        <q-btn
          outline
          no-caps
          color="primary"
          class="pago__otro"
          label="Registrar otro"
          @click="registrarOtro"
        />
      </div>

      <div class="safic-card pago__bloque">
        <label class="pago__campo pago__campo--proveedor">
          Proveedor
          <q-select
            v-model="proveedorId"
            class="pago__control"
            outlined
            emit-value
            map-options
            :options="opcionesProveedor"
            aria-label="Proveedor"
            @update:model-value="alCambiarProveedor"
          />
        </label>
        <div class="pago__subtitulo">Facturas aprobadas pendientes</div>
        <button
          v-for="f in proveedor.facturas"
          :key="f.id"
          type="button"
          class="pago__factura"
          :class="{ 'pago__factura--activa': seleccion.includes(f.id) }"
          role="checkbox"
          :aria-checked="seleccion.includes(f.id)"
          @click="alternar(f.id)"
        >
          <span class="pago__check">
            <q-icon v-if="seleccion.includes(f.id)" name="sym_r_check" size="16px" />
          </span>
          <div class="pago__factura-info">
            <div class="pago__factura-titulo">{{ f.factura }} · {{ f.descripcion }}</div>
            <div class="pago__factura-vence" :class="{ 'pago__factura-vence--vencida': f.vencida }">
              {{ f.vence }}
            </div>
          </div>
          <div class="text-right">
            <div class="pago__saldo-etiqueta">Saldo</div>
            <div class="pago__saldo">{{ formatoMoneda(f.saldo) }}</div>
          </div>
        </button>
        <div v-if="proveedor.facturas.length === 0" class="text-suave" style="font-size: 14px">
          Este proveedor no tiene facturas aprobadas pendientes.
        </div>
      </div>

      <div class="safic-card pago__formulario">
        <label class="pago__campo">
          Monto pagado
          <q-input
            v-model="montoTexto"
            class="pago__control pago__control--monto"
            :class="{ 'pago__control--error': !valido && totalElegido > 0 }"
            outlined
            inputmode="decimal"
            aria-label="Monto pagado"
            @update:model-value="alEditarMonto"
          />
        </label>
        <label class="pago__campo">
          Pagado desde
          <q-select
            v-model="cuentaOrigenId"
            class="pago__control"
            outlined
            emit-value
            map-options
            :options="opcionesOrigen"
            aria-label="Pagado desde"
          />
        </label>
        <label class="pago__campo">
          Fecha de la transferencia
          <q-input
            v-model="fecha"
            class="pago__control"
            outlined
            mask="##/##/####"
            placeholder="dd/mm/aaaa"
            aria-label="Fecha de la transferencia"
          />
        </label>
        <label class="pago__campo">
          Referencia del banco
          <q-input
            v-model="referencia"
            class="pago__control"
            outlined
            aria-label="Referencia del banco"
          />
        </label>
        <div class="pago__comprobante">
          <q-icon name="sym_r_upload" size="18px" color="primary" />
          <span class="pago__comprobante-nombre">
            <template v-if="comprobante">
              <strong>{{ comprobante.nombre }}</strong> · {{ comprobante.tamano }}
            </template>
            <template v-else>Adjunta el comprobante de la transferencia</template>
          </span>
          <button type="button" class="pago__cambiar" @click="archivoInput?.click()">
            {{ comprobante ? 'Cambiar' : 'Adjuntar' }}
          </button>
          <input
            ref="archivoInput"
            type="file"
            accept=".pdf,image/*"
            class="hidden"
            aria-label="Comprobante de la transferencia"
            @change="alAdjuntar"
          />
        </div>
        <div class="pago__aviso" :style="{ background: aviso.fondo, color: aviso.texto }">
          {{ aviso.mensaje }}
        </div>
      </div>

      <div class="pago__acciones">
        <q-btn
          unelevated
          no-caps
          class="pago__cancelar"
          label="Cancelar"
          :to="{ name: 'finanzas-cuentas-por-pagar' }"
        />
        <q-btn
          unelevated
          no-caps
          class="pago__registrar"
          :class="{ 'pago__registrar--bloqueado': !valido }"
          :disable="!valido"
          label="Registrar pago"
          @click="registrar"
        />
      </div>
    </section>

    <aside class="pago__lateral">
      <div class="safic-card pago__cuenta">
        <h2>Cuenta del proveedor</h2>
        <div class="pago__cuenta-ayuda">Úsala para transferir desde tu banca en línea.</div>
        <div v-for="(dato, i) in datosCuenta" :key="dato.clave" class="pago__dato">
          <div class="col-grow">
            <div class="pago__dato-clave">{{ dato.clave }}</div>
            <div class="pago__dato-valor">{{ dato.valor }}</div>
          </div>
          <button
            type="button"
            class="pago__copiar"
            :aria-label="`Copiar ${dato.clave.toLowerCase()}`"
            @click="copiar(i, dato.valor)"
          >
            {{ copiado === i ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <div class="pago__verificada">
          Cuenta verificada el {{ proveedor.cuenta.verificada }} · sin cambios pendientes
        </div>
      </div>
      <div class="pago__reglas">
        <strong>Reglas</strong><br />Solo aparecen facturas aprobadas. Con proveedores se permiten
        abonos: si pagas menos del saldo, la factura queda en <em>pagado parcial</em>. No puedes
        pagar más del saldo elegido. Si la cuenta del proveedor cambia, verás aviso y 24 h de
        espera.
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { z } from 'zod';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { formatoMoneda } from '@/utils/formato';
import {
  PAGO_CUENTAS_ORIGEN,
  PAGO_FORMULARIO_INICIAL,
  PAGO_PROVEEDORES,
} from '../demo/pago-proveedor';
import type { ProveedorPago } from '../demo/pago-proveedor';

const $q = useQuasar();
const route = useRoute();

const PROVEEDOR_VACIO: ProveedorPago = {
  id: 0,
  nombre: '',
  ruc: '',
  cuenta: { banco: '', tipo: '', numero: '', titular: '', ruc: '', verificada: '' },
  facturas: [],
};

// La ruta trae el id de la factura elegida en Cuentas por pagar.
const facturaId = Number(route.params.id);
const proveedorInicial =
  PAGO_PROVEEDORES.find((p) => p.facturas.some((f) => f.id === facturaId)) ??
  PAGO_PROVEEDORES[0] ??
  PROVEEDOR_VACIO;
const facturaInicial = proveedorInicial.facturas.some((f) => f.id === facturaId)
  ? facturaId
  : proveedorInicial.facturas[0]?.id;

const proveedorId = ref(proveedorInicial.id);
const seleccion = ref<number[]>(facturaInicial === undefined ? [] : [facturaInicial]);
const montoTexto = ref('');
const montoEditado = ref(false);
const cuentaOrigenId = ref(PAGO_CUENTAS_ORIGEN[0]?.id ?? 0);
const fecha = ref(PAGO_FORMULARIO_INICIAL.fecha);
const referencia = ref(PAGO_FORMULARIO_INICIAL.referencia);
const comprobante = ref<{ nombre: string; tamano: string } | null>({
  ...PAGO_FORMULARIO_INICIAL.comprobante,
});
const copiado = ref(-1);
const registro = ref<{ numero: string; monto: number; detalle: string } | null>(null);
const archivoInput = ref<HTMLInputElement | null>(null);

const opcionesProveedor = PAGO_PROVEEDORES.map((p, i) => ({
  value: p.id,
  // El primero muestra el RUC, como en el mockup.
  label: i === 0 ? `${p.nombre} · RUC ${p.ruc}` : p.nombre,
}));
const opcionesOrigen = PAGO_CUENTAS_ORIGEN.map((c) => ({ value: c.id, label: c.nombre }));

const proveedor = computed(
  () => PAGO_PROVEEDORES.find((p) => p.id === proveedorId.value) ?? PROVEEDOR_VACIO,
);

const datosCuenta = computed(() => {
  const c = proveedor.value.cuenta;
  return [
    { clave: 'BANCO', valor: c.banco },
    { clave: 'TIPO', valor: c.tipo },
    { clave: 'NÚMERO', valor: c.numero },
    { clave: 'TITULAR', valor: c.titular },
    { clave: 'RUC', valor: c.ruc },
  ];
});

const centavos = (valor: number): number => Math.round(valor * 100);

/** Saldo de las facturas elegidas, en dólares. */
const totalElegido = computed(
  () =>
    proveedor.value.facturas
      .filter((f) => seleccion.value.includes(f.id))
      .reduce((suma, f) => suma + centavos(f.saldo), 0) / 100,
);

/** "1.150,50" → 1150.5 (formato de Ecuador). */
function leerMonto(texto: string): number {
  const limpio = texto.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpio)) {
    return Number.NaN;
  }
  return Number(limpio.replace(/\./g, '').replace(',', '.'));
}

function montoEnTexto(valor: number): string {
  return valor.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const monto = computed(() =>
  montoEditado.value ? leerMonto(montoTexto.value) : totalElegido.value,
);

const esquema = computed(() =>
  z.object({
    facturas: z.array(z.number()).min(1, 'Elige al menos una factura.'),
    monto: z
      .number('Escribe el monto transferido.')
      .refine((v) => Number.isFinite(v) && v > 0, 'Escribe el monto transferido.')
      .refine(
        (v) => centavos(v) <= centavos(totalElegido.value),
        `El monto supera el saldo elegido (${formatoMoneda(totalElegido.value)}). Revisa la transferencia.`,
      ),
  }),
);

const validacion = computed(() =>
  esquema.value.safeParse({ facturas: seleccion.value, monto: monto.value }),
);
const valido = computed(() => validacion.value.success);

const aviso = computed(() => {
  if (!validacion.value.success) {
    const mensaje = validacion.value.error.issues[0]?.message ?? 'Revisa los datos.';
    const neutro = totalElegido.value === 0;
    return {
      mensaje,
      fondo: neutro ? '#F1EFE8' : '#FDE8E6',
      texto: neutro ? '#3D3A33' : '#7F1810',
    };
  }
  const restante = (centavos(totalElegido.value) - centavos(monto.value)) / 100;
  if (restante > 0) {
    return {
      mensaje: `Abono de ${formatoMoneda(monto.value)}: se aplica a la factura más antigua y queda un saldo de ${formatoMoneda(restante)}.`,
      fondo: '#FFF7EC',
      texto: '#7A3808',
    };
  }
  return {
    mensaje: `Pago completo de ${formatoMoneda(totalElegido.value)}. Las facturas elegidas quedan pagadas.`,
    fondo: '#E3EFEC',
    texto: '#0B4A47',
  };
});

// Mientras no se edite, el monto sigue al saldo elegido.
montoTexto.value = montoEnTexto(totalElegido.value);

function sincronizarMonto(): void {
  montoEditado.value = false;
  montoTexto.value = montoEnTexto(totalElegido.value);
}

function alternar(id: number): void {
  seleccion.value = seleccion.value.includes(id)
    ? seleccion.value.filter((x) => x !== id)
    : [...seleccion.value, id];
  registro.value = null;
  sincronizarMonto();
}

function alCambiarProveedor(): void {
  const primera = proveedor.value.facturas[0];
  seleccion.value = primera ? [primera.id] : [];
  registro.value = null;
  copiado.value = -1;
  sincronizarMonto();
}

function alEditarMonto(): void {
  montoEditado.value = true;
  registro.value = null;
}

function alAdjuntar(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  const archivo = input.files?.[0];
  if (archivo) {
    comprobante.value = {
      nombre: archivo.name,
      tamano: `${Math.max(1, Math.round(archivo.size / 1024))} KB`,
    };
  }
  input.value = '';
}

async function copiar(indice: number, valor: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(valor);
  } catch {
    // Sin permiso de portapapeles: igual se marca para no bloquear al usuario.
  }
  copiado.value = indice;
}

function registrar(): void {
  if (!valido.value) return;
  const restante = (centavos(totalElegido.value) - centavos(monto.value)) / 100;
  registro.value = {
    numero: PAGO_FORMULARIO_INICIAL.siguienteNumero,
    monto: monto.value,
    detalle:
      restante > 0
        ? `Queda un saldo de ${formatoMoneda(restante)}.`
        : 'Facturas pagadas por completo.',
  };
  $q.notify({ type: 'positive', message: 'Pago registrado.' });
}

function registrarOtro(): void {
  registro.value = null;
  seleccion.value = [];
  sincronizarMonto();
}
</script>

<style scoped>
.pago.safic-main {
  padding: 22px 32px;
  gap: 18px;
  flex-direction: row;
  align-items: flex-start;
}

.pago__principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.pago__exito {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #e3efec;
  border: 1px solid #b9d7d0;
  border-radius: 14px;
  padding: 14px 18px;
  color: #0b4a47;
}

.pago__exito-icono {
  flex-shrink: 0;
  font-variation-settings: 'wght' 700;
}

.pago__exito-texto {
  flex-grow: 1;
  font-size: 13px;
  line-height: 1.45;
}

.pago__otro.q-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  background: #ffffff;
  flex-shrink: 0;
}

.pago__bloque {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pago__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.pago__campo--proveedor {
  max-width: 420px;
}

.pago__control :deep(.q-field__control) {
  min-height: 44px;
  height: 44px;
  border-radius: 9px;
  padding: 0 12px;
  background: #ffffff;
}

.pago__control :deep(.q-field__control::before) {
  border-color: var(--safic-borde-campo);
}

.pago__control :deep(.q-field__marginal) {
  height: 44px;
}

.pago__control :deep(.q-field__native) {
  min-height: 44px;
  padding: 0;
  font-size: 15px;
  font-weight: 400;
  color: var(--safic-texto);
}

.pago__control--monto :deep(.q-field__native) {
  font-size: 16px;
  font-weight: 800;
}

.pago__control--error :deep(.q-field__control::before) {
  border: 2px solid #9b1c12;
}

.pago__subtitulo {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-2);
  margin-top: 4px;
}

.pago__factura {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde);
  background: #ffffff;
  text-align: left;
}

.pago__factura--activa {
  border: 2px solid var(--q-primary);
  background: #f2f7f6;
  padding: 11px 13px;
}

.pago__check {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #b9b3a5;
}

.pago__factura--activa .pago__check {
  background: var(--q-primary);
  border-color: var(--q-primary);
  color: #ffffff;
}

.pago__check .q-icon {
  font-variation-settings: 'wght' 700;
}

.pago__factura-info {
  flex-grow: 1;
  min-width: 0;
}

.pago__factura-titulo {
  font-size: 14px;
  font-weight: 800;
}

.pago__factura-vence {
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-texto-suave);
}

.pago__factura-vence--vencida {
  color: #9b1c12;
}

.pago__saldo-etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.pago__saldo {
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
}

.pago__formulario {
  padding: 16px 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
}

.pago__comprobante {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px dashed #b9b3a5;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--safic-texto-2);
  align-self: end;
  height: 44px;
  min-width: 0;
}

.pago__comprobante-nombre {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pago__cambiar {
  border: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--q-primary);
  font-weight: 700;
  cursor: pointer;
}

.pago__aviso {
  grid-column: span 3;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
}

.pago__acciones {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.pago__cancelar.q-btn,
.pago__registrar.q-btn {
  min-height: 48px;
  border-radius: 10px;
  font-weight: 700;
}

.pago__cancelar.q-btn {
  padding: 0 18px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
}

.pago__registrar.q-btn {
  padding: 0 22px;
  font-size: 15px;
  background: var(--q-primary);
  color: #ffffff;
}

.pago__registrar--bloqueado.q-btn {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.pago__registrar--bloqueado.q-btn.disabled {
  opacity: 1 !important;
}

.pago__lateral {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pago__cuenta {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pago__cuenta h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
}

.pago__cuenta-ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.pago__dato {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--safic-linea-2);
  padding-bottom: 8px;
}

.pago__dato-clave {
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.pago__dato-valor {
  font-size: 14px;
  font-weight: 700;
}

.pago__copiar {
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  color: var(--q-primary);
}

.pago__verificada {
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

.pago__reglas {
  background: #f1efe8;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 12px;
  color: var(--safic-texto-2);
  line-height: 1.55;
}

@media (max-width: 1023px) {
  .pago.safic-main {
    flex-direction: column;
    align-items: stretch;
  }

  .pago__lateral {
    width: auto;
  }
}

@media (max-width: 599px) {
  .pago.safic-main {
    padding: 20px 16px;
  }

  .pago__formulario {
    grid-template-columns: minmax(0, 1fr);
  }

  .pago__comprobante,
  .pago__aviso {
    grid-column: auto;
  }

  .pago__exito {
    flex-wrap: wrap;
  }
}
</style>
