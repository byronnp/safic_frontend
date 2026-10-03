<template>
  <q-page class="safic-main asistente">
    <PaginaEncabezado miga="Condominios / Nuevo" titulo="Nuevo condominio" />

    <NuevoCondominioPasos :pasos="PASOS" :actual="paso" @ir="irA" />

    <div v-if="cargaFallida" class="safic-alerta row items-center" role="alert" style="gap: 12px">
      <span class="col-grow">{{ cargaFallida }}</span>
      <q-btn flat no-caps dense label="Reintentar" @click="reintentarCatalogos" />
    </div>

    <section
      v-else-if="cargando"
      class="asistente__panel asistente__panel--cargando"
      aria-busy="true"
    >
      <q-skeleton v-for="n in 6" :key="n" type="rect" height="44px" />
    </section>

    <section v-else class="asistente__panel" :aria-label="PASOS[paso - 1]?.titulo">
      <!-- Paso 1 · Datos generales -->
      <div v-if="paso === 1" class="asistente__grilla asistente__grilla--tres">
        <NuevoCondominioCampo
          etiqueta="Nombre del condominio"
          :error="err('nombre')"
          class="span-2"
        >
          <input
            v-model="f.nombre"
            class="control"
            :class="{ 'control--error': err('nombre') }"
            maxlength="120"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Tipo">
          <select v-model="f.tipo" class="control control--select">
            <option v-for="t in TIPOS_CONDOMINIO" :key="t.valor" :value="t.valor">
              {{ t.etiqueta }}
            </option>
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
            maxlength="160"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Provincia" :error="err('provincia')">
          <select
            v-model="f.provincia"
            class="control control--select"
            :class="{ 'control--error': err('provincia') }"
            @change="cambiarProvincia"
          >
            <option value="" disabled>Elige…</option>
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
            :disabled="!f.provincia"
            @change="cambiarCanton"
          >
            <option value="" disabled>Elige…</option>
            <option v-for="c in cantones" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Parroquia" :error="err('parroquia')">
          <select
            v-model="f.parroquia"
            class="control control--select"
            :class="{ 'control--error': err('parroquia') }"
            :disabled="!f.canton"
          >
            <option value="" disabled>Elige…</option>
            <option v-for="q in parroquias" :key="q.codigo" :value="q.codigo">
              {{ q.nombre }}
            </option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Dirección" :error="err('direccion')" class="span-3">
          <input
            v-model="f.direccion"
            class="control"
            :class="{ 'control--error': err('direccion') }"
            maxlength="200"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo
          etiqueta="Teléfono de la administración (opcional)"
          :error="err('telefono')"
        >
          <input
            v-model="f.telefono"
            type="tel"
            class="control"
            :class="{ 'control--error': err('telefono') }"
            inputmode="tel"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo
          etiqueta="Correo de la administración (opcional)"
          :error="err('emailContacto')"
          class="span-2"
        >
          <input
            v-model="f.emailContacto"
            type="email"
            class="control"
            :class="{ 'control--error': err('emailContacto') }"
          />
        </NuevoCondominioCampo>

        <div class="asistente__separador span-3">CONTRATO CON LA PLATAFORMA</div>

        <NuevoCondominioCampo etiqueta="Total de unidades" :error="err('unidades')">
          <input
            v-model="f.unidades"
            class="control control--destacado"
            :class="{ 'control--error': err('unidades') }"
            inputmode="numeric"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Plan">
          <select v-model="f.plan" class="control control--select" @change="sugerirValor">
            <option v-for="p in planes" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }} · {{ p.limite_administrativos }} administrativos
            </option>
          </select>
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Valor por unidad (USD)" :error="err('valorUnidad')">
          <input
            v-model="f.valorUnidad"
            class="control control--destacado"
            :class="{ 'control--error': err('valorUnidad') }"
            inputmode="decimal"
          />
        </NuevoCondominioCampo>

        <div class="asistente__mensualidad span-3">
          <div class="asistente__mensualidad-texto">
            Mensualidad: <strong>{{ unidadesNum }} unidades × {{ valorTxt }}</strong> =
            <strong class="asistente__mensualidad-total">{{ totalTxt }}</strong> + IVA · Límite de
            registro: {{ unidadesNum }} unidades
          </div>
          <span class="asistente__prueba">Prueba 30 días</span>
        </div>
      </div>

      <!-- Paso 2 · Ubicación -->
      <div v-else-if="paso === 2" class="asistente__ubicacion">
        <MapaUbicacion
          v-model:latitud="f.latitud"
          v-model:longitud="f.longitud"
          :centro="centroMapa"
        />
        <div class="asistente__ubicacion-campos">
          <div class="asistente__nota">
            <strong>{{ ubicacionTxt || 'Elige la ubicación en el paso 1' }}</strong
            ><br />
            {{ f.direccion }}
          </div>
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

      <!-- Paso 3 · Cobro de cuotas -->
      <div v-else-if="paso === 3" class="asistente__cobro">
        <div class="asistente__intro">
          Cómo cobra este condominio sus cuotas a los residentes. El administrador puede cambiarlo
          después en Configuración › Cobro de cuotas.
        </div>
        <div id="metodo-cobro" class="campo-etiqueta">Método de cobro</div>
        <div role="radiogroup" aria-labelledby="metodo-cobro" class="metodos">
          <button
            v-for="m in METODOS_COBRO"
            :key="m.valor"
            type="button"
            role="radio"
            class="metodo"
            :class="{ 'metodo--activo': f.metodo === m.valor }"
            :aria-checked="f.metodo === m.valor"
            @click="f.metodo = m.valor"
          >
            <span class="metodo__titulo"><span class="metodo__punto" />{{ m.nombre }}</span>
            <span class="metodo__detalle">{{ m.detalle }}</span>
          </button>
        </div>

        <div v-if="f.metodo === 'general'" class="asistente__grilla asistente__grilla--dos">
          <NuevoCondominioCampo
            etiqueta="Cuota mensual por unidad (USD)"
            :error="err('cuotaGeneral')"
          >
            <input
              v-model="f.cuotaGeneral"
              class="control control--destacado"
              :class="{ 'control--error': err('cuotaGeneral') }"
              inputmode="decimal"
              placeholder="80,00"
            />
          </NuevoCondominioCampo>
          <div class="asistente__nota asistente__nota--centrada">
            La pagan todas por igual: casas, departamentos y locales.
          </div>
        </div>
        <div v-else-if="f.metodo === 'tipo'">
          <div class="asistente__grilla asistente__grilla--cinco">
            <NuevoCondominioCampo
              v-for="t in TIPOS_UNIDAD"
              :key="t.valor"
              :etiqueta="`${t.etiqueta} (USD)`"
            >
              <input
                v-model="f.valoresTipo[t.valor]"
                class="control"
                :class="{ 'control--error': err('valoresTipo') }"
                inputmode="decimal"
              />
            </NuevoCondominioCampo>
          </div>
          <div v-if="err('valoresTipo')" class="campo-error" role="alert">
            {{ err('valoresTipo') }}
          </div>
        </div>
        <div v-else-if="f.metodo === 'alicuota'" class="asistente__grilla asistente__grilla--dos">
          <NuevoCondominioCampo
            etiqueta="Presupuesto mensual del condominio (USD)"
            :error="err('presupuesto')"
          >
            <input
              v-model="f.presupuesto"
              class="control control--destacado"
              :class="{ 'control--error': err('presupuesto') }"
              inputmode="decimal"
            />
          </NuevoCondominioCampo>
          <div class="asistente__nota asistente__nota--centrada">
            Cada unidad paga su alícuota de este total. Ej.: 0,62 % → 0,62 % del presupuesto.
          </div>
        </div>
        <div v-else class="asistente__aviso asistente__aviso--neutro">
          La cuota se escribe en cada unidad al crearla o en la columna <strong>cuota</strong> del
          Excel de unidades.
        </div>

        <div class="asistente__grilla asistente__grilla--dos">
          <NuevoCondominioCampo etiqueta="Día de vencimiento">
            <select v-model="f.diaVencimiento" class="control control--select">
              <option v-for="d in DIAS_VENCIMIENTO" :key="d.valor" :value="d.valor">
                {{ d.etiqueta }}
              </option>
            </select>
          </NuevoCondominioCampo>
          <NuevoCondominioCampo etiqueta="Primera cuota" :error="err('primeraCuota')">
            <select v-model="f.primeraCuota" class="control control--select">
              <option v-for="m in meses" :key="m.valor" :value="m.valor">{{ m.etiqueta }}</option>
            </select>
          </NuevoCondominioCampo>
        </div>
      </div>

      <!-- Paso 4 · Amenidades -->
      <div v-else-if="paso === 4">
        <div class="asistente__intro">
          Elige las amenidades del condominio. Las reservables pasan a la agenda de áreas comunes;
          las esenciales nunca se restringen por mora.
        </div>
        <div class="asistente__amenidades">
          <div
            v-for="a in catalogo"
            :key="a.id"
            class="amenidad"
            :class="{ 'amenidad--activa': amenidades.has(a.id) }"
          >
            <label class="amenidad__etiqueta">
              <input
                type="checkbox"
                class="amenidad__check"
                :checked="amenidades.has(a.id)"
                @change="alternarAmenidad(a.id)"
              />
              <span>
                <span class="amenidad__nombre">{{ a.nombre }}</span>
                <span class="amenidad__meta">{{ metaAmenidad(a) }}</span>
              </span>
            </label>
            <label v-if="amenidades.has(a.id)" class="amenidad__cantidad">
              <span class="sr-only">Cantidad de {{ a.nombre }}</span>
              ×
              <input
                type="number"
                min="1"
                max="999"
                class="amenidad__numero"
                :value="amenidades.get(a.id)"
                @input="cambiarCantidad(a.id, $event)"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Paso 5 · Administrador -->
      <div v-else class="asistente__grilla asistente__grilla--dos">
        <NuevoCondominioCampo etiqueta="Correo" :error="err('correo')">
          <input
            v-model="f.correo"
            type="email"
            class="control"
            :class="{ 'control--error': err('correo') }"
            autocomplete="off"
          />
        </NuevoCondominioCampo>
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
            maxlength="120"
          />
        </NuevoCondominioCampo>
        <NuevoCondominioCampo etiqueta="Celular (opcional)" :error="err('celular')">
          <input
            v-model="f.celular"
            type="tel"
            class="control"
            :class="{ 'control--error': err('celular') }"
          />
        </NuevoCondominioCampo>

        <div v-if="usuario.data.value" class="asistente__aviso span-2">
          <strong>Esta persona ya tiene cuenta</strong> ({{ usuario.data.value.nombre }}, miembro de
          {{ usuario.data.value.condominios }} condominio{{
            usuario.data.value.condominios === 1 ? '' : 's'
          }}). Se le agregará {{ f.nombre || 'este condominio' }} como administrador; no se enviará
          invitación de registro.
        </div>
        <div v-else class="asistente__aviso asistente__aviso--neutro span-2">
          <strong>Persona nueva en SAFIC.</strong> Al crear el condominio se enviará una invitación
          de registro a {{ f.correo || 'su correo' }}.
        </div>

        <div class="asistente__resumen span-2">
          <div>
            <div class="asistente__resumen-etiqueta">Unidades</div>
            <div class="asistente__resumen-valor">{{ unidadesNum }}</div>
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
            <div class="asistente__resumen-etiqueta">Cuota a residentes</div>
            <div class="asistente__resumen-valor">{{ cuotaTxt }}</div>
          </div>
          <div>
            <div class="asistente__resumen-etiqueta">Amenidades</div>
            <div class="asistente__resumen-valor">{{ amenidades.size }}</div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

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
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="asistente__boton"
        :loading="crear.isPending.value"
        :disable="cargando || !!cargaFallida"
        :label="paso === TOTAL_PASOS ? 'Crear condominio y enviar acceso' : 'Siguiente'"
        @click="siguiente"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';

