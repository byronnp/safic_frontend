<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 460px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Reenviar invitación</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              {{ nombre }} todavía no crea su contraseña para {{ condominio }}. Enviaremos un enlace
              nuevo (vale 7 días) y el anterior dejará de funcionar.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="ri-email" class="safic-campo__etiqueta">Correo</label>
            <q-input
              v-model="email"
              for="ri-email"
              class="safic-input"
              outlined
              type="email"
              autofocus
              hide-bottom-space
              :error="!!errorEmail"
              :error-message="errorEmail"
            />
            <div class="text-suave" style="font-size: 12px">
              Si el correo estaba mal, corrígelo aquí antes de reenviar.
            </div>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="reenviar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Reenviar invitación"
              :loading="reenviar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';
import { z } from 'zod';

import { aApiError } from '@/core/api/errors';

import { clavesPlataforma, useReenviarInvitacion } from '../composables/usePlataforma';
import type { AdministradorCondominio } from '../services/plataforma.service';

const props = defineProps<{
  condominioId: number;
  condominio: string;
  usuarioId: number;
  nombre: string;
  emailActual: string;
}>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<AdministradorCondominio>();

const email = ref(props.emailActual);
const errorEmail = ref<string | undefined>();
const errorGeneral = ref<string | null>(null);

const queryClient = useQueryClient();
const reenviar = useReenviarInvitacion();

async function enviar(): Promise<void> {
  errorEmail.value = undefined;
  errorGeneral.value = null;

  const limpio = email.value.trim().toLowerCase();
  if (!z.email().safeParse(limpio).success) {
    errorEmail.value = 'Escribe un correo válido.';
    return;
  }

  try {
    onDialogOK(
      await reenviar.mutateAsync({
        condominioId: props.condominioId,
        usuarioId: props.usuarioId,
        // Solo se envía si cambió: así no se pide validar un correo que ya es suyo
        email: limpio === props.emailActual.toLowerCase() ? null : limpio,
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    if (apiError.codigo === 'ADMINISTRADOR_ACTIVO') {
      // Ya creó su contraseña: la tarjeta deja de mostrar "Invitación pendiente"
      void queryClient.invalidateQueries({ queryKey: clavesPlataforma.condominios });
    }
    errorEmail.value = apiError.campo('email');
    if (!errorEmail.value) errorGeneral.value = apiError.mensaje;
  }
}
</script>
