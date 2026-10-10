<template>
  <!-- Panel lateral de la persona elegida: perfil, vigencia y acciones de acceso (mockup F1Usuarios) -->
  <div class="panel">
    <div class="panel__cabecera">
      <div class="panel__avatar" :style="{ background: color.fondo, color: color.texto }">
        {{ iniciales(usuario.nombre) }}
      </div>
      <div class="panel__persona-textos">
        <div class="panel__nombre">{{ usuario.nombre }}</div>
        <div class="panel__descripcion">{{ usuario.email }}</div>
      </div>
      <EstadoBadge :tono="ESTADOS[usuario.estado].tono">
        {{ ESTADOS[usuario.estado].texto }}
      </EstadoBadge>
    </div>

    <div class="panel__cuerpo">
      <div v-if="error" class="safic-alerta" role="alert">
        {{ error.mensaje }}
        <router-link
          v-if="error.codigo === 'LIMITE_USUARIOS'"
          :to="{ name: 'configuracion-suscripcion' }"
        >
          Subir de plan
        </router-link>
      </div>

      <div class="panel__dato">
        <span class="panel__dato-etiqueta">Perfiles</span>
        <strong>{{ textoRoles(usuario.roles) }}</strong>
      </div>
      <div class="panel__dato">
        <span class="panel__dato-etiqueta">Cuenta cupo del plan</span>
        <strong>{{ usuario.cuenta_cupo ? 'Sí' : 'No' }}</strong>
      </div>
      <div v-if="usuario.celular" class="panel__dato">
        <span class="panel__dato-etiqueta">Celular</span>
        <strong>{{ usuario.celular }}</strong>
      </div>

      <div v-if="usuario.es_yo" class="panel__nota" role="note">
        Esta es tu cuenta. No puedes cambiar tu propio acceso: pídeselo a otro administrador.
      </div>

      <template v-else>
        <div class="panel__campo">
          <label for="usuario-perfil" class="panel__etiqueta">Perfil</label>
          <select id="usuario-perfil" v-model="formulario.perfil" class="panel__control">
            <option v-if="formulario.perfil === null" :value="null" disabled>
              Sin perfil asignado
            </option>
            <option v-for="p in PERFILES" :key="p.valor" :value="p.valor">{{ p.etiqueta }}</option>
          </select>
          <div v-if="errores.perfil" class="panel__error">{{ errores.perfil }}</div>
          <div v-else class="panel__ayuda">{{ ayudaPerfil }}</div>
        </div>

        <div class="panel__campo">
          <label for="usuario-hasta" class="panel__etiqueta">
            Acceso hasta
            <span v-if="!requiereVigencia(formulario.perfil)" class="panel__opcional"
              >(opcional)</span
            >
          </label>
          <input
            id="usuario-hasta"
            v-model="formulario.accesoHasta"
            type="date"
            class="panel__control"
            :class="{ 'panel__control--error': errores.accesoHasta }"
            :min="hoy"
          />
          <div v-if="errores.accesoHasta" class="panel__error">{{ errores.accesoHasta }}</div>
          <div v-else class="panel__ayuda">Al llegar la fecha, el acceso se desactiva solo.</div>
        </div>

        <q-btn
          unelevated
          no-caps
          color="primary"
          class="panel__boton"
          label="Guardar cambios"
          :disable="!hayCambios"
          :loading="actualizar.isPending.value"
          @click="guardar"
        />

        <div v-if="usuario.doble_factor" class="panel__ayuda">
          Tiene la verificación en dos pasos activa.
        </div>

        <div class="panel__acciones">
          <button
            v-if="puedeRestablecer"
            type="button"
            class="panel__secundario"
            :disabled="restablecer.isPending.value"
            @click="pedirMotivoYRestablecer"
          >
            Restablecer verificación en dos pasos
          </button>
          <button
            v-if="usuario.estado === 'pendiente'"
            type="button"
            class="panel__secundario"
            :disabled="reenviar.isPending.value"
            @click="reenviarInvitacion"
          >
            Reenviar invitación
          </button>
          <button
            v-if="usuario.estado !== 'desactivado'"
            type="button"
            class="panel__peligro"
            :disabled="actualizar.isPending.value"
            @click="cambiarActivo(false)"
          >
            Desactivar acceso
          </button>
          <button
            v-else
            type="button"
            class="panel__secundario"
            :disabled="actualizar.isPending.value"
            @click="cambiarActivo(true)"
          >
            Reactivar acceso
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError, type ApiError } from '@/core/api/errors';
import { colorAvatar, iniciales } from '@/core/theme/avatar';

import {
  useActualizarUsuario,
  useReenviarInvitacion,
  useRestablecerDobleFactor,
} from '../composables/useUsuarios';
import type { UsuarioCondominio } from '../services/usuarios.service';
import {
  cambiosUsuario,
  ESTADOS,
  formularioUsuarioDesde,
  hoyEcuador,
  PERFILES,
  requiereVigencia,
  textoRoles,
  validarUsuario,
  type FormularioUsuario,
} from '../usuarios.logica';

const props = defineProps<{ usuario: UsuarioCondominio }>();

const $q = useQuasar();
const actualizar = useActualizarUsuario();
const reenviar = useReenviarInvitacion();
const restablecer = useRestablecerDobleFactor();

const hoy = hoyEcuador();
const formulario = reactive<FormularioUsuario>(formularioUsuarioDesde(props.usuario));
const errores = reactive<Partial<Record<keyof FormularioUsuario, string>>>({});
const error = ref<ApiError | null>(null);

