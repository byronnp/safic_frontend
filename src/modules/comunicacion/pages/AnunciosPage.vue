<template>
  <q-page class="safic-main anuncios">
    <section class="anuncios__lista">
      <PaginaEncabezado miga="Seguridad y comunicación / Anuncios" titulo="Anuncios publicados" />

      <template v-for="a in anuncios" :key="a.id">
        <div v-if="a.fijado" class="anuncios__fijado">
          <div class="anuncios__fijado-meta">
            <span class="anuncios__chip anuncios__chip--fijado">FIJADO</span>
            <span v-if="a.confirmacion" class="anuncios__chip anuncios__chip--confirmacion"
              >CONFIRMACIÓN DE LECTURA</span
            >
            <span class="anuncios__espacio" />
            <span class="anuncios__publicado">Publicado {{ a.publicado }} · {{ a.destino }}</span>
          </div>
          <div class="anuncios__fijado-titulo">{{ a.titulo }}</div>
          <div class="anuncios__fijado-avance">
            <div
              class="anuncios__barra"
              role="progressbar"
              :aria-valuenow="a.leido"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${a.leido} % leído`"
            >
              <div class="anuncios__barra-relleno" :style="{ width: `${a.leido}%` }" />
            </div>
            <div class="anuncios__fijado-porcentaje">{{ a.leido }} % leído</div>
          </div>
          <div
            v-if="a.confirmacion && a.totalUnidades !== undefined"
            class="anuncios__fijado-acciones"
          >
            <div class="anuncios__confirmadas">
              {{ a.confirmadas ?? 0 }} de {{ a.totalUnidades }} unidades confirmaron ·
              {{ pendientes(a) }} pendientes
            </div>
            <button
              type="button"
              class="anuncios__boton anuncios__boton--contorno"
              :disabled="pendientes(a) === 0"
              @click="reenviar(a)"
            >
              Reenviar a las {{ pendientes(a) }} pendientes
            </button>
            <button type="button" class="anuncios__boton" @click="exportar(a)">
              Exportar constancia
            </button>
          </div>
        </div>

        <div v-else class="anuncios__fila">
          <div class="anuncios__fila-textos">
            <div class="anuncios__fila-titulo">{{ a.titulo }}</div>
            <div class="anuncios__fila-meta">
              Publicado {{ a.publicado }} · {{ a.destino
              }}<template v-if="a.expira"> · expira {{ a.expira }}</template>
            </div>
          </div>
          <div
            class="anuncios__barra anuncios__barra--corta"
            role="progressbar"
            :aria-valuenow="a.leido"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${a.leido} % leído`"
          >
            <div class="anuncios__barra-relleno" :style="{ width: `${a.leido}%` }" />
          </div>
          <div class="anuncios__fila-porcentaje">{{ a.leido }} %</div>
        </div>
      </template>
    </section>

    <aside class="anuncios__nuevo" aria-labelledby="anuncios-nuevo-titulo">
      <h2 id="anuncios-nuevo-titulo" class="anuncios__nuevo-titulo">Nuevo anuncio</h2>
      <label class="anuncios__campo">
        Título<input v-model="form.titulo" class="anuncios__input" />
      </label>
      <div class="anuncios__campo-grupo">
        <div id="anuncios-para" class="anuncios__etiqueta">Para</div>
        <div class="anuncios__destinos" role="radiogroup" aria-labelledby="anuncios-para">
          <button
            v-for="d in DESTINOS_ANUNCIO"
            :key="d.id"
            type="button"
            role="radio"
            class="anuncios__destino"
            :class="{ 'anuncios__destino--activo': form.destino === d.id }"
            :aria-checked="form.destino === d.id"
            @click="form.destino = d.id"
          >
            {{ d.nombre }}
          </button>
        </div>
        <div class="anuncios__alcance">
          {{ destinoActual.alcance || 'Elige las unidades que recibirán el anuncio' }}
        </div>
      </div>
      <label class="anuncios__campo">
        Mensaje
        <textarea v-model="form.mensaje" rows="5" class="anuncios__textarea" />
      </label>
      <button type="button" class="anuncios__adjuntar" @click="archivoInput?.click()">
        {{ adjunto ? `Adjunto: ${adjunto}` : 'Adjuntar PDF o imagen' }}
      </button>
      <input
        ref="archivoInput"
        type="file"
        accept="application/pdf,image/*"
        class="anuncios__archivo"
        aria-label="Adjuntar PDF o imagen"
        @change="alAdjuntar"
      />
      <label class="anuncios__check">
        <input v-model="form.fijar" type="checkbox" class="anuncios__checkbox" />Fijar arriba
      </label>
      <label class="anuncios__check">
        <input v-model="form.confirmacion" type="checkbox" class="anuncios__checkbox" />Pedir
        confirmación de lectura (asambleas)
      </label>
      <label class="anuncios__expira">
        Expira<input v-model="form.expira" class="anuncios__input anuncios__input--expira" />
      </label>
      <div class="anuncios__relleno" />
      <button type="button" class="anuncios__publicar" @click="publicar">
        Publicar y notificar
      </button>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import {
  ANUNCIOS,
  BORRADOR_ANUNCIO,
  DESTINOS_ANUNCIO,
  FECHA_PUBLICACION_HOY,
} from '@/modules/comunicacion/demo/anuncios';
import type { Anuncio, DestinoAnuncio } from '@/modules/comunicacion/demo/anuncios';

