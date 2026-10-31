<template>
  <router-view v-if="route.meta.publica" />
  <div v-else class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">◈</span>
        <div>
          <strong>GeoValor</strong>
          <small>Ofertas de mercado · Transacciones CBR · Tasaciones</small>
        </div>
      </div>
      <nav>
        <router-link to="/">Explorador</router-link>
        <router-link to="/plusvalia">Plusvalía</router-link>
        <router-link to="/tasaciones">
          Tasaciones
          <span v-if="!esAdmin" class="pill" :class="{ warn: saldoTasaciones < 5 }">{{ saldoTasaciones }}</span>
        </router-link>
        <router-link to="/cobertura">Cobertura</router-link>
        <router-link v-if="esAdmin" to="/admin">Panel de registro</router-link>
      </nav>
      <div class="user">
        <div class="user-info">
          <strong>{{ usuarioActual?.nombre }}</strong>
          <small>{{ esAdmin ? 'Usuario Administrador' : 'Usuario General' }}</small>
        </div>
        <button class="btn ghost sm" @click="salir">Salir</button>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { usuarioActual, esAdmin, saldoTasaciones, logout } from './store.js'

const route = useRoute()
const router = useRouter()

function salir() {
  logout()
  router.push('/login')
}
</script>
