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
    const usuarioElemento = document.getElementById("usuario-estado");
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
        window.location.href = "index.html"; // Redirigir al usuario a la página de inicio después de cerrar sesión
      }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
    });
    document.getElementById("usuario-estado").appendChild(logoutButton);
  }

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
  function abrirModal(titulo, autor, descripcion, portada, infoLink, bookId) {
    document.getElementById("modal-title").innerText = titulo;
    document.getElementById("modal-author").innerText = autor;
    document.getElementById("modal-description").innerText = descripcion;
    document.getElementById("modal-image").src = portada;
    document.getElementById("modal-review-link").href = `agregarReseña.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
    document.getElementById("modal-view-reviews-link").href = `muestraReseñas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;   
    document.getElementById("modal-add-to-library-link").href = `agregarBiblioteca.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
    document.getElementById("book-modal").style.display = "flex";
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

  // Cargar novedades y recomendaciones
  cargarNovedades();
  cargarRecomendaciones();
});