import MapaUbicacion from '@/components/MapaUbicacion.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useUbicaciones } from '@/core/catalogos/ubicaciones';
import NuevoCondominioCampo from '@/modules/plataforma/components/NuevoCondominioCampo.vue';
import NuevoCondominioPasos from '@/modules/plataforma/components/NuevoCondominioPasos.vue';
import { refDebounced } from '@/utils/debounce';
import { formatoMoneda } from '@/utils/formato';

import {
  aPayload,
  campoDeApi,
  DIAS_VENCIMIENTO,
  formularioInicial,
  mesesPrimeraCuota,
  METODOS_COBRO,
  multiplicarMonto,
  normalizarMonto,
  PASOS,
  TIPOS_CONDOMINIO,
  TIPOS_UNIDAD,
  TOTAL_PASOS,
  validarPaso,
  type CampoFormulario,
} from '../asistente';
import {
  useBuscarUsuario,
  useCatalogoAmenidades,
  useCrearCondominio,
  usePlanes,
} from '../composables/usePlataforma';
import type { AmenidadCatalogo } from '../services/plataforma.service';

const $q = useQuasar();
const router = useRouter();

const paso = ref(1);
const f = reactive(formularioInicial());
const meses = mesesPrimeraCuota();
/** amenidad_id → cantidad */
const amenidades = ref(new Map<number, number>());
/** Pasos en los que ya se intentó avanzar: desde ahí los errores se muestran en vivo. */
const intentados = ref(new Set<number>());
/** Errores que devolvió la API (422) hasta que el campo cambie. */
const erroresApi = ref<Partial<Record<CampoFormulario, string>>>({});
const errorGeneral = ref<string | null>(null);

