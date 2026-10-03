<template>
  <q-page class="safic-main asistente">
    <PaginaEncabezado miga="Condominios / Nuevo" titulo="Nuevo condominio" />

    <NuevoCondominioPasos :pasos="PASOS_NUEVO_CONDOMINIO" :actual="paso" @ir="irA" />

    <section class="asistente__panel" :aria-label="PASOS_NUEVO_CONDOMINIO[paso - 1]?.titulo">
      <!-- Catálogos de la API: cargando / error -->
      <div v-if="cargandoCatalogos" class="asistente__estado" aria-busy="true">
        <q-spinner color="primary" size="28px" />
        <span>Cargando planes y catálogos…</span>
      </div>
      <div v-else-if="errorCatalogos" class="asistente__estado" role="alert">
        <q-icon name="sym_r_error" size="24px" color="negative" />
        <span>{{ errorCatalogos }}</span>
        <q-btn
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          :icon="ICONOS.refrescar"
          label="Reintentar"
          @click="recargarCatalogos"
        />
      </div>

      <!-- Paso 1 · Datos generales -->
      <div v-else-if="paso === 1" class="asistente__grilla asistente__grilla--tres">
        <NuevoCondominioCampo
          etiqueta="Nombre del condominio"
          :error="err('nombre')"
          class="span-2"
        >
          <input v-model="f.nombre" class="control" :class="{ 'control--error': err('nombre') }" />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Tipo">
          <select v-model="f.tipo" class="control control--select">
            <option v-for="t in tipos" :key="t.valor" :value="t.valor">{{ t.etiqueta }}</option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="RUC" :error="err('ruc')">
          <input
            v-model="f.ruc"
            class="control"
            :class="{ 'control--error': err('ruc') }"
            inputmode="numeric"
            maxlength="13"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Razón social" :error="err('razonSocial')" class="span-2">
          <input
            v-model="f.razonSocial"
            class="control"
            :class="{ 'control--error': err('razonSocial') }"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Provincia">
          <select v-model="f.provincia" class="control control--select" @change="cambiarProvincia">
            <option v-for="p in provincias" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }}
            </option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Cantón" :error="err('canton')">
          <select
            v-model="f.canton"
            class="control control--select"
            :class="{ 'control--error': err('canton') }"
            :disabled="!cantones.length"
            @change="cambiarCanton"
          >
            <option v-if="!cantones.length" value="">Sin cantones cargados</option>
            <option v-for="c in cantones" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Parroquia" :error="err('parroquia')">
          <select
            v-model="f.parroquia"
            class="control control--select"
            :class="{ 'control--error': err('parroquia') }"
            :disabled="!parroquias.length"
          >
            <option v-if="!parroquias.length" value="">Sin parroquias cargadas</option>
            <option v-for="p in parroquias" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }}
            </option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Dirección" :error="err('direccion')" class="span-2">
          <input
            v-model="f.direccion"
            class="control"
            :class="{ 'control--error': err('direccion') }"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo
          etiqueta="Teléfono / correo de administración"
          :error="err('contacto')"
        >
          <input
            v-model="f.contacto"
            class="control"
            :class="{ 'control--error': err('contacto') }"
          />
        </NuevoCondominioCampo>

        <div class="asistente__separador span-3">CONTRATO CON LA PLATAFORMA</div>

        <NuevoCondominioCampo etiqueta="Total de unidades" :error="err('unidades')">
          <input
            type="number"
            min="1"
            step="1"
            class="control control--destacado"
            :class="{ 'control--error': err('unidades') }"
            :value="f.unidades ?? ''"
            @input="f.unidades = numero($event)"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Plan">
          <select v-model="f.plan" class="control control--select">
            <option v-for="p in planes" :key="p.clave" :value="p.clave">
              {{ p.nombre }} · hasta {{ p.max_administrativos }} administrativos
            </option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Valor por unidad (USD)" :error="err('valorUnidad')">
          <input
            type="number"
            min="0"
            step="0.01"
            class="control control--destacado"
            :class="{ 'control--error': err('valorUnidad') }"
            :value="f.valorUnidad ?? ''"
            @input="f.valorUnidad = numero($event)"
          />
        </NuevoCondominioCampo>

        <div class="asistente__mensualidad span-3">
          <div class="asistente__mensualidad-texto">
            Mensualidad: <strong>{{ unidades }} unidades × $ {{ valorTxt }}</strong> =
            <strong class="asistente__mensualidad-total">{{ totalTxt }}</strong> + IVA · Límite de
            registro: {{ unidades }} unidades
          </div>
          <span class="asistente__prueba">Prueba 30 días</span>
        </div>
      </div>

      <!-- Paso 2 · Ubicación -->
      <div v-else-if="paso === 2" class="asistente__ubicacion">
        <NuevoCondominioMapa :x="pin.x" :y="pin.y" @mover="moverPin" />
        <div class="asistente__ubicacion-campos">
          <NuevoCondominioCampo etiqueta="Buscar dirección">
            <input v-model="f.buscarDireccion" class="control" />
          </NuevoCondominioCampo>
          <NuevoCondominioCampo etiqueta="Latitud" :error="err('latitud')">
            <input
              v-model="f.latitud"
              class="control"
              :class="{ 'control--error': err('latitud') }"
              inputmode="decimal"
            />
          </NuevoCondominioCampo>
          <NuevoCondominioCampo etiqueta="Longitud" :error="err('longitud')">
            <input
              v-model="f.longitud"
              class="control"
              :class="{ 'control--error': err('longitud') }"
              inputmode="decimal"
            />
          </NuevoCondominioCampo>
          <div class="asistente__nota">
            Se usa para el enlace "Cómo llegar" que reciben las visitas y para el mapa de
            condominios.
          </div>
        </div>
      </div>

      <!-- Paso 3 · Amenidades -->
      <div v-else-if="paso === 3">
        <div class="asistente__intro">
          Elige las amenidades del condominio. Las reservables pasan a la agenda de áreas comunes;
          las esenciales nunca se restringen por mora.
        </div>
        <div class="asistente__amenidades">
          <div
            v-for="a in catalogoAmenidades"
            :key="a.clave"
            class="amenidad"
            :class="{ 'amenidad--activa': amenidades.has(a.clave) }"
          >
            <label class="amenidad__etiqueta">
              <input
                type="checkbox"
                class="amenidad__check"
                :checked="amenidades.has(a.clave)"
                @change="alternarAmenidad(a.clave)"
              />
              <span>
                <span class="amenidad__nombre">{{ a.nombre }}</span>
                <span class="amenidad__meta">{{ metaAmenidad(a) }}</span>
              </span>
            </label>
            <q-icon :name="a.icono" size="20px" class="amenidad__icono" />
          </div>
        </div>
      </div>

      <!-- Paso 4 · Administrador -->
      <div v-else class="asistente__grilla asistente__grilla--dos">
        <NuevoCondominioCampo etiqueta="Cédula" :error="err('cedula')">
          <input
            v-model="f.cedula"
            class="control"
            :class="{ 'control--error': err('cedula') }"
            inputmode="numeric"
            maxlength="10"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Nombres y apellidos" :error="err('nombreAdmin')">
          <input
            v-model="f.nombreAdmin"
            class="control"
            :class="{ 'control--error': err('nombreAdmin') }"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Correo" :error="err('correo')">
          <input
            v-model="f.correo"
            type="email"
            class="control"
            :class="{ 'control--error': err('correo') }"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Celular" :error="err('celular')">
          <input
            v-model="f.celular"
            type="tel"
            class="control"
            :class="{ 'control--error': err('celular') }"
          />
        </NuevoCondominioCampo>

        <div v-if="cuentaExistente" class="asistente__aviso span-2">
          <strong>Esta persona ya tiene cuenta</strong> (administra {{ cuentaExistente }}). Se le
          agregará {{ nombreCorto }} como condominio secundario; no se enviará invitación de
          registro.
        </div>
        <div v-else class="asistente__aviso asistente__aviso--neutro span-2">
          <strong>Persona nueva en SAFIC.</strong> Al crear el condominio se enviará una invitación
          de registro a {{ f.correo || 'su correo' }}.
        </div>

        <div class="asistente__resumen span-2">
          <div>
            <div class="asistente__resumen-etiqueta">Unidades</div>
            <div class="asistente__resumen-valor">{{ unidades }}</div>
          </div>
          <div>
            <div class="asistente__resumen-etiqueta">Plan</div>
            <div class="asistente__resumen-valor">{{ planTxt }}</div>
          </div>
          <div>
            <div class="asistente__resumen-etiqueta">Mensualidad</div>
            <div class="asistente__resumen-valor">{{ totalTxt }} + IVA</div>
          </div>
          <div>
            <div class="asistente__resumen-etiqueta">Amenidades</div>
            <div class="asistente__resumen-valor">{{ amenidades.size }}</div>
          </div>
        </div>
      </div>
    </section>

    <div class="asistente__pie">
      <button
        type="button"
        class="asistente__boton asistente__boton--secundario"
        :class="{ 'asistente__boton--oculto': paso === 1 }"
        :tabindex="paso === 1 ? -1 : 0"
        :aria-hidden="paso === 1"
        @click="anterior"
      >
        Anterior
      </button>
      <div
        class="asistente__pie-texto"
        :class="{ 'asistente__pie-texto--error': hayErrores }"
        aria-live="polite"
      >
        <template v-if="hayErrores">Revisa los campos marcados en rojo para continuar.</template>
        <template v-else>
          Nada se guarda hasta el último paso; si algo falla, no queda un condominio a medias.
        </template>
      </div>
      <button type="button" class="asistente__boton" @click="siguiente">
        {{ paso === 4 ? 'Crear condominio y enviar acceso' : 'Siguiente' }}
      </button>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { ICONOS } from '@/core/navigation/icons';
