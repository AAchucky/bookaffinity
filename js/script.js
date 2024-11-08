import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC49f2C4PSkNlecDEOpMqX4Y8-bYMp7vbM",
  authDomain: "prueba-d332d.firebaseapp.com",
  projectId: "prueba-d332d",
  storageBucket: "prueba-d332d.appspot.com",
  messagingSenderId: "249157786292",
  appId: "1:249157786292:web:0ad02cb18a1950a93395e1"
};

const booksApiKey = "AIzaSyAkHxgGGfljlPKGwom22nxZ9DMKuZtHDrQ";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let usuarioLogueado = false;

document.addEventListener("DOMContentLoaded", () => {
  // Verificar estado de autenticación al cargar la página
  onAuthStateChanged(auth, (user) => {
    const usuarioElemento = document.getElementById("usuario-estado");
    if (usuarioElemento) { // Asegurarse de que el elemento existe antes de usarlo
      if (user) {
        usuarioLogueado = true;
        usuarioElemento.innerText = `Usuario: ${user.displayName || "Desconocido"}`;
      } else {
        usuarioLogueado = false;
        usuarioElemento.innerText = "Usuario: invitado";
      }
    }
  });

  async function cargarLibros(url, containerId) {
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

  async function cargarNovedades() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`;
    cargarLibros(url, "novedades-container");
    gestionarDesplazamientoLateral("novedades-container", "btn-left", "btn-right");
  }

  async function cargarRecomendaciones() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=${booksApiKey}`;
    cargarLibros(url, "recomendaciones-container");
    gestionarDesplazamientoLateral("recomendaciones-container", "btn-left-recomendaciones", "btn-right-recomendaciones");
  }

  function gestionarDesplazamientoLateral(containerId, leftBtnId, rightBtnId) {
    const container = document.getElementById(containerId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);

    if (leftBtn && rightBtn) {
      leftBtn.style.display = "block";
      rightBtn.style.display = "block";
      leftBtn.addEventListener("click", () => {
        container.scrollBy({ top: 0, left: -300, behavior: "smooth" });
      });
      rightBtn.addEventListener("click", () => {
        container.scrollBy({ top: 0, left: 300, behavior: "smooth" });
      });
    } else {
      console.error(`Botones con IDs ${leftBtnId} y ${rightBtnId} no encontrados.`);
    }
  }

  function mostrarLibros(libros, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    libros.forEach(libro => {
      const libroDiv = document.createElement("div");
      libroDiv.classList.add("libro");

      const titulo = libro.volumeInfo.title;
      const autor = libro.volumeInfo.authors ? libro.volumeInfo.authors.join(', ') : 'Autor desconocido';
      const descripcion = libro.volumeInfo.description || 'Descripción no disponible';
      const portada = libro.volumeInfo.imageLinks ? libro.volumeInfo.imageLinks.thumbnail : 'https://books.google.com/googlebooks/images/no_cover_thumb.gif';
      const infoLink = libro.volumeInfo.infoLink;
      const bookId = libro.id;

      libroDiv.innerHTML = `
        <img src="${portada}" alt="Portada del libro">
        <h3>${titulo}</h3>
        <p>${descripcion}</p>
        <p><strong>Autor:</strong> ${autor}</p>
      `;

      libroDiv.addEventListener("click", () => {
        abrirModal(titulo, autor, descripcion, portada, infoLink, bookId);
      });

      container.appendChild(libroDiv);
    });
  }

  cargarNovedades();
  cargarRecomendaciones();
});
