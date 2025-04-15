import { createRouter, createWebHistory } from 'vue-router';
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

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/forgot-password', component: ForgotPasswordPage },
  { path: '/requests', component: MyRequestsPage },
  { path: '/account', component: ContPage },
  { path: '/add', component: AdaugaCartePage },
  { path: '/book/:id', component: BookPage },
  { path: '/profile/:id', component: PublicProfilePage },
  { path: '/book/:id/propose', component: ProposeExchangePage }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
