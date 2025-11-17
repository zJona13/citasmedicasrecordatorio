import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Inicializar tema al cargar la aplicación
const initializeTheme = () => {
  // Verificar si hay un tema guardado en localStorage
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // Si no hay tema guardado, usar las preferencias del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
};

// Inicializar tema antes de renderizar
initializeTheme();

// Escuchar cambios en las preferencias del sistema (opcional)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // Solo aplicar si no hay un tema guardado manualmente
  if (!localStorage.getItem('theme')) {
    if (e.matches) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
