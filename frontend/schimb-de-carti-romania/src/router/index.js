import { createRouter, createWebHistory } from 'vue-router';
import { isLoggedIn } from '@/services/auth';
import HomePage from '@/pages/HomePage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import SignUpPage from '@/pages/SignUpPage.vue';
import MyRequestsPage from '@/pages/MyRequestsPage.vue';
import ContPage from '@/pages/AccountPage.vue';
import AdaugaCartePage from '@/pages/AddBookPage.vue';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.vue';
import BookPage from '@/pages/BookPage.vue';
import PublicProfilePage from '@/pages/PublicProfilePage.vue';
import ProposeExchangePage from '@/pages/ProposeExchangePage.vue';
import ResetPasswordPage from "@/pages/ResetPasswordPage.vue";
//import ManageExchangesPage from '@/pages/ManageExchangesPage.vue'; // Adaugă această linie

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/forgot-password', component: ForgotPasswordPage },
  {
     path: '/requests',
     component: MyRequestsPage,
    meta: { requiresAuth: true }
  },
  // Adaugă ruta pentru gestionarea schimburilor
  {
     path: '/exchanges',
     component: MyRequestsPage,
    meta: { requiresAuth: true }
  },
  {
     path: '/account',
     component: ContPage,
    meta: { requiresAuth: true }
  },
  {
     path: '/add',
     component: AdaugaCartePage,
    meta: { requiresAuth: true }
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordPage,
  },
  { path: '/book/:id', component: BookPage },
  { path: '/profile/:id', component: PublicProfilePage },
  {
     path: '/book/:id/propose',
     component: ProposeExchangePage,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check if user is authenticated
router.beforeEach((to, from, next) => {
  // Check if the route requires authentication
  if (to.meta.requiresAuth && !isLoggedIn()) {
    // Redirect to login page if not authenticated
    next('/login');
  } else {
    // Continue navigation
    next();
  }
});

export default router;