<template>
  <!-- Aviso de privacidad (LOPDP). BORRADOR hasta la revisión legal del plan (4 dic 2026):
       al publicar el texto definitivo se cambia SAFIC_AVISO_PRIVACIDAD_VERSION en el backend. -->
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="safic-dialogo aviso">
      <div class="q-pa-lg column" style="gap: 14px">
        <div>
          <div class="safic-dialogo__titulo">Aviso de privacidad</div>
          <div class="text-suave q-mt-xs" style="font-size: 13px">Versión {{ version }}</div>
        </div>

        <div class="aviso__borrador" role="note">
          Borrador pendiente de revisión legal. El texto definitivo se publicará antes del uso con
          datos reales.
        </div>

        <div class="aviso__texto">
          <p>
            <strong>Quién trata tus datos.</strong> La administración de tu condominio es
            responsable de tus datos; SAFIC los trata por encargo suyo para prestar el servicio.
          </p>
          <p>
            <strong>Qué datos.</strong> Nombres, documento de identidad, correo, celular, la unidad
            con la que te relacionas y, según el uso, vehículos, mascotas, pagos y registros de
            acceso.
          </p>
          <p>
            <strong>Para qué.</strong> Administrar el condominio: identificar a propietarios,
            inquilinos y residentes, cobrar cuotas, controlar accesos y comunicar avisos. No se
            venden ni se usan para publicidad.
          </p>
          <p>
            <strong>Quién los ve.</strong> Solo las personas con un rol que lo necesita. La
            guardianía y la directiva ven tu documento, teléfono y correo enmascarados.
          </p>
          <p>
            <strong>Seguridad y conservación.</strong> El documento y el teléfono se guardan
            cifrados. Los datos se conservan mientras tengas relación con el condominio y lo que
            exija la ley.
          </p>
          <p>
            <strong>Tus derechos (LOPDP).</strong> Puedes pedir acceso, rectificación, eliminación,
            oposición y portabilidad de tus datos a la administración de tu condominio.
          </p>
        </div>

        <div class="row justify-end">
          <q-btn
            color="primary"
            unelevated
            no-caps
            class="safic-btn"
            label="Entendido"
            @click="onDialogOK()"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

defineProps<{ version: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>

<style scoped>
.aviso {
  width: 560px;
  max-width: 100%;
}

.aviso__borrador {
  padding: 10px 12px;
  border-radius: var(--safic-radio-control);
  background: #fff7ec;
  border: 1px solid #f1d6ae;
  color: #8a3f0a;
  font-size: 13px;
  font-weight: 600;
}

.aviso__texto {
  max-height: 50vh;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.5;
  color: var(--safic-texto-2);
}

.aviso__texto p {
  margin: 0 0 10px 0;
}
</style>
