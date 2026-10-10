<template>
  <div class="app-pagina pagar">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="pagar-barra">
      <router-link :to="{ name: 'app-mi-cuenta' }" class="pagar-barra__volver" aria-label="Volver">
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="pagar-barra__titulo">Pagar por transferencia</h1>
    </header>

    <div v-if="consulta.isPending.value" class="pagar-cuerpo" aria-busy="true">
      <q-skeleton v-for="i in 3" :key="i" type="rect" height="70px" />
    </div>
    <div v-else-if="consulta.isError.value" class="pagar-cuerpo">
      <div class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
    </div>

    <div v-else-if="!unidad || !unidad.puede_pagar" class="pagar-cuerpo">
      <div class="app-tarjeta pagar-aviso">
        {{
          unidad
            ? 'Los pagos de esta unidad los hace su responsable de pago.'
            : 'Tu cuenta aún no está ligada a una unidad. Pídele a la administración que revise tu ficha.'
        }}
      </div>
    </div>

    <template v-else-if="!enviado">
      <div class="pagar-cuerpo">
        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
        <div v-if="!cuenta" class="safic-alerta" role="alert">
          La administración aún no configuró la cuenta para transferir. Avísale para poder pagar.
        </div>
        <div v-if="libres.length === 0" class="app-tarjeta pagar-aviso">
          No tienes cuotas pendientes por pagar
          <template v-if="unidad.cuotas.length > 0">
            (las demás van en un pago en revisión)</template
          >.
        </div>

        <template v-else>
          <h2 class="pagar-paso">1. Elige qué cuotas pagas</h2>
          <div class="app-tarjeta">
            <label v-for="(cuota, i) in libres" :key="cuota.id" class="pagar-cuota">
              <input
                type="checkbox"
                class="pagar-check"
                :checked="i < cantidad"
                :disabled="enviando"
                @change="alternar(i)"
              />
              <span class="col-grow">
                <span class="pagar-cuota__mes">{{ mesCuota(cuota) }}</span>
                <span
                  class="pagar-cuota__nota"
                  :class="{ 'pagar-cuota__nota--vencida': cuota.estado === 'vencida' }"
                >
                  {{ notaCuota(cuota) }}
                </span>
              </span>
              <span class="pagar-cuota__monto">{{ formatoMoneda(cuota.saldo) }}</span>
            </label>
          </div>
          <div class="pagar-ayuda">
            Se paga desde la cuota más antigua y cada cuota completa.
            <template v-if="aFavor > 0">
              Tu saldo a favor de {{ formatoMoneda(unidad.saldo_favor) }} se descuenta del monto.
            </template>
          </div>

          <h2 class="pagar-paso">2. Transfiere exactamente</h2>
          <div v-if="cuenta" class="app-tarjeta pagar-datos">
            <div class="pagar-dato">
              <span class="pagar-dato__etiqueta">Monto</span>
              <strong class="pagar-dato__monto">{{ totalTexto }}</strong>
              <button
                type="button"
                class="pagar-copiar"
                aria-label="Copiar monto"
                @click="copiar(totalCopia, 'Monto copiado')"
              >
                <q-icon name="sym_r_content_copy" size="18px" />
              </button>
            </div>
            <div class="pagar-dato">
              <span class="pagar-dato__etiqueta">{{ cuenta.banco }} · Cta. {{ cuenta.tipo }}</span>
              <strong>{{ cuenta.numero }}</strong>
              <button
                type="button"
                class="pagar-copiar"
                aria-label="Copiar número de cuenta"
                @click="copiar(cuenta.numero, 'Número de cuenta copiado')"
              >
                <q-icon name="sym_r_content_copy" size="18px" />
              </button>
            </div>
            <div class="pagar-dato">
              <span class="pagar-dato__etiqueta">Titular</span>
              <strong>{{ cuenta.titular }}</strong>
            </div>
            <div class="pagar-dato pagar-concepto">
              <span class="pagar-concepto__etiqueta">Escribe en el concepto</span>
              <strong class="pagar-concepto__codigo">{{ unidad.concepto_transferencia }}</strong>
              <button
                type="button"
                class="pagar-copiar pagar-copiar--alerta"
                aria-label="Copiar código"
                @click="copiar(unidad.concepto_transferencia, 'Código copiado')"
              >
                <q-icon name="sym_r_content_copy" size="18px" />
              </button>
            </div>
          </div>

          <h2 class="pagar-paso">3. Sube tu comprobante</h2>
          <div class="pagar-comprobante">
            <input
              ref="archivoInput"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              class="pagar-archivo"
              tabindex="-1"
              aria-hidden="true"
              @change="elegirArchivo"
            />
            <button
              type="button"
              class="pagar-adjuntar"
              :disabled="enviando"
              @click="archivoInput?.click()"
            >
              <q-icon :name="archivo ? 'sym_r_check_circle' : 'sym_r_photo_camera'" size="18px" />
              <span class="pagar-adjuntar__texto">{{ archivo?.name ?? 'Foto o PDF' }}</span>
            </button>
            <label class="pagar-numero">
              N.º comprobante
              <input
                v-model="comprobante"
                inputmode="text"
                class="pagar-numero__input"
                maxlength="40"
                :disabled="enviando"
                :aria-invalid="!!errorNumero"
                aria-describedby="pagar-error-numero"
              />
            </label>
          </div>
          <div v-if="errorArchivo" id="pagar-error-archivo" class="pagar-error" role="alert">
            {{ errorArchivo }}
          </div>
          <div v-if="errorNumero" id="pagar-error-numero" class="pagar-error" role="alert">
            {{ errorNumero }}
          </div>
          <div
            v-if="!enviando && montoCentavos === 0 && cantidad > 0"
            class="pagar-ayuda"
            role="status"
          >
            Tu saldo a favor cubre estas cuotas: no necesitas transferir.
          </div>
          <div class="visually-hidden" aria-live="polite">
            {{ archivo ? `Archivo elegido: ${archivo.name}` : '' }}
          </div>
        </template>
      </div>

      <div class="pagar-pie">
        <button
          type="button"
          class="pagar-enviar"
          :class="{ 'pagar-enviar--listo': puedeEnviar }"
          :aria-disabled="!puedeEnviar"
          @click="enviar"
        >
          {{ enviando ? 'Enviando…' : `Enviar comprobante · ${totalTexto}` }}
        </button>
      </div>
    </template>

    <div v-else class="pagar-resultado">
      <div class="pagar-resultado__icono">
        <q-icon name="sym_r_schedule" size="34px" />
      </div>
      <h2 class="pagar-resultado__titulo">Pago en revisión</h2>
      <p class="pagar-resultado__texto">
        La administración verificará tu transferencia de <strong>{{ enviado.monto }}</strong
        >. Te avisaremos cuando se apruebe y recibirás tu recibo.
      </p>
      <div class="app-tarjeta pagar-resumen">
        <div class="pagar-resumen__fila">
          <span class="pagar-dato__etiqueta">Cuotas</span><strong>{{ enviado.meses }}</strong>
        </div>
        <div class="pagar-resumen__fila">
          <span class="pagar-dato__etiqueta">Comprobante</span
          ><strong>{{ enviado.comprobante }}</strong>
        </div>
      </div>
      <router-link :to="{ name: 'app-mi-cuenta' }" class="pagar-principal">
        Volver a Mi cuenta
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { aApiError } from '@/core/api/errors';
import { aCentavos, deCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import { useMiCuenta, usePagarMiCuenta } from '../composables/useMiCuenta';
import {
  cuotasLibres,
  errorArchivoComprobante,
  errorNumeroComprobante,
  mesCuota,
  montoATransferir,
  notaCuota,
  unidadInicial,
} from '../mi-cuenta.logica';

const $q = useQuasar();
const route = useRoute();

const consulta = useMiCuenta();
const pagar = usePagarMiCuenta();

const preferida = Number(route.query.unidad) || null;
const unidad = computed(() => unidadInicial(consulta.data.value?.unidades ?? [], preferida));
const cuenta = computed(() => consulta.data.value?.cuenta_bancaria ?? null);
const libres = computed(() => (unidad.value ? cuotasLibres(unidad.value) : []));
const aFavor = computed(() => (unidad.value ? aCentavos(unidad.value.saldo_favor) : 0));

/**
 * Se paga desde la cuota más antigua: la selección siempre es un prefijo de la lista.
 * Guardamos cuántas cuotas van marcadas (igual que el mockup).
 */
const seleccionadas = ref<number | null>(null);
const cantidad = computed(() => seleccionadas.value ?? Math.min(libres.value.length, 1));

const comprobante = ref('');
const archivo = ref<File | null>(null);
const archivoInput = useTemplateRef<HTMLInputElement>('archivoInput');
const errorNumero = ref<string | null>(null);
const errorArchivo = ref<string | null>(null);
const errorGeneral = ref<string | null>(null);
/** Candado síncrono: `isPending` se actualiza después y dos toques seguidos enviarían dos veces. */
const enviandoLocal = ref(false);
const enviando = computed(() => pagar.isPending.value || enviandoLocal.value);
const enviado = ref<{ monto: string; meses: string; comprobante: string } | null>(null);

// Si la lista de cuotas libres cambia (otra pasó a revisión), la selección vuelve al inicio
watch(
  () => libres.value.map((c) => c.id).join(','),
  () => {
    seleccionadas.value = null;
  },
);

function alternar(indice: number): void {
  seleccionadas.value = indice < cantidad.value ? indice : indice + 1;
}

const montoCentavos = computed(() =>
  montoATransferir(libres.value, cantidad.value, unidad.value?.saldo_favor ?? '0.00'),
);
const totalTexto = computed(() => formatoMoneda(deCentavos(montoCentavos.value)));
const totalCopia = computed(() => deCentavos(montoCentavos.value));
const puedeEnviar = computed(
  () => !!cuenta.value && cantidad.value > 0 && montoCentavos.value > 0 && !enviando.value,
);

function elegirArchivo(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  archivo.value = input.files?.[0] ?? null;
  errorArchivo.value = archivo.value ? errorArchivoComprobante(archivo.value) : null;
}

async function copiar(texto: string, mensaje: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(texto);
    $q.notify({ type: 'positive', message: mensaje });
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudo copiar. Cópialo a mano.' });
  }
}

