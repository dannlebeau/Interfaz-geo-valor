<template>
  <div class="login">
    <form class="card" @submit.prevent="entrar">
      <div class="head">
        <span class="logo">◈</span>
        <h1>GeoValor</h1>
        <p class="muted">Plataforma georreferenciada de ofertas de mercado inmobiliario y transacciones registradas en Conservadores de Bienes Raíces.</p>
      </div>
      <label class="field">Usuario<input v-model="usuario" autocomplete="username" required autofocus /></label>
      <label class="field">Clave de acceso<input v-model="clave" type="password" autocomplete="current-password" required /></label>
      <div v-if="error" class="alert err">{{ error }}</div>
      <button class="btn block" :disabled="cargando">{{ cargando ? 'Validando…' : 'Ingresar' }}</button>
      <details class="demo">
        <summary>Credenciales de demostración</summary>
        <p>Usuario General: <code>usuario1</code> … <code>usuario8</code> · clave <code>Demo2026!</code></p>
        <p>Usuario Administrador: <code>admin1</code> … <code>admin4</code> · clave <code>Admin2026!</code></p>
      </details>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../store.js'

const router = useRouter()
const route = useRoute()
const usuario = ref('')
const clave = ref('')
const error = ref('')
const cargando = ref(false)

async function entrar() {
  error.value = ''
  cargando.value = true
  try {
    await login(usuario.value, clave.value)
    router.push(route.query.r || '/')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100%; display: grid; place-items: center; padding: 1rem;
  background: linear-gradient(135deg, #0f3d5e 0%, #1f6fb2 100%);
}
form { width: min(400px, 100%); display: flex; flex-direction: column; gap: 0.9rem; padding: 1.8rem; }
.head { text-align: center; }
.logo { font-size: 2.4rem; color: var(--primary-2); }
.head p { font-size: 0.85rem; margin: 0.4rem 0 0; }
.demo { font-size: 0.8rem; color: var(--muted); }
.demo summary { cursor: pointer; }
.demo p { margin: 0.35rem 0; }
code { background: var(--surface-2); padding: 0 0.25rem; border-radius: 3px; }
</style>