const color = computed(() => colorAvatar(props.usuario.id));
const ayudaPerfil = computed(
  () =>
    PERFILES.find((p) => p.valor === formulario.perfil)?.ayuda ??
    'Solo tiene cargos de directiva o es residente.',
);
const hayCambios = computed(
  () => Object.keys(cambiosUsuario(formulario, props.usuario)).length > 0,
);

// Cuando la lista se actualiza, el formulario parte de lo guardado; no pisa lo que se está editando
watch(
  () => props.usuario,
  (nuevo) => {
    if (!hayCambios.value) {
      Object.assign(formulario, formularioUsuarioDesde(nuevo));
    }
  },
);

function limpiar(): void {
  for (const campo of Object.keys(errores) as (keyof FormularioUsuario)[]) {
    delete errores[campo];
  }
  error.value = null;
}

async function ejecutar(accion: () => Promise<unknown>, mensaje: string): Promise<void> {
  limpiar();
  try {
    await accion();
    $q.notify({ type: 'positive', message: mensaje });
  } catch (e) {
    const apiError = aApiError(e);
    const fecha = apiError.campo('acceso_hasta');
    const perfil = apiError.campo('rol');
    if (fecha || perfil) {
      if (fecha) errores.accesoHasta = fecha;
      if (perfil) errores.perfil = perfil;
    } else {
      error.value = apiError;
    }
  }
}

async function guardar(): Promise<void> {
  limpiar();
  Object.assign(errores, validarUsuario(formulario, hoy));
  if (Object.keys(errores).length > 0) {
    return;
  }
  await ejecutar(
    () =>
      actualizar.mutateAsync({
        id: props.usuario.id,
        datos: cambiosUsuario(formulario, props.usuario),
      }),
    'Cambios guardados.',
  );
}

/** El administrador no restablece la suya ni la de otro administrador (lo hace la plataforma). */
const puedeRestablecer = computed(
  () =>
    props.usuario.doble_factor &&
    !props.usuario.es_yo &&
    !props.usuario.roles.includes('administrador'),
);

function pedirMotivoYRestablecer(): void {
  // Se toma la persona al abrir el diálogo, no al confirmar: si la lista cambia no se restablece otra
  const { id, nombre } = props.usuario;
  $q.dialog({
    title: 'Restablecer verificación en dos pasos',
    message: `${nombre} quedará sin verificación en dos pasos y deberá configurarla de nuevo. Escribe el motivo (queda registrado).`,
    prompt: { model: '', type: 'text', isValid: (valor: string) => valor.trim().length >= 3 },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Restablecer', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk((motivo: string) => {
    void ejecutar(
      () => restablecer.mutateAsync({ id, motivo: motivo.trim() }),
      'Verificación restablecida. Deberá configurarla de nuevo.',
    );
  });
}

function cambiarActivo(activo: boolean): void {
  const accion = () =>
    ejecutar(
      () => actualizar.mutateAsync({ id: props.usuario.id, datos: { activo } }),
      activo ? 'Acceso reactivado.' : 'Acceso desactivado.',
    );

  if (activo) {
    void accion();
    return;
  }
  // Quitar el acceso es lo único que no se deshace con un clic: se pide confirmar
  $q.dialog({
    title: 'Desactivar acceso',
    message: `${props.usuario.nombre} dejará de entrar a este condominio. Puedes reactivarlo cuando quieras.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Desactivar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => void accion());
}

async function reenviarInvitacion(): Promise<void> {
  await ejecutar(() => reenviar.mutateAsync(props.usuario.id), 'Invitación reenviada.');
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
}

.panel__cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--safic-linea);
}

.panel__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.panel__persona-textos {
  flex-grow: 1;
  min-width: 0;
}

.panel__nombre {
  font-size: 17px;
  font-weight: 800;
}

.panel__descripcion {
  font-size: 12px;
  color: var(--safic-texto-suave);
  overflow-wrap: anywhere;
}

.panel__cuerpo {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
}

.panel__dato {
  display: flex;
  gap: 12px;
}

.panel__dato-etiqueta {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.panel__dato strong {
  text-align: right;
}

.panel__nota {
  background: var(--safic-fondo-2);
  border: 1px solid var(--safic-linea);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--safic-texto-2);
  line-height: 1.45;
}

.panel__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel__etiqueta {
  font-weight: 700;
  color: var(--safic-texto-2);
}

.panel__opcional {
  font-weight: 600;
  color: var(--safic-texto-suave);
}

.panel__control {
  height: 42px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
  box-sizing: border-box;
  width: 100%;
}

.panel__control:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}

.panel__control--error {
  border-color: var(--q-negative);
}

.panel__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.panel__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
}

.panel__boton {
  height: 44px;
  border-radius: 10px;
  font-weight: 700;
}

.panel__acciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--safic-linea);
  padding-top: 14px;
}

.panel__secundario,
.panel__peligro {
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  background: #ffffff;
}

.panel__secundario {
  border: 1px solid var(--safic-borde-2);
  color: var(--safic-texto);
}

.panel__peligro {
  border: 1px solid #f3b8b2;
  color: #9b1c12;
}

.panel__secundario:disabled,
.panel__peligro:disabled {
  opacity: 0.5;
  cursor: default;
}

.panel__secundario:focus-visible,
.panel__peligro:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
</style>
