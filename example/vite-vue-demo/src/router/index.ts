import { createRouter, createWebHistory } from "vue-router";
import views from "../views?dir2json&ext=.vue&lazy";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: views.HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: views.AboutView,
    },
  ],
});

export default router;
