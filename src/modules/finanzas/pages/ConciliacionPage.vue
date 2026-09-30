<template>
  <q-page class="safic-main conciliacion">
    <PaginaEncabezado
      miga="Finanzas / Conciliación bancaria"
      :titulo="`Conciliación · ${CONCILIACION_PERIODO.titulo}`"
    >
      <template #acciones>
        <button type="button" class="conciliacion__cuenta" aria-haspopup="menu">
          <div>
            <div class="conciliacion__cuenta-etiqueta">Cuenta</div>
            <div class="conciliacion__cuenta-nombre">{{ cuenta.nombre }}</div>
          </div>
          <q-icon name="sym_r_expand_more" size="18px" class="text-suave" />
          <q-menu anchor="bottom right" self="top right" class="conciliacion__menu">
            <q-list style="min-width: 260px">
              <q-item
                v-for="c in CONCILIACION_CUENTAS"
                :key="c.id"
                v-close-popup
                clickable
                :active="c.id === cuenta.id"
                active-class="text-primary text-weight-bold"
                @click="cuentaId = c.id"
              >
                <q-item-section>{{ c.nombre }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </button>
        <q-btn
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario conciliacion__subir"
          icon="sym_r_upload"
          label="Subir estado de cuenta"
          @click="archivoInput?.click()"
        />
        <input
          ref="archivoInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="hidden"
          aria-label="Estado de cuenta"
          @change="alSubir"
        />
      </template>
    </PaginaEncabezado>

    <div class="safic-card conciliacion__archivo">
      <div class="conciliacion__archivo-info">
        <div class="conciliacion__archivo-icono">
          <q-icon name="sym_r_description" size="20px" />
        </div>
        <div>
          <div class="text-weight-bold">{{ archivo.nombre }}</div>
          <div class="conciliacion__sub">
            {{ archivo.periodo }} · {{ archivo.movimientos }} movimientos ·
            {{ archivo.duplicadosDescartados }} duplicados descartados
          </div>
        </div>
      </div>
      <div>
        <div class="conciliacion__sub">Saldo inicial banco</div>
        <div class="text-weight-bolder">{{ formatoMoneda(archivo.saldoInicial) }}</div>
      </div>
      <div>
        <div class="conciliacion__sub">Saldo final banco</div>
        <div class="text-weight-bolder">{{ formatoMoneda(archivo.saldoFinal) }}</div>
      </div>
      <EstadoBadge :tono="archivo.cuadra ? 'exito' : 'error'" class="conciliacion__archivo-badge">
        {{ archivo.cuadra ? 'Archivo cuadra' : 'Archivo no cuadra' }}
      </EstadoBadge>
    </div>

    <div class="conciliacion__cuerpo">
      <section class="safic-card conciliacion__movimientos">
        <div class="conciliacion__pestanas" role="tablist" aria-label="Movimientos del banco">
          <button
            v-for="p in pestanas"
            :key="p.clave"
            type="button"
            role="tab"
            class="conciliacion__pestana"
            :class="{ 'conciliacion__pestana--activa': p.clave === pestana }"
            :aria-selected="p.clave === pestana"
            @click="pestana = p.clave"
          >
            {{ p.etiqueta }}
            <span
              class="conciliacion__conteo"
              :class="{ 'conciliacion__conteo--pendiente': p.clave !== 'auto' && p.conteo > 0 }"
            >
              {{ p.conteo }}
            </span>
          </button>
        </div>
        <div class="conciliacion__desplazable" role="tabpanel">
          <div
            v-for="m in filas"
            :key="m.id"
            class="conciliacion__fila"
            :class="{ 'conciliacion__fila--pendiente': !m.hecho }"
          >
            <div class="text-suave">{{ m.fecha }}</div>
            <div class="conciliacion__desc">
              <div class="conciliacion__mono">{{ m.descripcion }}</div>
              <div class="conciliacion__sub">Ref. {{ m.referencia }}</div>
            </div>
            <div
              class="conciliacion__monto"
              :class="m.monto < 0 ? 'conciliacion__monto--egreso' : 'conciliacion__monto--ingreso'"
            >
              {{ moneda(m.monto) }}
            </div>
            <div class="conciliacion__propuesta">{{ m.propuesta }}</div>
            <div class="conciliacion__accion">
              <q-btn
                v-if="!m.hecho"
                unelevated
                no-caps
                color="primary"
                class="conciliacion__confirmar"
                :label="m.accion"
                @click="confirmar(m.id)"
              />
              <span v-else class="conciliacion__hecho">
                <q-icon name="sym_r_check" size="16px" class="conciliacion__check" />
                {{ m.automatico ? 'Registrado solo' : m.textoHecho }}
              </span>
            </div>
          </div>
        </div>
        <div class="conciliacion__nota">{{ notaPestana }}</div>
      </section>

      <aside class="safic-card conciliacion__cuadre" aria-labelledby="conciliacion-cuadre">
        <h2 id="conciliacion-cuadre">Cuadre del mes</h2>
        <div class="conciliacion__linea">
          <span>Saldo inicial</span><span>{{ moneda(cuadre.saldoInicial) }}</span>
        </div>
        <div class="conciliacion__linea">
          <span>+ Pagos de residentes</span><span>{{ moneda(cuadre.pagosResidentes) }}</span>
        </div>
        <div class="conciliacion__linea">
          <span>+ Intereses</span><span>{{ moneda(cuadre.intereses) }}</span>
        </div>
        <div class="conciliacion__linea">
          <span>− Gastos pagados</span><span>{{ moneda(cuadre.gastosPagados) }}</span>
        </div>
        <div class="conciliacion__linea">
          <span>− Comisiones bancarias</span><span>{{ moneda(comisiones) }}</span>
        </div>
        <div class="conciliacion__linea conciliacion__linea--total conciliacion__linea--borde">
          <span>Saldo en la app</span><span>{{ moneda(saldoApp) }}</span>
        </div>
        <div class="conciliacion__linea conciliacion__linea--total">
          <span>Saldo en el banco</span><span>{{ moneda(cuadre.saldoBanco) }}</span>
        </div>
        <div
          class="conciliacion__diferencia"
          :class="{ 'conciliacion__diferencia--ok': cuadrado }"
          role="status"
        >
          <div class="conciliacion__diferencia-etiqueta">Diferencia</div>
          <div class="conciliacion__diferencia-valor">{{ moneda(diferencia) }}</div>
          <div class="conciliacion__diferencia-nota">
            {{
              cuadrado
                ? 'La app cuadra con el banco'
                : 'Pendiente de clasificar en sugeridos y sin identificar'
            }}
          </div>
        </div>
        <div class="col-grow" />
        <q-btn
          unelevated
          no-caps
          class="conciliacion__ajuste"
          label="Registrar ajuste con motivo"
          @click="ajusteAbierto = true"
        />
        <q-btn
          unelevated
          no-caps
          class="conciliacion__cerrar"
          :class="{ 'conciliacion__cerrar--bloqueado': !cuadrado || cerrado }"
          :disable="!cuadrado || cerrado"
          :label="cerrado ? `${mesCapital} cerrado` : `Cerrar ${CONCILIACION_PERIODO.mes}`"
          @click="cerrarMes"
        />
      </aside>
    </div>

    <q-dialog v-model="ajusteAbierto">
      <q-card class="safic-dialogo q-pa-lg">
        <div class="safic-dialogo__titulo q-mb-md">Registrar ajuste</div>
        <q-form class="column" style="gap: 14px" @submit.prevent="guardarAjuste">
          <label class="safic-campo">
            <span class="safic-campo__etiqueta">Monto</span>
            <q-input
              v-model.number="ajuste.monto"
              class="safic-input"
              outlined
              type="number"
              step="0.01"
              prefix="$"
              :rules="[(v: number) => (Number.isFinite(v) && v !== 0) || 'Ingresa un monto.']"
              hide-bottom-space
            />
          </label>
          <label class="safic-campo">
            <span class="safic-campo__etiqueta">Motivo</span>
            <q-input
              v-model="ajuste.motivo"
              class="safic-input"
              outlined
              autogrow
              :rules="[(v: string) => v.trim().length >= 5 || 'Explica el motivo del ajuste.']"
              hide-bottom-space
            />
          </label>
          <div class="row justify-end" style="gap: 10px">
            <q-btn
              v-close-popup
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="safic-btn"
              type="submit"
              label="Registrar"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { formatoMoneda } from '@/utils/formato';
import {
  CONCILIACION_ARCHIVO,
  CONCILIACION_CUADRE,
  CONCILIACION_CUENTAS,
  CONCILIACION_MOVIMIENTOS,
  CONCILIACION_PERIODO,
  CONCILIACION_TOTAL_AUTOMATICOS,
} from '../demo/conciliacion';
import type { PestanaConciliacion } from '../demo/conciliacion';

const $q = useQuasar();

const archivo = CONCILIACION_ARCHIVO;
const cuadre = CONCILIACION_CUADRE;

const cuentaId = ref(CONCILIACION_CUENTAS[0]?.id ?? 0);
const cuenta = computed(
  () =>
    CONCILIACION_CUENTAS.find((c) => c.id === cuentaId.value) ?? { id: 0, nombre: 'Sin cuenta' },
);
const archivoInput = ref<HTMLInputElement | null>(null);

const pestana = ref<PestanaConciliacion>('sug');
const hechos = ref<Record<string, boolean>>({});
const ajustes = ref(0);
const cerrado = ref(false);
const ajusteAbierto = ref(false);
const ajuste = reactive({ monto: 0, motivo: '' });

const mesCapital =
  CONCILIACION_PERIODO.mes.charAt(0).toUpperCase() + CONCILIACION_PERIODO.mes.slice(1);

/** "− $ 3.450,00" como en el mockup (signo separado del símbolo). */
function moneda(valor: number): string {
  return valor < 0 ? `− ${formatoMoneda(Math.abs(valor))}` : formatoMoneda(valor);
}

const centavos = (valor: number): number => Math.round(valor * 100);

function pendientes(clave: PestanaConciliacion): number {
  return CONCILIACION_MOVIMIENTOS[clave].filter((m) => !hechos.value[m.id]).length;
}

const pestanas = computed(() => [
  { clave: 'auto' as const, etiqueta: 'Automáticos', conteo: CONCILIACION_TOTAL_AUTOMATICOS },
  { clave: 'sug' as const, etiqueta: 'Sugeridos', conteo: pendientes('sug') },
  { clave: 'sin' as const, etiqueta: 'Sin identificar', conteo: pendientes('sin') },
]);

const filas = computed(() =>
  CONCILIACION_MOVIMIENTOS[pestana.value].map((m) => ({
    ...m,
    hecho: m.automatico === true || hechos.value[m.id] === true,
  })),
);

const notaPestana = computed(() =>
  pestana.value === 'auto'
    ? `Mostrando ${CONCILIACION_MOVIMIENTOS.auto.length} de ${CONCILIACION_TOTAL_AUTOMATICOS} movimientos registrados automáticamente por código de unidad, monto exacto o reglas guardadas.`
    : 'Confirma cada propuesta; al clasificar puedes guardar una regla para que el próximo mes entre automático.',
);

/** Comisiones confirmadas, en dólares (positivo = se restan del saldo). */
const comisiones = computed(() => {
  const total = [...CONCILIACION_MOVIMIENTOS.sug, ...CONCILIACION_MOVIMIENTOS.sin]
    .filter((m) => hechos.value[m.id])
    .reduce((suma, m) => suma - centavos(m.efecto ?? 0), 0);
  return total / 100;
});

const saldoApp = computed(
  () => (centavos(cuadre.saldoApp) - centavos(comisiones.value) + ajustes.value) / 100,
);
const diferencia = computed(() => (centavos(cuadre.saldoBanco) - centavos(saldoApp.value)) / 100);
const cuadrado = computed(() => diferencia.value === 0);

function confirmar(id: string): void {
  hechos.value = { ...hechos.value, [id]: true };
}

function alSubir(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  const nombre = input.files?.[0]?.name;
  if (nombre) {
    $q.notify({ type: 'positive', message: `Estado de cuenta ${nombre} recibido.` });
  }
  input.value = '';
}

function guardarAjuste(): void {
  ajustes.value += centavos(ajuste.monto);
  ajusteAbierto.value = false;
  ajuste.monto = 0;
  ajuste.motivo = '';
  $q.notify({ type: 'positive', message: 'Ajuste registrado.' });
}

function cerrarMes(): void {
  cerrado.value = true;
  $q.notify({ type: 'positive', message: `${mesCapital} quedó cerrado y conciliado.` });
}
</script>

<style scoped>
.conciliacion.safic-main {
  padding: 24px 32px;
  gap: 16px;
}

.conciliacion__cuenta {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--safic-borde-2);
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: var(--safic-texto);
}