import NuevoCondominioCampo from '@/modules/plataforma/components/NuevoCondominioCampo.vue';
import NuevoCondominioMapa from '@/modules/plataforma/components/NuevoCondominioMapa.vue';
import NuevoCondominioPasos from '@/modules/plataforma/components/NuevoCondominioPasos.vue';
import {
  useCatalogos,
  usePlanes,
  useUbicaciones,
} from '@/modules/plataforma/composables/useCatalogosAlta';
import {
  AMENIDADES_INICIALES,
  CUENTAS_EXISTENTES,
  FORMULARIO_INICIAL,
  PASOS_NUEVO_CONDOMINIO,
} from '@/modules/plataforma/demo/nuevo-condominio';
import type { FormularioNuevoCondominio } from '@/modules/plataforma/demo/nuevo-condominio';
import type { AmenidadCatalogo } from '@/modules/plataforma/services/catalogos.service';
import { formatoMoneda } from '@/utils/formato';

type Campo = keyof FormularioNuevoCondominio;

const $q = useQuasar();
const router = useRouter();

const paso = ref(1);
const f = reactive<FormularioNuevoCondominio>({ ...FORMULARIO_INICIAL });
const amenidades = ref(new Set<string>(AMENIDADES_INICIALES));
/** Pasos en los que ya se intentó avanzar: desde ahí los errores se muestran en vivo. */
const intentados = ref(new Set<number>());

