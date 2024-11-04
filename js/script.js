import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC49f2C4PSkNlecDEOpMqX4Y8-bYMp7vbM",
  authDomain: "prueba-d332d.firebaseapp.com",
  projectId: "prueba-d332d",
  storageBucket: "prueba-d332d.appspot.com",
  messagingSenderId: "249157786292",
  appId: "1:249157786292:web:0ad02cb18a1950a93395e1"
};

// Clave de API para Google Books
const booksApiKey = "AIzaSyAkHxgGGfljlPKGwom22nxZ9DMKuZtHDrQ";

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  // Función para cargar libros en un contenedor específico
  async function cargarLibros(url, containerId) {
    const response = await fetch(url);
    const data = await response.json();
    const libros = data.items;

    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Limpiar contenedor

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

      libroDiv.addEventListener("click", async () => {
        abrirModal(titulo, autor, descripcion, portada, infoLink, bookId);
      });

      container.appendChild(libroDiv);
    });
  }

  // Función para abrir el modal con detalles del libro
  async function abrirModal(titulo, autor, descripcion, portada, infoLink, bookId) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-author").innerText = autor;
    document.getElementById("modal-description").innerText = descripcion;
    document.getElementById("modal-image").src = portada;
    document.getElementById("modal-link").href = infoLink;

    document.getElementById("modal-review-link").href = `agregarReseña.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
    document.getElementById("modal-view-reviews-link").href = `muestraResenas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;

    const reviewsSnapshot = await getDocs(query(collection(db, "Resenas"), where("libro_id", "==", bookId)));
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalScore = reviews.reduce((sum, review) => sum + review.puntuacion, 0);
      averageRating = (totalScore / reviews.length).toFixed(1);
      document.getElementById("average-rating").innerText = averageRating;
    } else {
      document.getElementById("average-rating").innerText = "N/A";
    }

    updateStarRating(averageRating);

    const voteCounts = Array(10).fill(0);
    if (reviews && reviews.length > 0) {
      reviews.forEach(review => voteCounts[review.puntuacion - 1]++);
    }

    const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
    const totalVotesElement = document.getElementById("total-votes");
    if (totalVotesElement) {
      totalVotesElement.innerText = `Total de Votos: ${totalVotes}`;
    } else {
      console.error('Elemento con ID total-votes no encontrado');
    }

    document.getElementById("book-modal").style.display = "flex";
  }

  // Función de búsqueda de libros en Google Books
  async function buscarLibros(query) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${booksApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.items) {
        mostrarLibros(data.items, "resultados-busqueda-container");
      } else {
        document.getElementById("resultados-busqueda-container").innerHTML = "<p>No se encontraron libros.</p>";
      }
    } catch (error) {
      console.error("Error al buscar libros:", error);
    }
  }

  // Cargar libros al iniciar la página
  async function cargarNovedades() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`;
    cargarLibros(url, "novedades-container");
  }

  async function cargarRecomendaciones() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=${booksApiKey}`;
    cargarLibros(url, "recomendaciones-container");
  }

  cargarNovedades();
  cargarRecomendaciones();

  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
      buscarLibros(query);
    } else {
      alert("Por favor, ingresa un término de búsqueda.");
    }
  });

  const containers = [
    { container: document.getElementById('novedades-container'), leftBtn: document.getElementById('btn-left'), rightBtn: document.getElementById('btn-right') },
    { container: document.getElementById('recomendaciones-container'), leftBtn: document.getElementById('btn-left-recomendaciones'), rightBtn: document.getElementById('btn-right-recomendaciones') }
  ];

  containers.forEach(({ container, leftBtn, rightBtn }) => {
    leftBtn.addEventListener('click', () => {
      container.scrollBy({
        top: 0,
        left: -300,
        behavior: 'smooth'
      });
    });

    rightBtn.addEventListener('click', () => {
      container.scrollBy({
        top: 0,
        left: 300,
        behavior: 'smooth'
      });
    });
  });

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("book-modal").style.display = "none";
  });

  function updateStarRating(rating) {
    const starsElement = document.getElementById('star-rating');
    starsElement.innerHTML = ''; // Limpiar contenido previo

    if (rating === 'N/A' || rating === null || rating === undefined) {
      for (let i = 0; i < 10; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.innerHTML = '&#9734;'; // Estrella vacía
        starsElement.appendChild(star);
      }
      return;
    }

    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;

    for (let i = 0; i < 10; i++) {
      const star = document.createElement('span');
      star.className = 'star';

      if (i < fullStars) {
        star.classList.add('filled');
        star.innerHTML = '&#9733;';
      } else if (i === fullStars && halfStar) {
        star.innerHTML = '&#9734;';
      } else {
        star.innerHTML = '&#9734;';
      }

      starsElement.appendChild(star);
    }
  }
});
