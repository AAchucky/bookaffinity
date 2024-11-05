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

  async function cargarLibros(url, containerId) {
    const response = await fetch(url);
    const data = await response.json();
    mostrarLibros(data.items, containerId);
  }

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

    document.getElementById("add-to-biblioteca").addEventListener("click", () => {
    const bookId = document.getElementById("modal").getAttribute("data-book-id");
    guardarEnBiblioteca(bookId);
    });
  }

  async function cargarBiblioteca() {
  const user = auth.currentUser;
  if (user) {
    const bibliotecaRef = doc(db, "Biblioteca", user.uid);
    const bibliotecaSnapshot = await getDoc(bibliotecaRef);

    if (bibliotecaSnapshot.exists()) {
      const biblioteca = bibliotecaSnapshot.data().libros || [];
      const container = document.getElementById("biblioteca-container");

      // Limpiar el contenedor
      container.innerHTML = "";

      biblioteca.forEach(async (bookId) => {
        // Llama a la API de Google Books para obtener la información del libro
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
        const data = await response.json();

        const libroDiv = document.createElement("div");
        libroDiv.classList.add("libro");

        const titulo = data.volumeInfo.title;
        const autor = data.volumeInfo.authors ? data.volumeInfo.authors.join(", ") : "Autor desconocido";
        const portada = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : "https://books.google.com/googlebooks/images/no_cover_thumb.gif";
        const descripcion = data.volumeInfo.description || "Descripción no disponible";

        libroDiv.innerHTML = `
          <img src="${portada}" alt="Portada del libro">
          <h3>${titulo}</h3>
          <p><strong>Autor:</strong> ${autor}</p>
          <p>${descripcion}</p>
        `;
        container.appendChild(libroDiv);
      });
    }
  } else {
    alert("Inicia sesión para ver tus favoritos.");
  }
}

  async function buscarLibros(query) {
      try {
          const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${booksApiKey}`;
          const response = await fetch(url);
          const data = await response.json();
  
          const searchSection = document.getElementById("search-results-section");
          const searchTitle = document.getElementById("search-results-title");
  
          if (data.items) {
              mostrarLibros(data.items, "resultados-busqueda-container");
              gestionarDesplazamientoLateral("resultados-busqueda-container", "btn-left-busq", "btn-right-busq");
              // Mostrar la sección de resultados de búsqueda solo si hay resultados
              searchSection.style.display = "flex";
              searchTitle.style.display = "block";
          } else {
              // Ocultar la sección si no hay resultados
              searchSection.style.display = "none";
              searchTitle.style.display = "none";
              document.getElementById("resultados-busqueda-container").innerHTML = "<p>No se encontraron libros.</p>";
          }
      } catch (error) {
          console.error("Error al buscar libros:", error);
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

    leftBtn.style.display = "block";
    rightBtn.style.display = "block";
    leftBtn.addEventListener("click", () => {
      container.scrollBy({ top: 0, left: -300, behavior: "smooth" });
    });
    rightBtn.addEventListener("click", () => {
      container.scrollBy({ top: 0, left: 300, behavior: "smooth" });
    });
  }

  async function guardarEnBiblioteca(bookId) {
  const user = auth.currentUser;
  if (user) {
    const bibliotecaRef = doc(db, "Biblioteca", user.uid);

    try {
      await updateDoc(bibliotecaRef, {
        libros: arrayUnion(bookId) // Agrega el ID del libro al array
      });
      console.log("Libro añadido a Mi Biblioteca");
      alert("Libro añadido a Mi Biblioteca.");
    } catch (error) {
      console.error("Error al añadir a Mi Biblioteca: ", error);
    }
  } else {
    alert("Inicia sesión para guardar libros en tu Biblioteca.");
    }
  }
  
  cargarNovedades();
  cargarRecomendaciones();
  cargarBiblioteca();

  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
      buscarLibros(query);
    } else {
      alert("Por favor, ingresa un término de búsqueda.");
    }
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