// ---------- Catálogos de la API ----------
const consultaPlanes = usePlanes();
const consultaCatalogos = useCatalogos();
const consultaUbicaciones = useUbicaciones();

const planes = computed(() => consultaPlanes.data.value ?? []);
const tipos = computed(() => consultaCatalogos.data.value?.tipos_condominio ?? []);
const catalogoAmenidades = computed(() => consultaCatalogos.data.value?.amenidades ?? []);

const cargandoCatalogos = computed(
  () =>
    consultaPlanes.isLoading.value ||
    consultaCatalogos.isLoading.value ||
    consultaUbicaciones.isLoading.value,
);
const errorCatalogos = computed(
  () =>
    (consultaPlanes.error.value ?? consultaCatalogos.error.value ?? consultaUbicaciones.error.value)
      ?.mensaje,
);

function recargarCatalogos(): void {
  void consultaPlanes.refetch();
  void consultaCatalogos.refetch();
  void consultaUbicaciones.refetch();
}

// ---------- Ubicación en cascada (códigos INEC) ----------
const provincias = computed(() => consultaUbicaciones.data.value ?? []);
const cantones = computed(
  () => provincias.value.find((p) => p.codigo === f.provincia)?.cantones ?? [],
);
const parroquias = computed(
  () => cantones.value.find((c) => c.codigo === f.canton)?.parroquias ?? [],
);

