function alternarTema() {
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  
  const isLightTheme = body.classList.toggle("light-theme");

  localStorage.setItem("espartano2_theme", isLightTheme ? "light" : "dark");

  if (themeToggle) {
    if (isLightTheme) {
      themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
      themeToggle.title = "Alternar para Tema Escuro";
    } else {
      themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
      themeToggle.title = "Alternar para Tema Claro";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("espartano2_theme");
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");

  if (savedTheme === "light") {
    body.classList.add("light-theme");
  }

  if (themeToggle) {
    if (body.classList.contains("light-theme")) {
      themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
      themeToggle.title = "Alternar para Tema Escuro";
    } else {
      themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
      themeToggle.title = "Alternar para Tema Claro";
    }
  }
});
