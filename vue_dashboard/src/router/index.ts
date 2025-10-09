import { createRouter, createWebHistory } from "vue-router";
import Login from "../Views/Auth/Login.vue";
import Register from "../Views/Auth/Register.vue";
import Dashboard from '../Views/index.vue'





import { useAuthStore } from "../Store/AuthStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/Dashboard",
      name: "dashboard",
      component: Dashboard,
      meta: { requiresAuth: true },
    },

    

    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: Register,
      meta: { requiresGuest: true },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if ((to.meta as any).requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  return next()
})

export default router;