function cambiarProvincia(): void {
  f.canton = cantones.value[0]?.codigo ?? '';
  cambiarCanton();
}

function cambiarCanton(): void {
  f.parroquia = parroquias.value[0]?.codigo ?? '';
}

// Al llegar las ubicaciones, completa cantón y parroquia si no son de la provincia.
watch(provincias, () => {
  if (!cantones.value.some((c) => c.codigo === f.canton)) {
    cambiarProvincia();
  }
});

// ---------- Contrato ----------
function numero(evento: Event): number | null {
  const texto = (evento.target as HTMLInputElement).value;
  return texto === '' ? null : Number(texto);
}

const unidades = computed(() => f.unidades ?? 0);
const valor = computed(() => f.valorUnidad ?? 0);
const valorTxt = computed(() => valor.value.toFixed(2).replace('.', ','));
const totalTxt = computed(() => formatoMoneda(unidades.value * valor.value));
const planTxt = computed(() => planes.value.find((p) => p.clave === f.plan)?.nombre ?? '—');

// ---------- Mapa: el pin y las coordenadas son el mismo dato ----------
const ORIGEN = { x: 455, y: 170, lat: -0.285412, lng: -78.471236 };
const GRADOS_POR_UNIDAD = 0.00002;

const pin = computed(() => {
  const lat = Number(f.latitud);
  const lng = Number(f.longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { x: ORIGEN.x, y: ORIGEN.y };
  }
  return {
    x: Math.min(770, Math.max(30, ORIGEN.x + (lng - ORIGEN.lng) / GRADOS_POR_UNIDAD)),
    y: Math.min(430, Math.max(44, ORIGEN.y - (lat - ORIGEN.lat) / GRADOS_POR_UNIDAD)),
  };
});

function moverPin(x: number, y: number): void {
  f.latitud = (ORIGEN.lat - (y - ORIGEN.y) * GRADOS_POR_UNIDAD).toFixed(6);
  f.longitud = (ORIGEN.lng + (x - ORIGEN.x) * GRADOS_POR_UNIDAD).toFixed(6);
}

// ---------- Amenidades ----------
function alternarAmenidad(clave: string): void {
  const nuevo = new Set(amenidades.value);
  if (nuevo.has(clave)) {
    nuevo.delete(clave);
  } else {
    nuevo.add(clave);
  }
  amenidades.value = nuevo;
}

function metaAmenidad(a: AmenidadCatalogo): string {
  if (a.esencial) {
    return 'Esencial · nunca se restringe';
  }
  return a.reservable ? 'Reservable' : 'Acceso libre';
}

// ---------- Administrador ----------
const cuentaExistente = computed(() => CUENTAS_EXISTENTES[f.cedula.trim()]);
const nombreCorto = computed(() => f.nombre.replace(/^(Conjunto|Edificio|Urbanización)\s+/i, ''));

// ---------- Validación por paso ----------
const CAMPOS_POR_PASO: Record<number, Campo[]> = {
  1: [
    'nombre',
    'ruc',
    'razonSocial',
    'canton',
    'parroquia',
    'direccion',
    'contacto',
    'unidades',
    'valorUnidad',
  ],
  2: ['latitud', 'longitud'],
  3: [],
  4: ['cedula', 'nombreAdmin', 'correo', 'celular'],
};

