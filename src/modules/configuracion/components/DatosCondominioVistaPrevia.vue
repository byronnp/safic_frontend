<template>
  <!-- Vista previa web y móvil (mockup F1Apariencia): cambia de color en vivo -->
  <section class="vista" aria-label="Vista previa">
    <div class="vista__titulo">VISTA PREVIA</div>
    <div class="vista__fila">
      <div class="web">
        <div class="web__menu" :style="{ background: colores.menu }">
          <div class="web__marca">
            <img v-if="logoOscuroUrl" :src="logoOscuroUrl" alt="" class="logo logo--sm logo--img" />
            <div v-else class="logo logo--sm" :style="estiloLogo">{{ logo }}</div>
            <span class="web__nombre">{{ nombre }}</span>
          </div>
          <div class="web__item" :style="{ color: colores.menuTexto }">
            <q-icon name="sym_r_apartment" size="16px" />Unidades
          </div>
          <div class="web__item web__item--activo" :style="{ background: colores.menuActivo }">
            <q-icon name="sym_r_account_balance_wallet" size="16px" class="icono-relleno" />Finanzas
          </div>
          <div class="web__item" :style="{ color: colores.menuTexto }">
            <q-icon name="sym_r_event_available" size="16px" />Áreas comunes
          </div>
        </div>

        <div class="web__contenido">
          <div class="web__cabecera">
            <div class="web__h">Pagos por aprobar</div>
            <span class="web__insignia" :style="estiloAcento">7 nuevos</span>
            <button
              type="button"
              class="web__btn"
              tabindex="-1"
              :style="{ background: colores.primario }"
            >
              Aprobar seleccionados
            </button>
          </div>

          <div class="web__lista">
            <div v-for="fila in filas" :key="fila.texto" class="web__fila">
              <span class="web__fila-texto">{{ fila.texto }}</span>
              <span class="estado" :class="`estado--${fila.estado}`">{{ fila.etiqueta }}</span>
            </div>
          </div>

          <div class="row">
            <span
              class="web__enlace"
              :style="{ color: colores.primario, background: colores.suave }"
            >
              Ver todos los pagos
            </span>
          </div>

          <div class="col-grow" />

          <div class="recibo">
            <div class="recibo__cabecera" :style="{ background: colores.primario }">
              <img
                v-if="logoClaroUrl"
                :src="logoClaroUrl"
                alt=""
                class="logo logo--recibo logo--img"
              />
              <div v-else class="logo logo--recibo" :style="{ color: colores.primario }">
                {{ logo }}
              </div>
              <div class="col-grow">
                <div class="recibo__numero">RECIBO N.º 000482</div>
                <div class="recibo__condominio">{{ nombreCompleto }}</div>
              </div>
              <div class="recibo__monto">$ 80,00</div>
            </div>
            <div class="recibo__nota">Recibo PDF y correos usan el mismo logo y color.</div>
          </div>
        </div>
      </div>

      <div class="movil" aria-hidden="true">
        <div class="movil__pantalla">
          <div class="movil__cabecera" :style="{ background: colores.primario }">
            <div class="movil__saludo">Hola, Diego</div>
            <div class="movil__titulo">Mi hogar · A-102</div>
          </div>
          <div class="movil__cuerpo">
            <div class="movil__tarjeta">
              <div class="movil__etiqueta">Saldo pendiente</div>
              <div class="movil__saldo">$ 0,00</div>
              <span class="movil__al-dia">Al día</span>
            </div>
            <button
              type="button"
              class="movil__btn"
              tabindex="-1"
              :style="{ background: colores.primario }"
            >
              Reservar un área
            </button>
            <div class="movil__tarjeta movil__avisos">
              <span class="movil__punto" :style="{ background: colores.acento }" /> 2 avisos nuevos
            </div>
          </div>
          <div class="col-grow" />
          <div class="movil__pestanas">
            <q-icon
              name="sym_r_home"
              size="20px"
              class="icono-relleno"
              :style="{ color: colores.primario }"
            />
            <q-icon name="sym_r_payments" size="20px" class="movil__tab" />
            <q-icon name="sym_r_event" size="20px" class="movil__tab" />
            <q-icon name="sym_r_person" size="20px" class="movil__tab" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type EstadoVistaPrevia = 'pagado' | 'pendiente' | 'vencido';

export interface FilaVistaPrevia {
  texto: string;
  estado: EstadoVistaPrevia;
  etiqueta: string;
}

export interface ColoresVistaPrevia {
  /** Primario ya ajustado al contraste mínimo. */
  primario: string;
  menu: string;
  menuActivo: string;
  menuTexto: string;
  suave: string;
  acento: string;
  acentoTexto: string;
}