.conciliacion__cuenta-etiqueta {
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.conciliacion__cuenta-nombre {
  font-size: 14px;
  font-weight: 700;
}

.conciliacion__subir.q-btn {
  min-height: 46px;
  padding: 0 16px;
}

.conciliacion__subir :deep(.q-icon) {
  font-size: 18px;
  margin-right: 8px;
}

.conciliacion__archivo {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px 28px;
  font-size: 14px;
  flex-wrap: wrap;
}

.conciliacion__archivo-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
  min-width: 0;
}

.conciliacion__archivo-icono {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: #e3efec;
  color: #0b4a47;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conciliacion__archivo-badge.conciliacion__archivo-badge {
  padding: 5px 10px;
}

.conciliacion__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.conciliacion__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.conciliacion__movimientos {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.conciliacion__pestanas {
  display: flex;
  gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid var(--safic-linea);
  overflow-x: auto;
}

.conciliacion__pestana {
  height: 50px;
  padding: 0 14px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--safic-texto-suave);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.conciliacion__pestana--activa {
  font-weight: 800;
  color: var(--q-primary);
  border-bottom-color: var(--q-primary);
}

.conciliacion__conteo {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e3efec;
  color: #0b4a47;
}

.conciliacion__conteo--pendiente {
  background: #fff1dc;
  color: #8a3f0a;
}

.conciliacion__desplazable {
  overflow-x: auto;
}

.conciliacion__fila {
  display: grid;
  grid-template-columns: 70px 1fr 100px 1fr 190px;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--safic-linea-2);
  font-size: 14px;
  background: #ffffff;
  min-width: 720px;
}

