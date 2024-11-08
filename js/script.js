import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = { /*... Firebase Config ...*/ };
const booksApiKey = "YOUR_BOOKS_API_KEY";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  // Estado del Usuario
  onAuthStateChanged(auth, (user) => {
    const userNameElement = document.getElementById("user-name");
    if (user) {
      userNameElement.innerText = `Usuario: ${user.displayName || "Desconocido"}`;
      const logoutButton = document.createElement("button");
      logoutButton.innerText = "Cerrar sesión";
      logoutButton.addEventListener("click", () => signOut(auth).then(() => location.reload()));
      userNameElement.appendChild(logoutButton);
    }
  });

  // Buscar Libros
  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) buscarLibros(query);
  });

  // Modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("book-modal").style.display = "none";
  });

  // Cargar novedades y recomendaciones
  cargarLibros("novedades-container", `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`);
  cargarLibros("recomendaciones-container", `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&key=${booksApiKey}&maxResults=10`);

  async function buscarLibros(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${booksApiKey}&maxResults=10`;
    cargarLibros("resultados-busqueda-container", url);
    document.getElementById("search-results-title").style.display = "block";
  }

  function mostrarLibros(libros, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    libros.forEach((libro) => {
      const divLibro = document.createElement("div");
      divLibro.classList.add("libro");
      divLibro.innerHTML = `
        <img src="${libro.volumeInfo.imageLinks?.thumbnail || 'https://books.google.com/googlebooks/images/no_cover_thumb.gif'}" alt="Portada">
        <h3>${libro.volumeInfo.title}</h3>
        <p>${libro.volumeInfo.authors?.join(", ") || "Autor desconocido"}</p>
      `;
      divLibro.addEventListener("click", () => abrirModal(libro));
      container.appendChild(divLibro);
    });
  }

  function abrirModal(libro) {
    document.getElementById("modal-title").innerText = libro.volumeInfo.title;
    document.getElementById("modal-author").innerText = libro.volumeInfo.authors?.join(", ") || "Autor desconoc