const props = defineProps<{
  colores: ColoresVistaPrevia;
  /** Iniciales que se muestran cuando el condominio no subió logo. */
  logo: string;
  /** Logo para el menú (fondo oscuro) y para el recibo (fondo claro); null = iniciales. */
  logoOscuroUrl?: string | null;
  logoClaroUrl?: string | null;
  nombre: string;
  nombreCompleto: string;
  filas: FilaVistaPrevia[];
}>();

const estiloAcento = computed(() => ({
  background: props.colores.acento,
  color: props.colores.acentoTexto,
}));
const estiloLogo = estiloAcento;
</script>

<style scoped>
.vista {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.vista__titulo {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.vista__fila {
  display: flex;
  gap: 14px;
  flex-grow: 1;
  min-height: 0;
}

.icono-relleno {
  font-variation-settings:
    'FILL' 1,
    'wght' 500;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.logo--img {
  object-fit: contain;
  background: transparent;
}

.logo--sm {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 10px;
}

.logo--recibo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #ffffff;
  font-size: 11px;
}

/* ---------- Web ---------- */

.web {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  min-width: 0;
}

.web__menu {
  width: 170px;
  flex-shrink: 0;
  color: #ffffff;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.web__marca {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px 12px 6px;
}

.web__nombre {
  font-size: 12px;
  font-weight: 800;
}

.web__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
}

.web__item--activo {
  font-weight: 700;
  color: #ffffff;
}

.web__contenido {
  flex-grow: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.web__cabecera {
  display: flex;
  align-items: center;
  gap: 8px;
}

.web__h {
  font-size: 16px;
  font-weight: 800;
  flex-grow: 1;
}

.web__insignia {
  white-space: nowrap;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.web__btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  font-family: inherit;
  cursor: default;
}

.web__lista {
  border: 1px solid var(--safic-linea);
  border-radius: 10px;
  overflow: hidden;
  font-size: 12px;
}

.web__fila {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--safic-linea-2);
}

.web__fila:last-child {
  border-bottom: none;
}

.web__fila-texto {
  flex-grow: 1;
  font-weight: 700;
  min-width: 0;
}

.estado {
  padding: 3px 9px;
  border-radius: 999px;
  font-weight: 700;
}

.estado--pagado {
  background: #e3efec;
  color: #0b4a47;
}

.estado--pendiente {
  background: #fff1dc;
  color: #8a3f0a;
}

.estado--vencido {
  background: #fde8e6;
  color: #9b1c12;
}

.web__enlace {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
}

.recibo {
  border: 1px solid var(--safic-linea);
  border-radius: 10px;
  overflow: hidden;
}

.recibo__cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #ffffff;
}

.recibo__numero {
  font-size: 12px;
  font-weight: 800;
}

.recibo__condominio {
  font-size: 10px;
  opacity: 0.85;
}

.recibo__monto {
  white-space: nowrap;
  font-size: 14px;
  font-weight: 800;
}

.recibo__nota {
  padding: 8px 12px;
  font-size: 11px;
  color: var(--safic-texto-suave);
}

/* ---------- Móvil ---------- */

.movil {
  width: 220px;
  flex-shrink: 0;
  background: #1c1b18;
  border-radius: 30px;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
}

.movil__pantalla {
  flex-grow: 1;
  background: var(--safic-fondo);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.movil__cabecera {
  padding: 18px 14px 14px 14px;
  color: #ffffff;
}

.movil__saludo {
  font-size: 10px;
  opacity: 0.8;
  font-weight: 700;
}

.movil__titulo {
  font-size: 15px;
  font-weight: 800;
}

.movil__cuerpo {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.movil__tarjeta {
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid var(--safic-borde);
}

.movil__etiqueta {
  font-size: 10px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.movil__saldo {
  font-size: 20px;
  font-weight: 800;
}

.movil__al-dia {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 10px;
  font-weight: 700;
}

.movil__btn {
  height: 38px;
  border-radius: 10px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  font-family: inherit;
  cursor: default;
}

.movil__avisos {
  font-size: 11px;
}

.movil__punto {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.movil__pestanas {
  display: flex;
  justify-content: space-around;
  padding: 8px 0 12px 0;
  border-top: 1px solid var(--safic-borde);
  background: #ffffff;
}

.movil__tab {
  color: #8a857a;
}

@media (max-width: 1100px) {
  .vista__fila {
    flex-direction: column;
  }

  .movil {
    align-self: center;
    min-height: 460px;
  }
}

@media (max-width: 599px) {
  .web {
    flex-direction: column;
  }

  .web__menu {
    width: 100%;
  }

  .web__cabecera {
    flex-wrap: wrap;
  }
}
</style>