const $q = useQuasar();

const anuncios = ref<Anuncio[]>(ANUNCIOS.map((a) => ({ ...a })));
const form = reactive({ ...BORRADOR_ANUNCIO });
const adjunto = ref('');
const archivoInput = ref<HTMLInputElement | null>(null);

const destinoActual = computed<DestinoAnuncio>(
  () => DESTINOS_ANUNCIO.find((d) => d.id === form.destino) ?? DESTINOS_ANUNCIO[0]!,
);

function pendientes(a: Anuncio): number {
  return (a.totalUnidades ?? 0) - (a.confirmadas ?? 0);
}

function reenviar(a: Anuncio): void {
  $q.notify({
    type: 'positive',
    message: `Anuncio reenviado a las ${pendientes(a)} unidades pendientes`,
  });
}

function exportar(a: Anuncio): void {
  $q.notify({
    type: 'positive',
    message: `Constancia de lectura lista: ${a.confirmadas ?? 0} de ${a.totalUnidades ?? 0} unidades`,
  });
}

function alAdjuntar(evento: Event): void {
  const archivo = (evento.target as HTMLInputElement).files?.[0];
  adjunto.value = archivo?.name ?? '';
}

function publicar(): void {
  const titulo = form.titulo.trim();
  if (!titulo || !form.mensaje.trim()) {
    $q.notify({ type: 'warning', message: 'Escribe el título y el mensaje del anuncio' });
    return;
  }
  const nuevo: Anuncio = {
    id: `a${Date.now()}`,
    titulo,
    publicado: FECHA_PUBLICACION_HOY,
    destino: destinoActual.value.nombre,
    leido: 0,
    fijado: form.fijar,
    confirmacion: form.confirmacion,
  };
  if (form.expira.trim()) nuevo.expira = form.expira.trim();
  if (form.confirmacion) {
    nuevo.confirmadas = 0;
    nuevo.totalUnidades = Number(/(\d+) unidades/.exec(destinoActual.value.alcance)?.[1] ?? 0);
  }
  const fijados = anuncios.value.filter((a) => a.fijado);
  const resto = anuncios.value.filter((a) => !a.fijado);
  anuncios.value = nuevo.fijado ? [nuevo, ...fijados, ...resto] : [...fijados, nuevo, ...resto];
  Object.assign(form, { ...BORRADOR_ANUNCIO, titulo: '', mensaje: '' });
  adjunto.value = '';
  $q.notify({ type: 'positive', message: 'Anuncio publicado y notificado' });
}
</script>

<style scoped>
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
