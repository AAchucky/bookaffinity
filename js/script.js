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

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

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
        document.getElementById("modal-title").innerText = titulo;
        document.getElementById("modal-author").innerText = autor;
        document.getElementById("modal-description").innerText = descripcion;
        document.getElementById("modal-image").src = portada;
        document.getElementById("modal-link").href = infoLink;
      
        document.getElementById("modal-review-link").href = `agregarReseña.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
        document.getElementById("modal-view-reviews-link").href = `muestraResenas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
      
        // Obtener las reseñas del libro desde Firestore
        const reviewsSnapshot = await getDocs(query(collection(db, "Resenas"), where("libro_id", "==", bookId)));
        
        // Verificar si hay reseñas
        if (reviewsSnapshot.empty) {
          console.log("No se encontraron reseñas para este libro");
        } else {
          console.log("Reseñas encontradas");
        }
      
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        console.log("Reseñas obtenidas:", reviews); // Depuración
      
        // Mostrar las reseñas en el modal
        const reviewsContainer = document.getElementById("reviews-container");
        reviewsContainer.innerHTML = ""; // Limpiar reseñas anteriores
      
        reviews.forEach(review => {
          const reviewDiv = document.createElement("div");
          reviewDiv.classList.add("review");
      
        const reviewContent = `
          <p><strong>Reseña:</strong> ${review.comentario || 'No hay comentario'}</p>
          <p><strong>Puntuación:</strong> ${review.puntuacion || 'N/A'}/10</p>
          `;
      
          reviewDiv.innerHTML = reviewContent;
          reviewsContainer.appendChild(reviewDiv);
        });

        // Calcular la puntuación media
        let averageRating = 0; // Inicializar la variable
        if (reviews.length > 0) {
          const totalScore = reviews.reduce((sum, review) => sum + review.puntuacion, 0);
          averageRating = (totalScore / reviews.length).toFixed(1);
          document.getElementById("average-rating").innerText = averageRating;
        } else {
          document.getElementById("average-rating").innerText = "N/A";
        }

        // Llamar a la función para actualizar la barra de estrellas
        updateStarRating(averageRating);

        // Generar los datos para los votos
        const voteCounts = Array(10).fill(0); // Array para contar votos del 1 al 10
        if (reviews && reviews.length > 0) {
          reviews.forEach(review => voteCounts[review.puntuacion - 1]++);
        }

        // Añadir el total de votos
        const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
        const totalVotesElement = document.getElementById('total-votes');
        if (totalVotesElement) {
          totalVotesElement.innerText = `Total de Votos: ${totalVotes}`;
        } else {
          console.error('Elemento con ID total-votes no encontrado');
        }

        // Mostrar el modal
        document.getElementById("book-modal").style.display = "flex";
      });

      container.appendChild(libroDiv);
    });
  }

  async function cargarNovedades() {
    const url = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=AIzaSyAPkUEVaKIyM-AzsMMbU-tfU6VuKQvhNM4&maxResults=10';
    cargarLibros(url, "novedades-container");
  }

  async function cargarRecomendaciones() {
    const url = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=AIzaSyAPkUEVaKIyM-AzsMMbU-tfU6VuKQvhNM4';
    cargarLibros(url, "recomendaciones-container");
  }

  // Cargar libros al iniciar la página
  cargarNovedades();
  cargarRecomendaciones();

  // Desplazamiento lateral
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

  // Cerrar el modal
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

  // Ejemplo de uso
  let averageRating = 9;
  updateStarRating(averageRating);

  // Para el caso de "N/A"
  averageRating = 'N/A';
  updateStarRating(averageRating);

  document.querySelectorAll('.star-rating .star').forEach(function (star, index) {
    star.addEventListener('click', function () {
      const allStars = document.querySelectorAll('.star-rating .star');
      for (let i = 0; i < allStars.length; i++) {
        allStars[i].textContent = i <= index ? '?' : '?'; // Llena las estrellas hasta donde se haya hecho clic
      }
    });
  });
});