function enviar(): void {
  const u = unidad.value;
  if (!u || enviando.value || !puedeEnviar.value) return;
  enviandoLocal.value = true;

  errorGeneral.value = null;
  errorNumero.value = errorNumeroComprobante(comprobante.value);
  errorArchivo.value = errorArchivoComprobante(archivo.value);
  if (errorNumero.value || errorArchivo.value || !archivo.value) {
    enviandoLocal.value = false;
    return;
  }

  const elegidas = libres.value.slice(0, cantidad.value);
  const numero = comprobante.value.trim();
  const montoPedido = montoCentavos.value;
  pagar.mutate(
    {
      unidadId: u.unidad_id,
      cuotas: elegidas.map((c) => c.id),
      numeroComprobante: numero,
      comprobante: archivo.value,
    },
    {
      onSuccess: (r) => {
        // El monto lo calcula el servidor: si no coincide con lo que se pidió transferir, se avisa
        if (aCentavos(r.monto) !== montoPedido) {
          $q.notify({
            type: 'warning',
            message: `El monto registrado (${formatoMoneda(r.monto)}) no coincide con el que viste. Revisa tu transferencia con la administración.`,
            timeout: 10000,
          });
        }
        enviado.value = {
          monto: formatoMoneda(r.monto),
          meses: elegidas.map((c) => nombreMes(c.periodo).split(' ')[0]).join(', '),
          comprobante: numero,
        };
        archivo.value = null;
        comprobante.value = '';
        seleccionadas.value = null;
      },
      onError: (error) => {
        const e = aApiError(error);
        errorNumero.value =
          e.campo('numero_comprobante') ??
          (e.codigo === 'COMPROBANTE_DUPLICADO' ? e.mensaje : null);
        errorArchivo.value = e.campo('comprobante') ?? null;
        if (!errorNumero.value && !errorArchivo.value) errorGeneral.value = e.mensaje;
        // Las cuotas pudieron cambiar (otro pago en revisión): se vuelve a elegir
        seleccionadas.value = null;
      },
      onSettled: () => {
        enviandoLocal.value = false;
      },
    },
  );
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.pagar {
  line-height: normal;
}

.pagar-barra {
  height: 60px;
  flex-shrink: 0;
  background: var(--safic-superficie);
  border-bottom: 1px solid var(--safic-borde);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.pagar-barra__volver {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto);
  border-radius: 10px;
  text-decoration: none;
}

.pagar-barra__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.pagar-cuerpo {
  flex-grow: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pagar-paso {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.pagar-cuota {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 14px;
  border-bottom: 1px solid var(--safic-linea-2);
  cursor: pointer;
}

.pagar-check {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--q-primary);
  cursor: pointer;
}

.pagar-cuota__mes {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.pagar-cuota__nota {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-texto-suave);
}

.pagar-cuota__nota--vencida {
  color: #9b1c12;
}

.pagar-cuota__monto {
  font-size: 15px;
  font-weight: 800;
}

.pagar-ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: -4px;
}

.pagar-datos {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.pagar-dato {
  display: flex;
  align-items: center;
}

.pagar-dato__etiqueta {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.pagar-dato strong {
  white-space: nowrap;
  text-align: right;
}

.pagar-dato__monto {
  font-size: 20px;
}

/* Botón de 40px como el mockup, con área táctil de 44px. */
.pagar-copiar {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--q-primary);
  border-radius: 10px;
}

.pagar-copiar::after {
  content: '';
  position: absolute;
  inset: -2px;
}

.pagar-copiar--alerta {
  color: #8a3f0a;
}

.pagar-concepto {
  background: #fff7ec;
  border-radius: 10px;
  padding: 4px 4px 4px 10px;
}

.pagar-concepto__etiqueta {
  flex-grow: 1;
  color: #8a3f0a;
  font-weight: 600;
}

.pagar-concepto__codigo {
  font-size: 16px;
  letter-spacing: 0.5px;
}

.pagar-comprobante {
  display: flex;
  gap: 10px;
}

.pagar-archivo {
  display: none;
}

.pagar-adjuntar {
  flex-grow: 1;
  min-width: 0;
  height: 50px;
  padding: 0 10px;
  border: 1.5px dashed #9fbdb8;
  border-radius: 12px;
  background: #f1f6f5;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pagar-adjuntar__texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toda la etiqueta (texto + campo) enfoca el campo: área táctil de 49px. */
.pagar-numero {
  width: 150px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.pagar-numero__input {
  height: 32px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 8px;
  padding: 0 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--safic-texto);
  background: var(--safic-superficie);
  min-width: 0;
}

.pagar-numero__input:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.pagar-pie {
  padding: 10px 16px 16px;
  flex-shrink: 0;
}

.pagar-enviar {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.pagar-enviar--listo {
  background: var(--q-primary);
  color: #ffffff;
}

.pagar-resultado {
  flex-grow: 1;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.pagar-resultado__icono {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff1dc;
  color: #8a3f0a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagar-resultado__titulo {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.pagar-resultado__texto {
  margin: 0;
  font-size: 15px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.pagar-resultado__texto strong {
  white-space: nowrap;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.pagar-error {
  font-size: 12px;
  font-weight: 600;
  color: #9b1c12;
  margin-top: -6px;
}

.pagar-aviso {
  padding: 14px;
  font-size: 14px;
  color: var(--safic-texto-2);
  line-height: 1.45;
}

.pagar-resumen {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pagar-resumen__fila {
  display: flex;
}

.pagar-principal {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.pagar-principal:hover {
  color: #ffffff;
  filter: brightness(0.92);
}

.pagar-secundario {
  height: 44px;
  border: none;
  background: transparent;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
