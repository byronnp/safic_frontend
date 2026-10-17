<template>
  <q-page class="safic-main anuncios">
    <section class="anuncios__lista">
      <PaginaEncabezado miga="Seguridad y comunicación / Anuncios" titulo="Anuncios publicados" />

      <div v-if="resultado" class="anuncios__resultado" role="status">{{ resultado }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="72px" aria-busy="true" />
      </template>
      <div v-else-if="anuncios.length === 0" class="anuncios__vacio">
        <q-icon name="sym_r_campaign" size="40px" class="text-suave" />
        <div class="text-weight-bold">Aún no publicas anuncios</div>
        <div>
          Usa el formulario para avisar a todo el condominio, a un bloque o a unidades concretas.
        </div>
      </div>

      <template v-for="a in anuncios" :key="a.id">
        <div v-if="a.fijado" class="anuncios__fijado">
          <div class="anuncios__fijado-meta">
            <span class="anuncios__chip anuncios__chip--fijado">FIJADO</span>
            <span v-if="a.requiere_confirmacion" class="anuncios__chip anuncios__chip--confirmacion"
              >CONFIRMACIÓN DE LECTURA</span
            >
            <span class="anuncios__espacio" />
            <span class="anuncios__publicado"
              >Publicado {{ diaMes(a.publicado_en) }} · {{ a.destino }}</span
            >
          </div>
          <div class="anuncios__fijado-titulo">{{ a.titulo }}</div>
          <div class="anuncios__fijado-avance">
            <div
              class="anuncios__barra"
              role="progressbar"
              :aria-valuenow="a.porcentaje_leido"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${a.porcentaje_leido} % leído`"
            >
              <div class="anuncios__barra-relleno" :style="{ width: `${a.porcentaje_leido}%` }" />
            </div>
            <div class="anuncios__fijado-porcentaje">{{ a.porcentaje_leido }} % leído</div>
          </div>
          <div v-if="a.requiere_confirmacion" class="anuncios__fijado-acciones">
            <div class="anuncios__confirmadas">
              {{ a.confirmadas }} de {{ a.unidades }} unidades confirmaron ·
              {{ pendientesDe(a) }} pendientes
            </div>
            <button
              type="button"
              class="anuncios__boton anuncios__boton--contorno"
              :disabled="pendientesDe(a) === 0 || ocupado || !a.vigente"
              @click="reenviar(a)"
            >
              Reenviar a las {{ pendientesDe(a) }} pendientes
            </button>
            <button type="button" class="anuncios__boton" :disabled="ocupado" @click="exportar(a)">
              Exportar constancia
            </button>
          </div>
        </div>

        <div v-else class="anuncios__fila">
          <div class="anuncios__fila-textos">
            <div class="anuncios__fila-titulo">{{ a.titulo }}</div>
            <div class="anuncios__fila-meta">
              Publicado {{ diaMes(a.publicado_en) }} · {{ a.destino
              }}<template v-if="a.expira_en">
                · {{ a.vigente ? 'expira' : 'expiró' }} {{ diaMes(a.expira_en) }}</template
              >
            </div>
            <div v-if="a.requiere_confirmacion" class="anuncios__fila-meta">
              {{ a.confirmadas }} de {{ a.unidades }} confirmaron
              <button
                type="button"
                class="anuncios__enlace"
                :disabled="ocupado"
                @click="exportar(a)"
              >
                Constancia
              </button>
            </div>
          </div>
          <div
            class="anuncios__barra anuncios__barra--corta"
            role="progressbar"
            :aria-valuenow="a.porcentaje_leido"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${a.porcentaje_leido} % leído`"
          >
            <div class="anuncios__barra-relleno" :style="{ width: `${a.porcentaje_leido}%` }" />
          </div>
          <div class="anuncios__fila-porcentaje">{{ a.porcentaje_leido }} %</div>
        </div>
      </template>
    </section>

    <aside class="anuncios__nuevo" aria-labelledby="anuncios-nuevo-titulo">
      <h2 id="anuncios-nuevo-titulo" class="anuncios__nuevo-titulo">Nuevo anuncio</h2>

      <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

      <label class="anuncios__campo">
        Título<input v-model="f.titulo" class="anuncios__input" maxlength="120" />
        <span v-if="errores.titulo" class="anuncios__error" role="alert">{{ errores.titulo }}</span>
      </label>
      <div class="anuncios__campo-grupo">
        <div id="anuncios-para" class="anuncios__etiqueta">Para</div>
        <div class="anuncios__destinos" role="radiogroup" aria-labelledby="anuncios-para">
          <button
            v-for="d in DESTINOS"
            :key="d.id"
            type="button"
            role="radio"
            class="anuncios__destino"
            :class="{ 'anuncios__destino--activo': f.destino === d.id }"
            :aria-checked="f.destino === d.id"
            @click="f.destino = d.id"
          >
            {{ d.nombre }}
          </button>
        </div>
        <select
          v-if="f.destino === 'bloque'"
          v-model="f.bloqueId"
          class="anuncios__input"
          aria-label="Bloque"
        >
          <option :value="null" disabled>Elige el bloque</option>
          <option v-for="b in bloques" :key="b.id" :value="b.id">{{ b.nombre }}</option>
        </select>
        <span v-if="errores.bloqueId" class="anuncios__error" role="alert">{{
          errores.bloqueId
        }}</span>
        <textarea
          v-if="f.destino === 'unidades'"
          v-model="f.unidades"
          rows="2"
          class="anuncios__textarea"
          placeholder="Códigos separados por coma. Ej.: A-101, A-102"
          aria-label="Unidades"
        />
        <span v-if="errores.unidades" class="anuncios__error" role="alert">{{
          errores.unidades
        }}</span>
        <div class="anuncios__alcance" aria-live="polite">
          <template v-if="!completo">Elige a quién va dirigido el anuncio</template>
          <template v-else-if="alcance.isPending.value">Calculando…</template>
          <template v-else-if="alcance.isError.value">{{ alcance.error.value?.mensaje }}</template>
          <template v-else-if="alcance.data.value">{{ textoAlcance(alcance.data.value) }}</template>
        </div>
      </div>
      <label class="anuncios__campo">
        Mensaje
        <textarea v-model="f.mensaje" rows="5" class="anuncios__textarea" maxlength="4000" />
        <span v-if="errores.mensaje" class="anuncios__error" role="alert">{{
          errores.mensaje
        }}</span>
      </label>
      <button type="button" class="anuncios__adjuntar" @click="archivoInput?.click()">
        {{ f.adjunto ? `Adjunto: ${f.adjunto.name}` : 'Adjuntar PDF o imagen' }}
      </button>
      <input
        ref="archivoInput"
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        class="anuncios__archivo"
        aria-label="Adjuntar PDF o imagen"
        @change="alAdjuntar"
      />
      <span v-if="errores.adjunto" class="anuncios__error" role="alert">{{ errores.adjunto }}</span>
      <label class="anuncios__check">
        <input v-model="f.fijar" type="checkbox" class="anuncios__checkbox" />Fijar arriba
      </label>
      <label class="anuncios__check">
        <input v-model="f.confirmacion" type="checkbox" class="anuncios__checkbox" />Pedir
        confirmación de lectura (asambleas)
      </label>
      <label class="anuncios__expira">
        Expira
        <input
          v-model="f.expira"
          type="date"
          :min="hoy"
          class="anuncios__input anuncios__input--expira"
        />
        <span v-if="errores.expira" class="anuncios__error" role="alert">{{ errores.expira }}</span>
      </label>
      <div class="anuncios__relleno" />
      <button
        type="button"
        class="anuncios__publicar"
        :disabled="publicando.isPending.value"
        @click="publicar"
      >
        {{ publicando.isPending.value ? 'Publicando…' : 'Publicar y notificar' }}
      </button>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { guardarArchivo } from '@/core/api/descarga';
import { useBloques } from '@/modules/unidades/composables/useBloques';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';

import {
  anuncioVacio,
  destinoCompleto,
  destinoDe,
  diaMes,
  pendientesDe,
  peticionAnuncio,
  textoAlcance,
  validarAnuncio,
  type ErroresAnuncio,
} from '../anuncios.logica';
import {
  useAlcanceAnuncio,
  useAnuncios,
  usePublicarAnuncio,
  useReenviarAnuncio,
} from '../composables/useAnuncios';
import { anunciosService, type AnuncioAdmin, type DestinoTipo } from '../services/anuncios.service';

const DESTINOS: { id: DestinoTipo; nombre: string }[] = [
  { id: 'todos', nombre: 'Todo el condominio' },
  { id: 'bloque', nombre: 'Un bloque' },
  { id: 'unidades', nombre: 'Unidades…' },
];

const session = useSessionStore();
const hoy = hoyEcuador();

const consulta = useAnuncios();
const publicando = usePublicarAnuncio();
const reenviando = useReenviarAnuncio();
const bloquesConsulta = useBloques();

const anuncios = computed(() => consulta.data.value ?? []);
const bloques = computed(() => bloquesConsulta.data.value ?? []);

const f = reactive(anuncioVacio());
const errores = reactive<ErroresAnuncio>({});
const errorGeneral = ref<string | null>(null);
const archivoInput = ref<HTMLInputElement | null>(null);
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const descargando = ref(false);
const ocupado = computed(() => reenviando.isPending.value || descargando.value);

const completo = computed(() => destinoCompleto(f));
const destino = computed(() => destinoDe(f));
const alcance = useAlcanceAnuncio(destino, completo);

// Otro condominio: nada de lo escrito ni avisado queda
watch(
  () => session.condominioId,
  () => {
    Object.assign(f, anuncioVacio());
    for (const k of Object.keys(errores) as (keyof ErroresAnuncio)[]) errores[k] = undefined;
    errorGeneral.value = null;
    resultado.value = null;
    errorAccion.value = null;
  },
);

function alAdjuntar(evento: Event): void {
  f.adjunto = (evento.target as HTMLInputElement).files?.[0] ?? null;
}

function fallar(error: unknown): void {
  resultado.value = null;
  const apiError = aApiError(error);
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa la lista antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

async function publicar(): Promise<void> {
  // Un doble toque no publica dos veces
  if (publicando.isPending.value) return;
  errorGeneral.value = null;
  resultado.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresAnuncio)[]) errores[k] = undefined;

  const problemas = validarAnuncio(f, hoy);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  const condominio = session.condominioId;
  try {
    await publicando.mutateAsync(peticionAnuncio(f));
    // Si cambió el condominio mientras se publicaba, el formulario ya es de otro: no se toca
    if (session.condominioId !== condominio) return;
    Object.assign(f, anuncioVacio());
    if (archivoInput.value) archivoInput.value.value = '';
    resultado.value = 'Anuncio publicado. Se avisó a los residentes.';
  } catch (error) {
    if (session.condominioId !== condominio) return;
    const apiError = aApiError(error);
    errores.titulo = apiError.campo('titulo');
    errores.mensaje = apiError.campo('mensaje');
    errores.bloqueId =
      apiError.codigo === 'BLOQUE_NO_ENCONTRADO' ? apiError.mensaje : apiError.campo('bloque_id');
    errores.unidades =
      apiError.codigo === 'UNIDADES_NO_ENCONTRADAS' || apiError.codigo === 'SIN_DESTINATARIOS'
        ? apiError.mensaje
        : apiError.campo('unidades');
    errores.expira =
      apiError.codigo === 'EXPIRA_PASADO' ? apiError.mensaje : apiError.campo('expira');
    errores.adjunto = apiError.campo('adjunto');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el anuncio pudo publicarse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa la lista antes de reintentar: el anuncio pudo publicarse.`
          : apiError.mensaje;
    }
  }
}

function reenviar(a: AnuncioAdmin): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  const condominio = session.condominioId;
  reenviando.mutate(a.id, {
    onSuccess: (n) => {
      if (session.condominioId === condominio)
        resultado.value = `Anuncio reenviado a ${n} unidades pendientes.`;
    },
    onError: fallar,
  });
}

async function exportar(a: AnuncioAdmin): Promise<void> {
  if (ocupado.value) return;
  errorAccion.value = null;
  descargando.value = true;
  const condominio = session.condominioId;
  try {
    const pdf = await anunciosService.constancia(a.id);
    if (session.condominioId !== condominio) return;
    guardarArchivo(pdf, `constancia-${a.id}.pdf`);
    resultado.value = `Constancia de lectura lista: ${a.confirmadas} de ${a.unidades} unidades.`;
  } catch (error) {
    fallar(error);
  } finally {
    descargando.value = false;
  }
}
</script>

<style scoped>
.anuncios__error {
  font-size: 12px;
  font-weight: 600;
  color: #b3261e;
}

.anuncios__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.anuncios__vacio {
  padding: 28px 16px;
  text-align: center;
  color: var(--safic-texto-suave);
}

.anuncios__publicar:disabled,
.anuncios__boton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.anuncios.safic-main {
  padding: 24px 32px;
  flex-direction: row;
  gap: 20px;
  align-items: stretch;
}

.anuncios__lista {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.anuncios__lista :deep(.safic-titulo) {
  margin-top: 8px;
}

.anuncios__fijado {
  background: #ffffff;
  border: 2px solid var(--q-primary);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.anuncios__fijado-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.anuncios__chip {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.anuncios__chip--fijado {
  background: #fff1dc;
  color: #8a3f0a;
}

.anuncios__chip--confirmacion {
  background: #e6ecf7;
  color: #23407a;
}

.anuncios__espacio {
  flex-grow: 1;
}

.anuncios__publicado {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.anuncios__fijado-titulo {
  font-size: 17px;
  font-weight: 800;
}

.anuncios__fijado-avance {
  display: flex;
  align-items: center;
  gap: 12px;
}

.anuncios__barra {
  flex-grow: 1;
  height: 10px;
  border-radius: 5px;
  background: var(--safic-linea);
  overflow: hidden;
}

.anuncios__barra--corta {
  flex-grow: 0;
  flex-shrink: 0;
  width: 140px;
  height: 8px;
  border-radius: 4px;
}

.anuncios__barra-relleno {
  height: 100%;
  background: var(--q-primary);
}

.anuncios__fijado-porcentaje {
  font-size: 14px;
  font-weight: 800;
}

.anuncios__fijado-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
}

.anuncios__confirmadas {
  font-size: 13px;
  color: var(--safic-texto-2);
  flex-grow: 1;
}

.anuncios__boton {
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.anuncios__boton--contorno {
  border-color: var(--q-primary);
  color: var(--q-primary);
}

.anuncios__boton:disabled {
  opacity: 0.5;
  cursor: default;
}

.anuncios__fila {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.anuncios__fila-textos {
  flex-grow: 1;
  min-width: 0;
}

.anuncios__fila-titulo {
  font-size: 15px;
  font-weight: 800;
}

.anuncios__fila-meta {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

.anuncios__fila-porcentaje {
  width: 70px;
  flex-shrink: 0;
  text-align: right;
  font-size: 13px;
  font-weight: 800;
}

.anuncios__nuevo {
  width: 460px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.anuncios__nuevo-titulo {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.anuncios__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.anuncios__campo-grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.anuncios__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.anuncios__input,
.anuncios__textarea {
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
  font-weight: 400;
  min-width: 0;
}

.anuncios__input {
  height: 46px;
  padding: 0 12px;
  font-size: 15px;
}

.anuncios__textarea {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.anuncios__input:focus,
.anuncios__textarea:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.anuncios__destinos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.anuncios__destino {
  padding: 9px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid var(--safic-borde-2);
  color: var(--safic-texto);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  line-height: normal;
}

.anuncios__destino--activo {
  background: var(--q-primary);
  border-color: var(--q-primary);
  color: #ffffff;
}

.anuncios__alcance {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.anuncios__adjuntar {
  height: 44px;
  border-radius: 10px;
  border: 1.5px dashed #9fbdb8;
  background: #f1f6f5;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 12px;
}

.anuncios__archivo {
  display: none;
}

.anuncios__check {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.anuncios__checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--q-primary);
  flex-shrink: 0;
}

.anuncios__expira {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}

.anuncios__input--expira {
  height: 40px;
  width: 150px;
  border-radius: 9px;
  padding: 0 10px;
  font-size: 14px;
}

.anuncios__relleno {
  flex-grow: 1;
}

.anuncios__publicar {
  height: 50px;
  border-radius: 12px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

@media (max-width: 1100px) {
  .anuncios.safic-main {
    flex-direction: column;
  }

  .anuncios__nuevo {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .anuncios.safic-main {
    padding: 20px 16px;
  }

  .anuncios__fila,
  .anuncios__fijado-acciones {
    flex-wrap: wrap;
  }

  .anuncios__confirmadas {
    flex-basis: 100%;
  }

  .anuncios__fila-textos {
    flex-basis: 100%;
  }

  .anuncios__barra--corta {
    flex-grow: 1;
    width: auto;
  }

  .anuncios__nuevo {
    padding: 18px 16px;
  }
}
</style>
