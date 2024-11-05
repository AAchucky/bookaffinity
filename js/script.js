import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "prueba-d332d.firebaseapp.com",
  projectId: "prueba-d332d",
  storageBucket: "prueba-d332d.appspot.com",
  messagingSenderId: "249157786292",
  appId: "1:249157786292:web:0ad02cb18a1950a93395e1"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      cargarBiblioteca(user.uid);
    }
  });

  async function cargarLibros(url, containerId) {
    const response = await fetch(url);
    const data = await response.json();
    mostrarLibros(data.items, containerId);
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

      libroDiv.addEventListener("click", () => abrirModal(titulo, autor, descripcion, portada, infoLink, bookId));
      container.appendChild(libroDiv);
    });

    gestionarDesplazamientoLateral(containerId, `btn-left-${containerId}`, `btn-right-${containerId}`);
  }

  async function abrirModal(titulo, autor, descripcion, portada, infoLink, bookId) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-author").innerText = autor;
    document.getElementById("modal-description").innerText = descripcion;
    document.getElementById("modal-image").src = portada;
    document.getElementById("modal-link").href = infoLink;

    // Configurar el enlace para agregar a biblioteca
    const addToLibraryLink = document.getElementById("modal-add-to-biblioteca-link");
    addToLibraryLink.setAttribute("data-book-id", bookId);
    addToLibraryLink.onclick = (event) => {
      event.preventDefault();
      guardarEnBiblioteca(bookId);
    };

    document.getElementById("book-modal").style.display = "flex";
  }

  async function guardarEnBiblioteca(bookId) {
    const user = auth.currentUser;
    if (!user) {
      alert("Inicia sesión para guardar libros en tu Biblioteca.");
      return;
    }

    const bibliotecaRef = doc(db, "Biblioteca", user.uid);
    try {
      await updateDoc(bibliotecaRef, { libros: arrayUnion(bookId) });
      alert("Libro añadido a tu Biblioteca.");
    } catch (error) {
      console.error("Error al añadir a la biblioteca: ", error);
    }
  }

  async function cargarBiblioteca(userId) {
    const bibliotecaRef = doc(db, "Biblioteca", userId);
    const bibliotecaSnapshot = await getDoc(bibliotecaRef);

    const container = document.getElementById("biblioteca-container");
    container.innerHTML = ""; 

    if (bibliotecaSnapshot.exists()) {
      const biblioteca = bibliotecaSnapshot.data().libros || [];
      biblioteca.forEach(async (bookId) => {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}?key=${booksApiKey}`);
        const data = await response.json();
        mostrarLibros([data], "biblioteca-container");
      });
    }
  }

  async function buscarLibros(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${booksApiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    const searchSection = document.getElementById("search-results-section");

    if (data.items) {
      mostrarLibros(data.items, "resultados-busqueda-container");
      searchSection.style.display = "flex";
    } else {
      searchSection.style.display = "none";
      document.getElementById("resultados-busqueda-container").innerHTML = "<p>No se encontraron libros.</p>";
    }
  }

  function gestionarDesplazamientoLateral(containerId, leftBtnId, rightBtnId) {
    const container = document.getElementById(containerId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);

    leftBtn.addEventListener("click", () => {
      container.scrollBy({ top: 0, left: -300, behavior: "smooth" });
    });
    rightBtn.addEventListener("click", () => {
      container.scrollBy({ top: 0, left: 300, behavior: "smooth" });
    });
  }

  cargarLibros(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`, "novedades-container");
  cargarLibros(`https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=${booksApiKey}`, "recomendaciones-container");

  document.getElementById("search-button").addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) buscarLibros(query);
    else alert("Por favor, ingresa un término de búsqueda.");
  });

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("book-modal").style.display = "none";
  });

  function updateStarRating(rating) {
    const starsElement = document.getElementById('star-rating');
    starsElement.innerHTML = '';

    if (rating === 'N/A' || rating === null || rating === undefined) {
      for (let i = 0; i < 10; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.innerHTML = '&#9734;';
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