// ---------- Catálogos ----------
const ubicaciones = useUbicaciones();
const planesQuery = usePlanes();
const amenidadesQuery = useCatalogoAmenidades();

const cargando = computed(
  () =>
    ubicaciones.isLoading.value || planesQuery.isLoading.value || amenidadesQuery.isLoading.value,
);
const cargaFallida = computed(
  () =>
    (ubicaciones.error.value ?? planesQuery.error.value ?? amenidadesQuery.error.value)?.mensaje ??
    null,
);

function reintentarCatalogos(): void {
  void ubicaciones.refetch();
  void planesQuery.refetch();
  void amenidadesQuery.refetch();
}

const planes = computed(() => planesQuery.data.value ?? []);
const catalogo = computed(() => amenidadesQuery.data.value ?? []);
const provincias = computed(() => ubicaciones.data.value ?? []);
const provincia = computed(() => provincias.value.find((p) => p.codigo === f.provincia));
const cantones = computed(() => provincia.value?.cantones ?? []);
const canton = computed(() => cantones.value.find((c) => c.codigo === f.canton));
const parroquias = computed(() => canton.value?.parroquias ?? []);

function cambiarProvincia(): void {
  f.canton = '';
  f.parroquia = '';
}

function cambiarCanton(): void {
  f.parroquia = '';
}

