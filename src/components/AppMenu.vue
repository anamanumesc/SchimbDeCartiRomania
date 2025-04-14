=<template>
  <nav class="menu">
    <ul class="menu-list">
      <li><router-link to="/"><i class="fas fa-home"></i> Acasă</router-link></li>
      <li><router-link to="/requests"><i class="fas fa-hand-paper"></i> Cereri</router-link></li>
      <li><router-link to="/adauga"><i class="fas fa-plus-circle"></i> Adaugă carte</router-link></li>
      <li><router-link to="/cont"><i class="fas fa-user"></i> Contul meu</router-link></li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'AppMenu',
}
</script>

<style scoped>
.menu {
  background-color: #1a1a1a;
  color: white;
  padding: 16px 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: 'Arial', sans-serif;
}

.menu-list {
  display: flex;
  justify-content: center;
  gap: 32px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-list li {
  position: relative;
}

.menu-list a {
  text-decoration: none;
  color: inherit;
  padding: 12px 25px;
  border-radius: 30px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
}

.menu-list a:hover {
  background-color: #f4f4f4;
  color: #333;
  transform: translateY(-4px); /* subtle lift effect */
}

.menu-list a i {
  font-size: 18px;
}

.menu-list a:hover i {
  color: #ff6347; /* Adding color change on hover for icons */
}
</style>
