<template>
  <div class="app-pagina pagar">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="pagar-barra">
      <router-link :to="{ name: 'app-mi-cuenta' }" class="pagar-barra__volver" aria-label="Volver">
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="pagar-barra__titulo">Pagar por transferencia</h1>
    </header>

    <template v-if="!enviado">
      <div class="pagar-cuerpo">
        <h2 class="pagar-paso">1. Elige qué cuotas pagas</h2>
        <div class="app-tarjeta">
          <label v-for="(cuota, i) in cuotas" :key="cuota.mes" class="pagar-cuota">
            <input
              type="checkbox"
              class="pagar-check"
              :checked="i < seleccionadas"
              @change="alternar(i)"
            />
            <span class="col-grow">
              <span class="pagar-cuota__mes">{{ cuota.mes }}</span>
              <span
                class="pagar-cuota__nota"
                :class="{ 'pagar-cuota__nota--vencida': cuota.vencida }"
              >
                {{ cuota.nota }}
              </span>
            </span>
            <span class="pagar-cuota__monto">{{ formatoMoneda(cuota.monto) }}</span>
          </label>
        </div>
        <div class="pagar-ayuda">Se paga desde la cuota más antigua y cada cuota completa.</div>

        <h2 class="pagar-paso">2. Transfiere exactamente</h2>
        <div class="app-tarjeta pagar-datos">
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
            <span class="pagar-dato__etiqueta">{{ cuenta.banco }}</span>
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
            <strong class="pagar-concepto__codigo">{{ cuenta.concepto }}</strong>
            <button
              type="button"
              class="pagar-copiar pagar-copiar--alerta"
              aria-label="Copiar código"
              @click="copiar(cuenta.concepto, 'Código copiado')"
            >
              <q-icon name="sym_r_content_copy" size="18px" />
            </button>
          </div>
        </div>

        <h2 class="pagar-paso">3. Sube tu comprobante</h2>
        <div class="pagar-comprobante">
          <!-- Se elige el archivo, pero todavía no se sube: falta el endpoint de pagos. -->
          <input
            ref="archivoInput"
            type="file"
            accept="image/*,application/pdf"
            class="pagar-archivo"
            tabindex="-1"
            aria-hidden="true"
            @change="elegirArchivo"
          />
          <button type="button" class="pagar-adjuntar" @click="archivoInput?.click()">
            <q-icon :name="archivo ? 'sym_r_check_circle' : 'sym_r_photo_camera'" size="18px" />
            <span class="pagar-adjuntar__texto">{{ archivo?.name ?? 'Foto o PDF' }}</span>
          </button>
          <label class="pagar-numero">
            N.º comprobante
            <input v-model="comprobante" inputmode="numeric" class="pagar-numero__input" />
          </label>
        </div>
      </div>

      <div class="pagar-pie">
        <button
          type="button"
          class="pagar-enviar"
          :class="{ 'pagar-enviar--listo': seleccionadas > 0 }"
          :aria-disabled="seleccionadas === 0"
          @click="enviar"
        >
          Enviar comprobante · {{ totalTexto }}
        </button>
      </div>
    </template>

    <div v-else class="pagar-resultado">
      <div class="pagar-resultado__icono">
        <q-icon name="sym_r_schedule" size="34px" />
      </div>
      <h2 class="pagar-resultado__titulo">Pago en revisión</h2>
      <p class="pagar-resultado__texto">
        La administración verificará tu transferencia de <strong>{{ totalTexto }}</strong
        >. Te avisaremos cuando se apruebe y recibirás tu recibo.
      </p>
      <div class="app-tarjeta pagar-resumen">
        <div class="pagar-resumen__fila">
          <span class="pagar-dato__etiqueta">Cuotas</span><strong>{{ mesesTexto }}</strong>
        </div>
        <div class="pagar-resumen__fila">
          <span class="pagar-dato__etiqueta">Comprobante</span><strong>{{ comprobante }}</strong>
        </div>
      </div>
      <router-link :to="{ name: 'app-mi-cuenta' }" class="pagar-principal">
        Volver a Mi cuenta
      </router-link>
      <button type="button" class="pagar-secundario" @click="enviado = false">
        Ver otra vez el formulario
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, useTemplateRef } from 'vue';

import { formatoMoneda } from '@/utils/formato';

import {
  PAGAR_COMPROBANTE_INICIAL,
  PAGAR_CUENTA,
  PAGAR_CUOTAS,
  PAGAR_SELECCION_INICIAL,
} from '../demo/pagar';

const $q = useQuasar();

const cuotas = PAGAR_CUOTAS;
const cuenta = PAGAR_CUENTA;

/**
 * Se paga desde la cuota más antigua: la selección siempre es un prefijo de
 * la lista. Guardamos cuántas cuotas van marcadas (igual que el mockup).
 */
const seleccionadas = ref(PAGAR_SELECCION_INICIAL);
const comprobante = ref(PAGAR_COMPROBANTE_INICIAL);
const archivo = ref<File | null>(null);
const enviado = ref(false);
const archivoInput = useTemplateRef<HTMLInputElement>('archivoInput');

function alternar(indice: number): void {
  seleccionadas.value = indice < seleccionadas.value ? indice : indice + 1;
}

// Suma en centavos para no acumular errores de punto flotante.
const totalCentavos = computed(() =>
  cuotas
    .slice(0, seleccionadas.value)
    .reduce((suma, cuota) => suma + Math.round(Number(cuota.monto) * 100), 0),
);
const totalTexto = computed(() => formatoMoneda(totalCentavos.value / 100));
const totalCopia = computed(() => (totalCentavos.value / 100).toFixed(2));

const mesesTexto = computed(
  () =>
    cuotas
      .slice(0, seleccionadas.value)
      .map((cuota) => cuota.mes.split(' ')[0])
      .join(', ') || '—',
);

function elegirArchivo(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  archivo.value = input.files?.[0] ?? null;
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
  if (seleccionadas.value > 0) {
    enviado.value = true;
  }
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
