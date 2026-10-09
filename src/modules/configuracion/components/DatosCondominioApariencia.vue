<template>
  <!-- Pestaña Apariencia (mockup F1Apariencia) -->
  <div class="apariencia">
    <section class="panel" aria-label="Apariencia del condominio">
      <div>
        <div class="panel__titulo">Logo</div>
        <div class="panel__ayuda">
          PNG, máx. 1 MB. Se usa en el menú, la app, recibos y correos.
        </div>
      </div>
      <div v-if="errorLogo" class="safic-alerta" role="alert">{{ errorLogo }}</div>
      <div class="logos">
        <div v-for="v in VARIANTES" :key="v.valor" class="logos__celda">
          <button
            type="button"
            class="logos__caja"
            :class="`logos__caja--${v.valor}`"
            :aria-label="`${urlLogo(v.valor) ? 'Cambiar' : 'Subir'} el logo para ${v.etiqueta.toLowerCase()}`"
            :disabled="ocupado"
            @click="elegirArchivo(v.valor)"
          >
            <img
              v-if="urlLogo(v.valor)"
              :src="urlLogo(v.valor)!"
              alt=""
              class="logo-grande logo-grande--img"
            />
            <div v-else class="logo-grande" :style="estiloAcento">{{ iniciales }}</div>
            <span class="logos__texto" :class="{ 'logos__texto--oscuro': v.valor === 'oscuro' }">
              {{ v.etiqueta }} · {{ urlLogo(v.valor) ? 'Cambiar' : 'Subir' }}
            </span>
          </button>
          <button
            v-if="urlLogo(v.valor)"
            type="button"
            class="logos__quitar"
            :disabled="ocupado"
            @click="quitarLogo(v.valor)"
          >
            Quitar
          </button>
        </div>
      </div>
      <input
        ref="entradaArchivo"
        type="file"
        accept="image/png"
        class="logos__entrada"
        tabindex="-1"
        aria-hidden="true"
        @change="archivoElegido"
      />

      <div>
        <div class="panel__titulo">Color principal</div>
        <div class="panel__ayuda">Botones, menú activo y encabezados.</div>
      </div>
      <div class="muestras" role="group" aria-label="Color principal">
        <button
          v-for="color in PALETA_PRIMARIO"
          :key="color"
          type="button"
          class="muestra"
          :class="{ 'muestra--activa': hex.toUpperCase() === color }"
          :style="{ background: color }"
          :aria-label="color"
          :aria-pressed="hex.toUpperCase() === color"
          @click="elegirPrimario(color)"
        />
      </div>
      <label class="hex">
        Hex
        <input v-model="hex" class="hex__campo" spellcheck="false" @input="guardado = false" />
      </label>
      <div class="contraste" :class="`contraste--${estadoContraste}`" role="status">
        <q-icon :name="iconoContraste" size="20px" />
        <div class="contraste__texto">{{ textoContraste }}</div>
      </div>

      <div>
        <div class="panel__titulo">
          Color de acento <span class="panel__opcional">(opcional)</span>
        </div>
        <div class="panel__ayuda">Insignias y resaltados.</div>
      </div>
      <div class="muestras" role="group" aria-label="Color de acento">
        <button
          v-for="color in PALETA_ACENTO"
          :key="color"
          type="button"
          class="muestra"
          :class="{ 'muestra--activa': acento.toUpperCase() === color }"
          :style="{ background: color }"
          :aria-label="color"
          :aria-pressed="acento.toUpperCase() === color"
          @click="elegirAcento(color)"
        />
      </div>

      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
      <div class="col-grow" />
      <div class="panel__nota">
        Los colores de estado (pagado, pendiente, vencido) no cambian para que signifiquen lo mismo
        en todos los condominios.
      </div>
      <div class="acciones">
        <button type="button" class="btn-restablecer" @click="restablecer">Restablecer</button>
        <button
          type="button"
          class="btn-guardar"
          :style="{ background: valido ? primario : '#B9B3A5' }"
          :disabled="!valido || actualizar.isPending.value"
          @click="guardar"
        >
          {{ guardado ? 'Guardado · aplicado' : 'Guardar apariencia' }}
        </button>
      </div>
    </section>

    <DatosCondominioVistaPrevia
      :colores="colores"
      :logo="iniciales"
      :logo-oscuro-url="datos.marca.logo_oscuro_url"
      :logo-claro-url="datos.marca.logo_claro_url"
      :nombre="datos.nombre"
      :nombre-completo="datos.nombre"
      :filas="FILAS_VISTA_PREVIA"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import {
  asegurarContraste,
  contraste,
  esHexValido,
  hexARgb,
  luminancia,
  rgbAHex,
} from '@/core/theme/colors';
import type { Rgb } from '@/core/theme/colors';
import { iniciales as inicialesDe } from '@/core/theme/avatar';

