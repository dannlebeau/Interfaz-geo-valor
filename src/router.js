import { createRouter, createWebHashHistory } from 'vue-router'
import { usuarioActual, esAdmin } from './store.js'
import LoginView from './views/LoginView.vue'
import ExploradorView from './views/ExploradorView.vue'
import PlusvaliaView from './views/PlusvaliaView.vue'
import TasacionView from './views/TasacionView.vue'
import CoberturaView from './views/CoberturaView.vue'
import AdminView from './views/AdminView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { publica: true } },
    { path: '/', component: ExploradorView, meta: { titulo: 'Explorador' } },
    { path: '/plusvalia', component: PlusvaliaView, meta: { titulo: 'Plusvalía' } },
    { path: '/tasaciones', component: TasacionView, meta: { titulo: 'Tasaciones online' } },
    { path: '/cobertura', component: CoberturaView, meta: { titulo: 'Cobertura' } },
    { path: '/admin', component: AdminView, meta: { titulo: 'Panel de registro', admin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.publica && !usuarioActual.value) return { path: '/login', query: { r: to.fullPath } }
  if (to.meta.admin && !esAdmin.value) return '/'
  if (to.path === '/login' && usuarioActual.value) return '/'
})

export default router