function validar(campo: Campo): string | undefined {
  const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  switch (campo) {
    case 'nombre':
      return texto(f.nombre) ? undefined : 'Escribe el nombre del condominio.';
    case 'ruc':
      return /^\d{10}001$/.test(texto(f.ruc))
        ? undefined
        : 'El RUC tiene 13 dígitos y termina en 001.';
    case 'razonSocial':
      return texto(f.razonSocial) ? undefined : 'Escribe la razón social.';
    case 'canton':
      return !cantones.value.length || f.canton ? undefined : 'Elige el cantón.';
    case 'parroquia':
      return !parroquias.value.length || f.parroquia ? undefined : 'Elige la parroquia.';
    case 'direccion':
      return texto(f.direccion) ? undefined : 'Escribe la dirección.';
    case 'contacto':
      return texto(f.contacto) ? undefined : 'Escribe un teléfono o correo de contacto.';
    case 'unidades':
      return f.unidades !== null && Number.isInteger(f.unidades) && f.unidades > 0
        ? undefined
        : 'Indica cuántas unidades tiene (número entero mayor a 0).';
    case 'valorUnidad':
      return f.valorUnidad !== null && f.valorUnidad > 0
        ? undefined
        : 'El valor por unidad debe ser mayor a 0.';
    case 'latitud': {
      const n = Number(f.latitud);
      return texto(f.latitud) && n >= -5.1 && n <= 1.7
        ? undefined
        : 'Latitud no válida para Ecuador.';
    }
    case 'longitud': {
      const n = Number(f.longitud);
      return texto(f.longitud) && n >= -92.1 && n <= -75.1
        ? undefined
        : 'Longitud no válida para Ecuador.';
    }
    case 'cedula':
      return /^\d{10}$/.test(texto(f.cedula)) ? undefined : 'La cédula tiene 10 dígitos.';
    case 'nombreAdmin':
      return texto(f.nombreAdmin) ? undefined : 'Escribe los nombres y apellidos.';
    case 'correo':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(f.correo))
        ? undefined
        : 'Escribe un correo válido.';
    case 'celular':
      return /^09\d{8}$/.test(texto(f.celular).replace(/\s/g, ''))
        ? undefined
        : 'El celular tiene 10 dígitos y empieza con 09.';
    default:
      return undefined;
  }
}

function pasoValido(n: number): boolean {
  return (CAMPOS_POR_PASO[n] ?? []).every((c) => !validar(c));
}

function err(campo: Campo): string | undefined {
  const pasoDelCampo = Number(
    Object.keys(CAMPOS_POR_PASO).find((k) => CAMPOS_POR_PASO[Number(k)]?.includes(campo)),
  );
  return intentados.value.has(pasoDelCampo) ? validar(campo) : undefined;
}

const hayErrores = computed(() => intentados.value.has(paso.value) && !pasoValido(paso.value));

function marcarIntentado(n: number): void {
  intentados.value = new Set(intentados.value).add(n);
}

// ---------- Navegación ----------
function irA(destino: number): void {
  if (destino <= paso.value) {
    paso.value = destino;
    return;
  }
  // Para adelantar hay que pasar la validación de cada paso intermedio.
  while (paso.value < destino) {
    if (!pasoValido(paso.value)) {
      marcarIntentado(paso.value);
      return;
    }
    paso.value += 1;
  }
}

function anterior(): void {
  if (paso.value > 1) {
    paso.value -= 1;
  }
}

function siguiente(): void {
  if (paso.value < 4) {
    irA(paso.value + 1);
    return;
  }
  const invalido = [1, 2, 3, 4].find((n) => !pasoValido(n));
  if (invalido) {
    marcarIntentado(invalido);
    paso.value = invalido;
    return;
  }
  $q.notify({
    type: 'positive',
    message: cuentaExistente.value
      ? `${f.nombre} creado. ${f.nombreAdmin} ya puede administrarlo con su cuenta.`
      : `${f.nombre} creado. Enviamos la invitación a ${f.correo}.`,
  });
  void router.push({ name: 'plataforma-condominios' });
}
</script>

<style scoped>
.asistente__estado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 160px;
  justify-content: center;
  color: var(--safic-texto-suave);
  font-size: 14px;
}

.amenidad__icono {
  color: var(--safic-texto-suave);
}

.asistente.safic-main {
  padding: 28px 40px;
  gap: 18px;
}