import {
  useActualizarDatosCondominio,
  useQuitarLogo,
  useSubirLogo,
} from '../composables/useDatosCondominio';
import {
  aparienciaDesde,
  APARIENCIA_PREDETERMINADA,
  FILAS_VISTA_PREVIA,
  motivoLogoInvalido,
  PALETA_ACENTO,
  PALETA_PRIMARIO,
  peticionApariencia,
} from '../datos-condominio.logica';
import type { DatosCondominio, VarianteLogo } from '../services/condominio.service';
import DatosCondominioVistaPrevia from './DatosCondominioVistaPrevia.vue';
import type { ColoresVistaPrevia } from './DatosCondominioVistaPrevia.vue';

const props = defineProps<{ datos: DatosCondominio }>();

const $q = useQuasar();
const actualizar = useActualizarDatosCondominio();
const subirLogo = useSubirLogo();
const quitarLogoMutacion = useQuitarLogo();

const BLANCO = '#FFFFFF';
const NEGRO: Rgb = { r: 0, g: 0, b: 0 };
const BLANCO_RGB: Rgb = { r: 255, g: 255, b: 255 };

const VARIANTES: { valor: VarianteLogo; etiqueta: string }[] = [
  { valor: 'claro', etiqueta: 'Fondo claro' },
  { valor: 'oscuro', etiqueta: 'Fondo oscuro' },
];

const inicial = aparienciaDesde(props.datos);
const hex = ref(inicial.primario);
const acento = ref(inicial.acento);
const guardado = ref(false);
const errorGeneral = ref<string | null>(null);
const errorLogo = ref<string | null>(null);

const iniciales = computed(() => inicialesDe(props.datos.nombre));
const ocupado = computed(() => subirLogo.isPending.value || quitarLogoMutacion.isPending.value);

/** Mezcla `hex` con `destino` en la proporción `k` (0 a 1). Solo para la vista previa. */
function mezclar(color: string, destino: Rgb, k: number): string {
  const c = hexARgb(color);
  return rgbAHex({
    r: c.r + (destino.r - c.r) * k,
    g: c.g + (destino.g - c.g) * k,
    b: c.b + (destino.b - c.b) * k,
  });
}

const valido = computed(() => esHexValido(hex.value));
const base = computed(() =>
  valido.value ? rgbAHex(hexARgb(hex.value)) : APARIENCIA_PREDETERMINADA.primario,
);
const primario = computed(() => asegurarContraste(base.value, BLANCO));
const ajustado = computed(() => primario.value !== base.value);

const acentoHex = computed(() =>
  esHexValido(acento.value)
    ? rgbAHex(hexARgb(acento.value))
    : APARIENCIA_PREDETERMINADA.acento.toUpperCase(),
);
const acentoTexto = computed(() => (luminancia(acentoHex.value) > 0.35 ? '#1C1B18' : BLANCO));
const estiloAcento = computed(() => ({ background: acentoHex.value, color: acentoTexto.value }));

const colores = computed<ColoresVistaPrevia>(() => ({
  primario: primario.value,
  menu: mezclar(primario.value, NEGRO, 0.62),
  menuActivo: mezclar(primario.value, NEGRO, 0.3),
  menuTexto: mezclar(primario.value, BLANCO_RGB, 0.78),
  suave: mezclar(primario.value, BLANCO_RGB, 0.88),
  acento: acentoHex.value,
  acentoTexto: acentoTexto.value,
}));

const formato = (x: number) => x.toFixed(1).replace('.', ',');

const estadoContraste = computed(() =>
  !valido.value ? 'error' : ajustado.value ? 'ajustado' : 'cumple',
);

const iconoContraste = computed(
  () =>
    ({ error: 'sym_r_error', ajustado: 'sym_r_contrast', cumple: 'sym_r_check_circle' })[
      estadoContraste.value
    ],
);

const textoContraste = computed(() => {
  if (!valido.value) {
    return 'Escribe un color hex válido, por ejemplo #1F4C9A.';
  }
  const inicialTxt = formato(contraste(base.value, BLANCO));
  if (ajustado.value) {
    const final = formato(contraste(primario.value, BLANCO));
    return `Contraste ${inicialTxt}:1 con texto blanco: poco legible. Se usará ${primario.value} (${final}:1) para botones y texto; el menú conserva tu tono.`;
  }
  return `Contraste ${inicialTxt}:1 con texto blanco: cumple WCAG AA (mínimo 4,5:1).`;
});

function elegirPrimario(color: string) {
  hex.value = color;
  guardado.value = false;
}

function elegirAcento(color: string) {
  acento.value = color;
  guardado.value = false;
}

