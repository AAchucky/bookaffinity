import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
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

let esInvitado = true; // Variable para verificar si el usuario es invitado

document.addEventListener("DOMContentLoaded", () => {
  
  // Estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    const userNameElement = document.getElementById("user-name");
    const logoutButton = document.getElementById("logout-button");

    if (user) {
      esInvitado = false; // Usuario logueado
      try {
        const docRef = doc(db, "Usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        const userName = docSnap.exists() ? docSnap.data().nombre : "Desconocido";
        userNameElement.innerText = `Usuario: ${userName}`;
        
        logoutButton.style.display = "block";  // Mostrar el botón de cerrar sesión
      } catch (error) {
        console.error("Error al obtener el nombre del usuario:", error);
        userNameElement.innerText = "Usuario: Desconocido";
      }
    } else {
      // Usuario no logueado
      userNameElement.innerText = "Usuario: invitado";
      logoutButton.style.display = "none";  // Ocultar el botón de cerrar sesión
    }
  });

  // Configurar evento de cierre de sesión
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        console.log("Sesión cerrada correctamente.");
        window.location.href = "/bookaffinity/index.html";  // Redirigir a la página de inicio
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
  });

  // Función para cargar libros y mostrarlos en un contenedor específico
  async function cargarLibros(url, containerId) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Respuesta de la API:", data); // Log de la respuesta
  
      if (data.items && data.items.length > 0) {
        mostrarLibros(data.items, containerId);
      } else {
        document.getElementById(containerId).innerHTML = "<p>No se encontraron libros.</p>";
      }
    } catch (error) {
      console.error("Error al cargar libros:", error);
    }
  }


  // Función para abrir un modal con información del libro
  async function abrirModal(titulo, autor, descripcion, portada, infoLink, bookId) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-author").innerText = autor;
    document.getElementById("modal-description").innerText = descripcion;
    document.getElementById("modal-image").src = portada;

    const reviewLink = document.getElementById("modal-review-link");

    // Verificar si el usuario es invitado
    if (esInvitado) {
      // Deshabilitar el enlace de agregar reseña
      reviewLink.removeAttribute("href");
      reviewLink.style.pointerEvents = "none";
      reviewLink.style.color = "gray";
      reviewLink.style.cursor = "not-allowed";
      reviewLink.title = "Inicia sesión para agregar una reseña";
    } else {
      // Habilitar el enlace de agregar reseña para usuarios logueados
      reviewLink.href = `agregarResena.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userName}`;
    }

    document.getElementById("modal-view-reviews-link").href = `muestraResenas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userName}`;
    document.getElementById("modal-add-to-library-link").href = `agregarBiblioteca.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userName}`;
    
    // Asegurarse de que el enlace "Ver en Google Books" se configure correctamente
    document.getElementById("modal-link").href = infoLink;  // Asignamos correctamente el enlace aquí

    try {
    // Buscar las reseñas en Firestore para este libro específico
    const reseñasRef = collection(db, "Resenas");
    const q = query(reseñasRef, where("libro_id", "==", bookId));
    const querySnapshot = await getDocs(q);

    let totalRating = 0;
    let ratingCount = 0;

    // Calcular la puntuación media y el total de votos
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.puntuacion) {
        totalRating += data.puntuacion;  // Sumar la puntuación de cada reseña
        ratingCount += 1;  // Contar la reseña
      }
    });

    // Si hay reseñas, calcular la puntuación media
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";

    document.getElementById("average-rating").innerText = averageRating;
    document.getElementById("total-votes").innerText = ratingCount;

    // Mostrar las estrellas de la puntuación media
    mostrarEstrellas(averageRating);

  } catch (error) {
    console.error("Error al obtener las reseñas desde Firestore:", error);
    document.getElementById("average-rating").innerText = "N/A";
    document.getElementById("total-votes").innerText = "0";
    mostrarEstrellas(0);
  }
    // Mostrar el modal
    document.getElementById("book-modal").style.display = "flex";
  }

  // Función para mostrar las estrellas basadas en la puntuación
  function mostrarEstrellas(puntuacion) {
    const starContainer = document.getElementById("star-rating");
    starContainer.innerHTML = ""; // Limpiar las estrellas anteriores
  
    // La puntuación se representa en una escala de 0 a 10
    const fullStars = Math.floor(puntuacion);  // Estrellas completas
    const halfStar = puntuacion % 1 >= 0.5 ? 1 : 0;  // Verificar si hay una estrella parcial
    const emptyStars = 10 - fullStars - halfStar;  // Rellenar con estrellas vacías el resto
  
    // Agregar estrellas completas
    for (let i = 0; i < fullStars; i++) {
      const star = document.createElement("span");
      star.classList.add("star", "filled");
      star.innerHTML = "&#9733;";  // Código de estrella completa
      starContainer.appendChild(star);
    }
  
    // Agregar estrella parcial si corresponde
    if (halfStar) {
      const star = document.createElement("span");
      star.classList.add("star", "half-filled");
      star.innerHTML = "&#9733;";  // Estrella parcialmente llena con un gradiente
      starContainer.appendChild(star);
    }
  
    // Agregar estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
      const star = document.createElement("span");
      star.classList.add("star", "empty");
      star.innerHTML = "&#9733;";  // Estrella vacía
      starContainer.appendChild(star);
    }
  }

  async function buscarLibros(query) {
    if (query) {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${booksApiKey}`;
      console.log("URL de búsqueda:", url); // Log de la URL para depuración
  
      // Asegurarse de que los resultados sean visibles
      document.getElementById("search-results-title").style.display = "block";
      document.getElementById("search-results-section").style.display = "block";
  
      cargarLibros(url, "resultados-busqueda-container");
    } else {
      alert("Por favor, ingresa un término de búsqueda.");
    }
  }


  // Función para mostrar los libros en un contenedor
  function mostrarLibros(libros, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";  // Limpiar el contenedor antes de mostrar los libros

    // Si no hay libros, mostrar un mensaje
    if (!libros || libros.length === 0) {
    container.innerHTML = "<p>No se encontraron libros.</p>";
    return;
    }
    
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

  // Función para cargar novedades
  async function cargarNovedades() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=newest&key=${booksApiKey}&maxResults=10`;
    cargarLibros(url, "novedades-container");
  }

  // Función para cargar recomendaciones
  async function cargarRecomendaciones() {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&langRestrict=es&orderBy=relevance&filter=paid-ebooks&maxResults=10&key=${booksApiKey}`;
    cargarLibros(url, "recomendaciones-container");
  }

  // Vincular el botón de búsqueda a la función buscarLibros
  const searchButton = document.getElementById("search-button");
  const searchInput = document.getElementById("search-input");

  // Verificar que los elementos existen
  if (searchButton && searchInput) {
    console.log("Botón de búsqueda y campo de entrada cargados correctamente.");

    searchButton.addEventListener("click", () => {
      const query = searchInput.value.trim();
      console.log("Valor de la búsqueda:", query);

      if (query) {
        buscarLibros(query);
      } else {
        alert("Por favor, ingresa un término de búsqueda.");
      }
    });
  } else {
    console.error("No se encontraron los elementos de búsqueda.");
  }

  // Función para cerrar el modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("book-modal").style.display = "none";
  });

  // Función para desplazar las categorías
  document.getElementById("btn-left").addEventListener("click", () => {
    const container = document.getElementById("novedades-container");
    container.scrollBy({ left: -200, behavior: 'smooth' }); // Desplaza hacia la izquierda
  });

  document.getElementById("btn-right").addEventListener("click", () => {
    const container = document.getElementById("novedades-container");
    container.scrollBy({ left: 200, behavior: 'smooth' }); // Desplaza hacia la derecha
  });

  document.getElementById("btn-left-recomendaciones").addEventListener("click", () => {
    const container = document.getElementById("recomendaciones-container");
    container.scrollBy({ left: -200, behavior: 'smooth' });
  });

  document.getElementById("btn-right-recomendaciones").addEventListener("click", () => {
    const container = document.getElementById("recomendaciones-container");
    container.scrollBy({ left: 200, behavior: 'smooth' });
  });

  document.getElementById("btn-left-mibiblioteca").addEventListener("click", () => {
    const container = document.getElementById("mibiblioteca-container");
    container.scrollBy({ left: -200, behavior: 'smooth' });
  });

  document.getElementById("btn-right-mibiblioteca").addEventListener("click", () => {
    const container = document.getElementById("mibiblioteca-container");
    container.scrollBy({ left: 200, behavior: 'smooth' });
  });

  document.getElementById("btn-left-resultados-busqueda").addEventListener("click", () => {
    const container = document.getElementById("resultados-busqueda-container");
    container.scrollBy({ left: -200, behavior: 'smooth' });
  });

  document.getElementById("btn-right-resultados-busqueda").addEventListener("click", () => {
    const container = document.getElementById("resultados-busqueda-container");
    container.scrollBy({ left: 200, behavior: 'smooth' });
  });

  window.addEventListener('beforeunload', () => {
  const auth = getAuth(app);
  if (auth.currentUser) {
    signOut(auth).then(() => {
      console.log("Sesión cerrada automáticamente al cerrar el navegador.");
    }).catch(error => {
      console.error("Error al cerrar sesión automáticamente:", error);
    });
  }
});

  // Cargar novedades y recomendaciones
  cargarNovedades();
  cargarRecomendaciones();
});