.asistente__panel {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 24px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.asistente__panel > * {
  flex-grow: 1;
}

.asistente__grilla {
  display: grid;
  gap: 16px 20px;
  align-content: start;
}

.asistente__grilla--tres {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.asistente__grilla--dos {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 820px;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

/* Controles nativos, iguales al mockup (44px, borde #CFCBBF, radio 9) */
.control {
  height: 44px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  font-weight: 400;
  color: var(--safic-texto);
  background: #ffffff;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.control:focus {
  outline: 2px solid color-mix(in srgb, var(--q-primary) 35%, transparent);
  outline-offset: 1px;
  border-color: var(--q-primary);
}

.control--select {
  padding: 0 10px;
}

.control--destacado {
  border: 2px solid var(--q-primary);
  font-size: 16px;
  font-weight: 800;
}

.control.control--error {
  border: 2px solid #9b1c12;
  background: #fffafa;
}

.asistente__separador {
  border-top: 1px solid var(--safic-linea);
  padding-top: 16px;
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.asistente__mensualidad {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f1f6f5;
  border-radius: 12px;
  padding: 14px 16px;
}

.asistente__mensualidad-texto {
  flex-grow: 1;
  font-size: 14px;
  color: #0b4a47;
}

.asistente__mensualidad-total {
  font-size: 18px;
}

.asistente__prueba {
  padding: 5px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #0b4a47;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.asistente__ubicacion {
  display: flex;
  gap: 20px;
}

.asistente__ubicacion-campos {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.asistente__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.asistente__intro {
  font-size: 14px;
  color: var(--safic-texto-suave);
  margin-bottom: 14px;
}

.asistente__amenidades {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.amenidad {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--safic-borde);
  background: #ffffff;
}

.amenidad--activa {
  border: 2px solid var(--q-primary);
  background: #f1f6f5;
  padding: 9px 13px;
}

.amenidad__etiqueta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
  cursor: pointer;
  min-height: 44px;
}

.amenidad__check {
  width: 18px;
  height: 18px;
  accent-color: var(--q-primary);
  flex-shrink: 0;
  margin: 0;
}

.amenidad__nombre {
  display: block;
  font-size: 14px;
  font-weight: 800;
}

.amenidad__meta {
  display: block;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.amenidad__cantidad {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-2);
}

.asistente__aviso {
  background: #e6ecf7;
  color: #23407a;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.5;
}

.asistente__aviso--neutro {
  background: #f1efe8;
  color: #3d3a33;
}

.asistente__resumen {
  border-top: 1px solid var(--safic-linea);
  padding-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  font-size: 13px;
}

.asistente__resumen-etiqueta {
  color: var(--safic-texto-suave);
}

.asistente__resumen-valor {
  font-size: 18px;
  font-weight: 800;
}

.asistente__pie {
  display: flex;
  gap: 12px;
  align-items: center;
}

.asistente__pie-texto {
  flex-grow: 1;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.asistente__pie-texto--error {
  color: #9b1c12;
  font-weight: 700;
}

.asistente__boton {
  height: 46px;
  padding: 0 22px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.asistente__boton--secundario {
  padding: 0 20px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
}

.asistente__boton--oculto {
  visibility: hidden;
}

@media (max-width: 1023px) {
  .asistente__grilla--tres,
  .asistente__amenidades {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .asistente__grilla--tres .span-3 {
    grid-column: span 2;
  }

  .asistente__ubicacion {
    flex-direction: column;
  }

  .asistente__ubicacion-campos {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .asistente.safic-main {
    padding: 20px 16px;
  }

  .asistente__panel {
    padding: 18px 16px;
  }

  .asistente__grilla--tres,
  .asistente__grilla--dos,
  .asistente__amenidades {
    grid-template-columns: minmax(0, 1fr);
  }

  .span-2,
  .span-3,
  .asistente__grilla--tres .span-3 {
    grid-column: auto;
  }

  .asistente__mensualidad {
    flex-direction: column;
    align-items: flex-start;
  }

  .asistente__resumen {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .asistente__pie {
    flex-wrap: wrap;
  }

  .asistente__pie-texto {
    order: -1;
    flex-basis: 100%;
  }

  .asistente__boton {
    flex-grow: 1;
    white-space: normal;
  }
}
</style>
