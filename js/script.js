import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";


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
const auth = getAuth(app);

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

    const modalReviewLink = document.getElementById("modal-review-link");
    // Asignar el href de forma predeterminada
    modalReviewLink.href = `agregarResena.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
    // Agregar el event listener para cuando el usuario haga clic
    modalReviewLink.addEventListener("click", function(event) {
      // Verifica si el usuario está logueado
      if (!auth.currentUser) {
        // Si el usuario no está autenticado, muestra un mensaje de advertencia
        alert("¡Debes iniciar sesión para agregar una reseña!");
    
        // Evita la redirección haciendo un `preventDefault`
        event.preventDefault();
    
        // Opcional: Redirige al usuario a la página de login si lo deseas
        // window.location.href = "login.html"; // Si prefieres redirigir al login
      }
    });

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

  async function buscarLibros(query) {
    console.log(`Buscando libros para: ${query}`);
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${booksApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log("Datos recibidos de Google Books API:", data); // Log para revisar la respuesta
      
      if (data.items) {
        document.getElementById("search-results-title").style.display = "block"; // Mostrar título
        document.getElementById("search-results-section").style.display = "block"; // Mostrar sección de resultados
        mostrarLibros(data.items, "resultados-busqueda-container");
        gestionarDesplazamientoLateral("resultados-busqueda-container", "btn-left-resultados-busqueda", "btn-right-resultados-busqueda");
      } else {
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

  // Verificar si los botones existen antes de manipular su estilo
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


  cargarNovedades();
  cargarRecomendaciones();

  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", () => {
    console.log("Botón de búsqueda presionado"); // Mensaje de prueba
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