.conciliacion__fila--pendiente {
  background: #fffcf6;
}

.conciliacion__desc {
  min-width: 0;
}

.conciliacion__mono {
  font-weight: 700;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 13px;
}

.conciliacion__monto {
  text-align: right;
  font-weight: 800;
  white-space: nowrap;
}

.conciliacion__monto--ingreso {
  color: #0b4a47;
}

.conciliacion__monto--egreso {
  color: #9b1c12;
}

.conciliacion__propuesta {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.conciliacion__accion {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.conciliacion__confirmar.q-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
}

.conciliacion__hecho {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #0b4a47;
  text-align: right;
}

.conciliacion__check {
  font-variation-settings: 'wght' 700;
}

.conciliacion__nota {
  padding: 12px 18px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.conciliacion__cuadre {
  width: 380px;
  flex-shrink: 0;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}

.conciliacion__cuadre h2 {
  margin: 0 0 6px 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
}

.conciliacion__linea {
  display: flex;
  gap: 8px;
}

.conciliacion__linea span:first-child {
  flex-grow: 1;
  color: var(--safic-texto-2);
}

.conciliacion__linea--total {
  font-weight: 800;
}

.conciliacion__linea--total span:first-child {
  color: var(--safic-texto);
}

.conciliacion__linea--borde {
  border-top: 1px solid var(--safic-linea);
  padding-top: 10px;
}

.conciliacion__diferencia {
  margin-top: 6px;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff1dc;
  color: #8a3f0a;
}

.conciliacion__diferencia--ok {
  background: #e3efec;
  color: #0b4a47;
}

.conciliacion__diferencia-etiqueta {
  font-size: 12px;
  font-weight: 700;
}

.conciliacion__diferencia-valor {
  font-size: 26px;
  line-height: 1.35;
  font-weight: 800;
}

.conciliacion__diferencia-nota {
  font-size: 12px;
  font-weight: 600;
}

.conciliacion__ajuste.q-btn {
  min-height: 46px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
  font-weight: 700;
}

.conciliacion__cerrar.q-btn {
  min-height: 48px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  background: var(--q-primary);
  color: #ffffff;
}

.conciliacion__cerrar--bloqueado.q-btn {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.conciliacion__cerrar--bloqueado.q-btn.disabled {
  opacity: 1 !important;
}

@media (max-width: 1023px) {
  .conciliacion__cuerpo {
    flex-direction: column;
  }

  .conciliacion__cuadre {
    width: auto;
  }
}

@media (max-width: 599px) {
  .conciliacion.safic-main {
    padding: 20px 16px;
  }

  .conciliacion__cuenta {
    max-width: 100%;
  }
}
</style>
