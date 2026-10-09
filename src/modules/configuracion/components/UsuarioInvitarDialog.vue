<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 560px; max-width: 95vw">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Agregar persona al equipo</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Recibirá un correo para crear su contraseña. Los cargos de la directiva (presidente,
              secretario…) se asignan en la pestaña Directiva.
            </div>
          </div>

          <div v-if="error" class="safic-alerta" role="alert">
            {{ error.mensaje }}
            <router-link
              v-if="error.codigo === 'LIMITE_USUARIOS'"
              :to="{ name: 'configuracion-suscripcion' }"
              @click="onDialogCancel"
            >
              Subir de plan
            </router-link>
          </div>

          <div class="safic-campo">
            <label for="inv-rol" class="safic-campo__etiqueta">Perfil</label>
            <select id="inv-rol" v-model="formulario.rol" class="inv-control">
              <option v-for="p in PERFILES" :key="p.valor" :value="p.valor">
                {{ p.etiqueta }}
              </option>
            </select>
            <div class="inv-ayuda">
              {{ PERFILES.find((p) => p.valor === formulario.rol)?.ayuda }}
            </div>
          </div>

          <div class="safic-campo">
            <label for="inv-nombre" class="safic-campo__etiqueta">Nombre completo</label>
            <q-input
              v-model="formulario.nombre"
              for="inv-nombre"
              class="safic-input"
              outlined
              maxlength="120"
              autofocus
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="inv-par">
            <div class="safic-campo">
              <label for="inv-cedula" class="safic-campo__etiqueta">Cédula</label>
              <q-input
                v-model="formulario.cedula"
                for="inv-cedula"
                class="safic-input"
                outlined
                inputmode="numeric"
                maxlength="10"
                hide-bottom-space
                :error="!!errores.cedula"
                :error-message="errores.cedula"
              />
            </div>
            <div class="safic-campo">
              <label for="inv-celular" class="safic-campo__etiqueta">Celular (opcional)</label>
              <q-input
                v-model="formulario.celular"
                for="inv-celular"
                class="safic-input"
                outlined
                type="tel"
                maxlength="10"
                hide-bottom-space
                :error="!!errores.celular"
                :error-message="errores.celular"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="inv-email" class="safic-campo__etiqueta">Correo</label>
            <q-input
              v-model="formulario.email"
              for="inv-email"
              class="safic-input"
              outlined
              type="email"
              hide-bottom-space
              :error="!!errores.email"
              :error-message="errores.email"
            />
          </div>

          <div class="safic-campo">
            <label for="inv-hasta" class="safic-campo__etiqueta">
              Acceso hasta
              <span v-if="!requiereVigencia(formulario.rol)" class="inv-ayuda">(opcional)</span>
            </label>
            <input
              id="inv-hasta"
              v-model="formulario.accesoHasta"
              type="date"
              class="inv-control"
              :class="{ 'inv-control--error': errores.accesoHasta }"
              :min="hoy"
            />
            <div v-if="errores.accesoHasta" class="inv-error">{{ errores.accesoHasta }}</div>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="invitar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Enviar invitación"
              :loading="invitar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { reactive, ref } from 'vue';

import { aApiError, type ApiError } from '@/core/api/errors';

import { useInvitarUsuario } from '../composables/useUsuarios';
import type { UsuarioInvitado } from '../services/usuarios.service';
import {
  CAMPOS_API_INVITAR,
  FORMULARIO_INVITAR_VACIO,
  hoyEcuador,
  PERFILES,
  peticionInvitar,
  requiereVigencia,
  validarInvitar,
  type FormularioInvitar,
} from '../usuarios.logica';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<UsuarioInvitado>();
const $q = useQuasar();
const invitar = useInvitarUsuario();

const hoy = hoyEcuador();
const formulario = reactive<FormularioInvitar>({ ...FORMULARIO_INVITAR_VACIO });
const errores = reactive<Partial<Record<keyof FormularioInvitar, string>>>({});
const error = ref<ApiError | null>(null);

async function guardar(): Promise<void> {
  for (const campo of Object.keys(errores) as (keyof FormularioInvitar)[]) {
    delete errores[campo];
  }
  error.value = null;

  Object.assign(errores, validarInvitar(formulario, hoy));
  if (Object.keys(errores).length > 0) {
    return;
  }

  try {
    const persona = await invitar.mutateAsync(peticionInvitar(formulario));
    $q.notify({
      type: 'positive',
      message: persona.invitacion_enviada
        ? `Invitación enviada a ${persona.email}.`
        : `${persona.nombre} ya tenía cuenta y se sumó al equipo.`,
    });
    onDialogOK(persona);
  } catch (e) {
    const apiError = aApiError(e);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_INVITAR)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        errores[campo] = mensaje;
        pintado = true;
      }
    }
    if (!pintado) {
      // LIMITE_USUARIOS, USUARIO_YA_EXISTE, CEDULA_EN_USO…: el mensaje ya viene en español
      error.value = apiError;
    }
  }
}
</script>

<style scoped>
.inv-par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.inv-control {
  height: 44px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  background: #ffffff;
  box-sizing: border-box;
  width: 100%;
}

.inv-control:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}

.inv-control--error {
  border-color: var(--q-negative);
}

.inv-ayuda {
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-texto-suave);
}

.inv-error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
}

@media (max-width: 599px) {
  .inv-par {
    grid-template-columns: 1fr;
  }
}
</style>
