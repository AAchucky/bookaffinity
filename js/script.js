import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC49f2C4PSkNlecDEOpMqX4Y8-bYMp7vbM",
  authDomain: "prueba-d332d.firebaseapp.com",
  projectId: "prueba-d332d",
  storageBucket: "prueba-d332d.appspot.com",
  messagingSenderId: "249157786292",
  appId: "1:249157786292:web:0ad02cb18a1950a93395e1"
};

const booksApiKey = "AIzaSyAkHxgGGfljlPKGwom22nxZ9DMKuZtHDrQ";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  // Verificar estado de autenticación
  onAuthStateChanged(auth, (user) => {
    const usuarioElemento = document.getElementById("user-name");
    if (usuarioElemento) {
      if (user) {
        usuarioElemento.innerText = `Usuario: ${user.displayName || "Desconocido"}`;
        crearBotonCerrarSesion();
      } else {
        usuarioElemento.innerText = "Usuario: invitado";
      }
    }
  });

  // Función para crear el botón de cerrar sesión
  function crearBotonCerrarSesion() {
    const logoutButton = document.createElement("button");
    logoutButton.innerText = "Cerrar sesión";
    logoutButton.addEventListener("click", () => {
      signOut(auth).then(() => {
        location.reload(); // Recargar la página para mostrar el estado de invitado
      }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
    });
    document.getElementById("user-name").appendChild(logoutButton);
  }

  // Función para buscar libros
  async function buscarLibros(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${booksApiKey}&maxResults=10`;
    cargarLibros("resultados-busqueda-container", url);
    document.getElementById("search-results-title").style.display = "block";
  }

  // Función para cargar libros
  async function cargarLibros(containerId, url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items) {
        mostrarLibros(data.items, containerId);
      } else {
        document.getElementById(containerId).innerHTML = "<p>No se encontraron libros.</p>";
      }
    } catch (error) {
      console.error("Error al cargar libros:", error);
    }
  }

  // Función para mostrar los libros
  function mostrarLibros(libros, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    libros.forEach(libro => {
      const libroDiv = document.createElement("div");
      libroDiv.classList.add("libro");
      const { title, authors, description, imageLinks, infoLink } = libro.volumeInfo;
      const portada = imageLinks ? imageLinks.thumbnail : 'https://books.google.com/googlebooks/images/no_cover_thumb.gif';

      libroDiv.innerHTML = `
        <img src="${portada}" alt="Portada del libro">
        <h3>${title}</h3>
        <p>${description || 'Descripción no disponible'}</p>
        <p><strong>Autor:</strong> ${authors ? authors.join(', ') : 'Autor desconocido'}</p>
      `;

      libroDiv.addEventListener("click", () => abrirModal(title, authors, description, portada, infoLink));
      container.appendChild(libroDiv);
    });
  }

  // Función para abrir el modal con información del libro
  function abrirModal(titulo, autor, descripcion, portada, infoLink) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-author").innerText = autor.join(', ');
    document.getElementById("modal-description").innerText = descripcion || "Descripción no disponible";
    document.getElementById("modal-image").src = portada;
    document.getElementById("modal-link").href = infoLink;
    document.getElementById("book-modal").style.display = "block";
  }

  // Cerrar el modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("book-modal").style.display = "none";
  });

  // Vincular la búsqueda con el botón
  document.getElementById("search-button").addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
      buscarLibros(query);
    } else {
      alert("Por favor, ingresa un término de búsqueda.");
    }
  });

  // Cargar novedades y recomendaciones
  cargarLibros("novedades-container", `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`);
  cargarLibros("recomendaciones-container", `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=${booksApiKey}`);
});
