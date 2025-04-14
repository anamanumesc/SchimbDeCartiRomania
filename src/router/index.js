import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import SignUpPage from '@/pages/SignUpPage.vue';
import RequestsPage from '@/pages/RequestsPage.vue';
import ContPage from '@/pages/AccountPage.vue';
import AdaugaCartePage from '@/pages/AddBookPage.vue';

const routes = [
  { path: '/', component: LoginPage },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/home', component: HomePage },
  { path: '/requests', component: RequestsPage },
  { path: '/cont', component: ContPage },
  { path: '/adauga', component: AdaugaCartePage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