/** Al elegir plan, propone su valor sugerido si aún no se escribió uno. */
function sugerirValor(): void {
  const plan = planes.value.find((p) => p.codigo === f.plan);
  if (plan && f.valorUnidad.trim() === '') {
    f.valorUnidad = plan.valor_unidad_sugerido.replace('.', ',');
  }
}

// ---------- Contrato y resumen ----------
const unidadesNum = computed(() => (/^\d+$/.test(f.unidades.trim()) ? Number(f.unidades) : 0));
const valorNormalizado = computed(() => normalizarMonto(f.valorUnidad));
const valorTxt = computed(() =>
  valorNormalizado.value ? formatoMoneda(valorNormalizado.value) : '$ —',
);
const totalTxt = computed(() => {
  const total = multiplicarMonto(unidadesNum.value, valorNormalizado.value);
  return total ? formatoMoneda(total) : '$ —';
});
const planTxt = computed(() => planes.value.find((p) => p.codigo === f.plan)?.nombre ?? '—');
const cuotaTxt = computed(() => {
  if (f.metodo === 'general') {
    const cuota = normalizarMonto(f.cuotaGeneral);
    return cuota ? formatoMoneda(cuota) : '—';
  }
  return METODOS_COBRO.find((m) => m.valor === f.metodo)?.nombre ?? '—';
});

// ---------- Ubicación ----------
const centroMapa = computed(() => {
  const lugar = canton.value ?? provincia.value;
  const lat = Number(lugar?.latitud);
  const lng = Number(lugar?.longitud);
  return lugar && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
});
const ubicacionTxt = computed(() =>
  [
    parroquias.value.find((q) => q.codigo === f.parroquia)?.nombre,
    canton.value?.nombre,
    provincia.value?.nombre,
  ]
    .filter(Boolean)
    .join(', '),
);