function restablecer() {
  hex.value = APARIENCIA_PREDETERMINADA.primario;
  acento.value = APARIENCIA_PREDETERMINADA.acento;
  guardado.value = false;
}

async function guardar() {
  if (!valido.value || !esHexValido(acento.value)) {
    errorGeneral.value = 'Escribe colores hex válidos, por ejemplo #1F4C9A.';
    return;
  }
  errorGeneral.value = null;
  try {
    await actualizar.mutateAsync(peticionApariencia(hex.value, acento.value));
    guardado.value = true;
    $q.notify({ type: 'positive', message: 'Apariencia guardada.' });
  } catch (error) {
    const apiError = aApiError(error);
    errorGeneral.value =
      apiError.campo('color_primario') ?? apiError.campo('color_acento') ?? apiError.mensaje;
  }
}

// ---------- Logos ----------
const entradaArchivo = ref<HTMLInputElement | null>(null);
let varianteElegida: VarianteLogo = 'claro';

function urlLogo(variante: VarianteLogo): string | null {
  return variante === 'claro'
    ? props.datos.marca.logo_claro_url
    : props.datos.marca.logo_oscuro_url;
}

function elegirArchivo(variante: VarianteLogo): void {
  varianteElegida = variante;
  errorLogo.value = null;
  entradaArchivo.value?.click();
}

async function archivoElegido(evento: Event): Promise<void> {
  const entrada = evento.target as HTMLInputElement;
  const archivo = entrada.files?.[0];
  entrada.value = ''; // permite volver a elegir el mismo archivo
  if (!archivo) {
    return;
  }

  const motivo = motivoLogoInvalido(archivo);
  if (motivo) {
    errorLogo.value = motivo;
    return;
  }

  try {
    await subirLogo.mutateAsync({ variante: varianteElegida, archivo });
    $q.notify({ type: 'positive', message: 'Logo guardado.' });
  } catch (error) {
    const apiError = aApiError(error);
    errorLogo.value = apiError.campo('archivo') ?? apiError.mensaje;
  }
}

async function quitarLogo(variante: VarianteLogo): Promise<void> {
  errorLogo.value = null;
  try {
    await quitarLogoMutacion.mutateAsync(variante);
  } catch (error) {
    errorLogo.value = aApiError(error).mensaje;
  }
}
</script>

<style scoped>
.apariencia {
  display: flex;
  gap: 18px;
  flex-grow: 1;
  min-height: 0;
}

.panel {
  width: 420px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.panel__titulo {
  font-size: 14px;
  font-weight: 800;
}

.panel__opcional {
  font-weight: 600;
  color: var(--safic-texto-suave);
}

.panel__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.panel__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.45;
}

.logos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.logos__celda {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
}

.logos__caja {
  border-radius: 12px;
  height: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}

.logos__caja:focus-visible {
  outline: 3px solid var(--q-accent);
  outline-offset: 2px;
}

.logos__caja:disabled {
  opacity: 0.6;
  cursor: progress;
}

.logos__quitar {
  align-self: center;
  border: none;
  background: transparent;
  color: var(--safic-texto-suave);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  min-height: 24px;
}

.logos__entrada {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.logo-grande--img {
  object-fit: contain;
  background: transparent;
}

.logos__caja--claro {
  border: 1px dashed #b9b3a5;
  background: #ffffff;
}

.logos__caja--oscuro {
  border: 1px dashed #5f5b52;
  background: #1c1b18;
}

.logos__texto {
  font-size: 11px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.logos__texto--oscuro {
  color: #bdb8ac;
}

.logo-grande {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
}

.muestras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.muestra {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--safic-borde-2);
  padding: 0;
}

.muestra--activa {
  border: 3px solid #1c1b18;
  box-shadow: 0 0 0 2px #ffffff inset;
}

.hex {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.hex__campo {
  width: 120px;
  height: 38px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 10px;
  font-size: 14px;
  font-family: ui-monospace, Menlo, monospace;
  color: var(--safic-texto);
  background: #ffffff;
  box-sizing: border-box;
}

.hex__campo:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}

.contraste {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
}

.contraste__texto {
  line-height: 1.4;
}

.contraste--cumple {
  background: #e3efec;
  color: #0b4a47;
}

.contraste--ajustado {
  background: #fff7ec;
  color: #7a3808;
}

.contraste--error {
  background: #fde8e6;
  color: #7f1810;
}

.acciones {
  display: flex;
  gap: 10px;
}

.btn-restablecer {
  height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.btn-guardar {
  flex-grow: 1;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  color: #ffffff;
}

.btn-guardar:disabled {
  cursor: not-allowed;
}

@media (max-width: 1023px) {
  .apariencia {
    flex-direction: column;
  }

  .panel {
    width: 100%;
  }
}
</style>
