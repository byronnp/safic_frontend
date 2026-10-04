<template>
  <div class="column" style="gap: 20px">
    <div v-if="invitacion.isLoading.value" class="column" style="gap: 12px" aria-busy="true">
      <q-skeleton type="text" width="60%" height="40px" />
      <q-skeleton type="text" width="90%" />
      <q-skeleton type="rect" height="50px" />
      <q-skeleton type="rect" height="50px" />
    </div>

    <template v-else-if="invitacion.isError.value">
      <div>
        <h2 class="invitacion__titulo">Enlace no válido</h2>
        <p class="invitacion__subtitulo">{{ invitacion.error.value?.mensaje }}</p>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="safic-btn safic-btn--grande full-width"
        label="Ir a iniciar sesión"
        :to="{ name: 'login' }"
      />
    </template>

    <template v-else-if="invitacion.data.value">
      <div>
        <h2 class="invitacion__titulo">Hola, {{ primerNombre }}</h2>
        <p class="invitacion__subtitulo">
          Crea tu contraseña para entrar a <strong>{{ invitacion.data.value.condominio }}</strong
          >.
        </p>
      </div>

      <q-form novalidate class="column" style="gap: 20px" @submit="crear">
        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

        <div class="safic-campo">
          <label for="correo" class="safic-campo__etiqueta">Correo</label>
          <q-input
            for="correo"
            class="safic-input"
            outlined
            readonly
            :model-value="invitacion.data.value.email"
            autocomplete="username"
          />
        </div>

        <div class="safic-campo">
          <label for="password" class="safic-campo__etiqueta">Contraseña nueva</label>
          <q-input
            v-model="formulario.password"
            for="password"
            class="safic-input"
            outlined
            :type="ver ? 'text' : 'password'"
            autocomplete="new-password"
            hide-bottom-space
            :error="!!errores.password"
            :error-message="errores.password"
            autofocus
          >
            <template #append>
              <q-btn
                flat
                round
                dense
                :icon="ver ? 'sym_r_visibility_off' : 'sym_r_visibility'"
                :aria-label="ver ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                style="color: var(--safic-texto-suave)"
                @click="ver = !ver"
              />
            </template>
          </q-input>
          <div class="invitacion__ayuda">Al menos 10 caracteres, con letras y números.</div>
        </div>

        <div class="safic-campo">
          <label for="confirmacion" class="safic-campo__etiqueta">Repite la contraseña</label>
          <q-input
            v-model="formulario.confirmacion"
            for="confirmacion"
            class="safic-input"
            outlined
            :type="ver ? 'text' : 'password'"
            autocomplete="new-password"
            hide-bottom-space
            :error="!!errores.confirmacion"
            :error-message="errores.confirmacion"
          />
        </div>

        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="safic-btn safic-btn--grande full-width"
          label="Crear contraseña y entrar"
          :loading="enviando"
        />
      </q-form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

import { aApiError, type ApiError } from '@/core/api/errors';
import { authService, type Invitacion } from '@/core/auth/auth.service';
import { destinoSinCondominio } from '@/router/guards';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const token = computed(() => String(route.params.token ?? ''));

const invitacion = useQuery<Invitacion, ApiError>({
  queryKey: computed(() => ['invitacion', token.value]),
  queryFn: () => authService.verInvitacion(token.value),
  retry: false,
});

const primerNombre = computed(() => invitacion.data.value?.nombre.split(/\s+/)[0] ?? '');

const esquema = z
  .object({
    password: z
      .string()
      .min(10, 'Al menos 10 caracteres.')
      .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'Incluye al menos una letra.')
      .regex(/\d/, 'Incluye al menos un número.'),
    confirmacion: z.string(),
  })
  .refine((v) => v.password === v.confirmacion, {
    path: ['confirmacion'],
    message: 'Las contraseñas no coinciden.',
  });

const formulario = reactive({ password: '', confirmacion: '' });
const errores = reactive<{ password: string | undefined; confirmacion: string | undefined }>({
  password: undefined,
  confirmacion: undefined,
});
const errorGeneral = ref<string | null>(null);
const enviando = ref(false);
const ver = ref(false);

async function crear(): Promise<void> {
  errores.password = undefined;
  errores.confirmacion = undefined;
  errorGeneral.value = null;

  const validacion = esquema.safeParse(formulario);
  if (!validacion.success) {
    for (const problema of validacion.error.issues) {
      const campo = problema.path[0];
      if (campo === 'password' || campo === 'confirmacion') {
        errores[campo] ??= problema.message;
      }
    }
    return;
  }

  enviando.value = true;
  try {
    const email = await authService.aceptarInvitacion(
      token.value,
      formulario.password,
      formulario.confirmacion,
    );
    await session.iniciarSesion(email, formulario.password);
    await router.replace(
      session.condominioId === null ? destinoSinCondominio(session) : { name: 'inicio' },
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.password = apiError.campo('password');
    if (!errores.password) {
      errorGeneral.value = apiError.mensaje;
    }
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.invitacion__titulo {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.invitacion__subtitulo {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: var(--safic-texto-suave);
}

.invitacion__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