// ---------- Amenidades ----------
function metaAmenidad(a: AmenidadCatalogo): string {
  if (a.esencial) {
    return 'Esencial';
  }
  return a.reservable
    ? a.requiere_aprobacion
      ? 'Reservable · con aprobación'
      : 'Reservable'
    : 'Acceso libre';
}

function alternarAmenidad(id: number): void {
  const nuevo = new Map(amenidades.value);
  if (nuevo.has(id)) {
    nuevo.delete(id);
  } else {
    nuevo.set(id, 1);
  }
  amenidades.value = nuevo;
}

function cambiarCantidad(id: number, evento: Event): void {
  const n = Math.round(Number((evento.target as HTMLInputElement).value));
  const nuevo = new Map(amenidades.value);
  nuevo.set(id, Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1);
  amenidades.value = nuevo;
}

// ---------- Administrador: ¿ya tiene cuenta? ----------
const correoDiferido = refDebounced(toRef(f, 'correo'), 400);
const usuario = useBuscarUsuario(correoDiferido);

// ---------- Validación ----------
const errores = computed(() => {
  const todos: Partial<Record<CampoFormulario, string>> = {};
  for (const n of intentados.value) {
    Object.assign(todos, validarPaso(n, f));
  }
  return { ...erroresApi.value, ...todos };
});

function err(campo: CampoFormulario): string | undefined {
  return errores.value[campo];
}

function pasoValido(n: number): boolean {
  return Object.keys(validarPaso(n, f)).length === 0;
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

const crear = useCrearCondominio();

async function siguiente(): Promise<void> {
  if (paso.value < TOTAL_PASOS) {
    irA(paso.value + 1);
    return;
  }
  const invalido = PASOS.map((_, i) => i + 1).find((n) => !pasoValido(n));
  if (invalido) {
    marcarIntentado(invalido);
    paso.value = invalido;
    return;
  }

  errorGeneral.value = null;
  erroresApi.value = {};
  try {
    const creado = await crear.mutateAsync(aPayload(f, amenidades.value));
    $q.notify({ type: 'positive', message: `${creado.condominio.nombre}: ${creado.mensaje}` });
    await router.push({ name: 'plataforma-condominios' });
  } catch (error) {
    const apiError = aApiError(error);
    const porCampo: Partial<Record<CampoFormulario, string>> = {};
    let primerPaso: number | null = null;
    for (const [campoApi, mensajes] of Object.entries(apiError.campos)) {
      const destino = campoDeApi(campoApi);
      if (destino && mensajes[0]) {
        porCampo[destino.campo] ??= mensajes[0];
        primerPaso = Math.min(primerPaso ?? destino.paso, destino.paso);
      }
    }
    if (apiError.codigo === 'CEDULA_EN_USO') {
      porCampo.cedula = apiError.mensaje;
      primerPaso = TOTAL_PASOS;
    }
    erroresApi.value = porCampo;
    if (primerPaso !== null) {
      paso.value = primerPaso;
    } else {
      errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>

<style scoped>
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

.asistente__panel--cargando {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 20px;
  align-content: start;
}

.asistente__grilla--cinco {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.asistente__cobro {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 980px;
}

.campo-etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.campo-error {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #9b1c12;
}

.metodos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metodo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 76px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #d8d4c8;
  background: #ffffff;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.metodo--activo {
  border: 2px solid var(--q-primary);
  background: #f1f6f5;
}

.metodo__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: var(--safic-texto);
}

.metodo__punto {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #a9a498;
  box-sizing: border-box;
}

.metodo--activo .metodo__punto {
  border: 5px solid var(--q-primary);
}

.metodo__detalle {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.asistente__nota--centrada {
  align-self: center;
}

.amenidad__numero {
  width: 56px;
  height: 32px;
  border: 1px solid #cfcbbf;
  border-radius: 8px;
  padding: 0 6px;
  font: inherit;
  font-weight: 800;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 1023px) {
  .metodos,
  .asistente__grilla--cinco {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
