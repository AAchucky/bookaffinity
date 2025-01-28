import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
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

    let userId = sessionStorage.getItem('userId');
    console.log('userId en sessionStorage en Estado de autenticación:', userId);
    
    if (user) {
      esInvitado = false; // Usuario logueado
      console.log('esInvitado:', esInvitado);
      userId = user.uid; // Tomamos el ID del usuario logueado
      sessionStorage.setItem("userId", userId); // Guardar el ID del usuario
      try {
        const docRef = doc(db, "Usuarios", userId);
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
      console.log('esInvitado:', esInvitado);
      sessionStorage.removeItem("userId"); // Limpiar el almacenamiento
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
        reviewLink.href = `agregarResena.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userId}`;
      }
      
      document.getElementById("modal-view-reviews-link").href = `muestraResenas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userId}`;
      document.getElementById("modal-add-to-library-link").href = `agregarBiblioteca.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}&userId=${userId}`;
      
      // Asegurarse de que el enlace "Ver en Google Books" se configure correctamente
      document.getElementById("modal-link").href = infoLink;  // Asignamos correctamente el enlace aquí

      // Obtener y mostrar las reseñas
      try {
        const reseñasRef = collection(db, "Resenas");
        const q = query(reseñasRef, where("libro_id", "==", bookId));
        const querySnapshot = await getDocs(q);

        let totalRating = 0;
        let ratingCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.puntuacion) {
            totalRating += data.puntuacion;
            ratingCount += 1;
          }
        });

        const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";

        document.getElementById("average-rating").innerText = averageRating;
        document.getElementById("total-votes").innerText = ratingCount;

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

    // Manejo de clics en los enlaces
    const viewReviewsLink = document.getElementById("modal-view-reviews-link");
    const addToLibraryLink = document.getElementById("modal-add-to-library-link");
    const googleBooksLink = document.getElementById("modal-link");
  
    // Redirigir sin cerrar la sesión
    viewReviewsLink.addEventListener("click", (e) => {
      e.preventDefault();  // Prevenir la acción por defecto
      window.location.replace(viewReviewsLink.href); // Redirigir sin recargar la página
    });
  
    addToLibraryLink.addEventListener("click", (e) => {
      e.preventDefault();  // Prevenir la acción por defecto
      window.location.replace(addToLibraryLink.href); // Redirigir sin recargar la página
    });
  
    googleBooksLink.addEventListener("click", (e) => {
      e.preventDefault();  // Prevenir la acción por defecto
      window.location.replace(googleBooksLink.href); // Redirigir sin recargar la página
    });

    // Función para mostrar estrellas
    function mostrarEstrellas(puntuacion) {
      const starContainer = document.getElementById("star-rating");
      starContainer.innerHTML = "";

      const fullStars = Math.floor(puntuacion);
      const halfStar = puntuacion % 1 >= 0.5 ? 1 : 0;
      const emptyStars = 10 - fullStars - halfStar;

      for (let i = 0; i < fullStars; i++) {
        const star = document.createElement("span");
        star.classList.add("star", "filled");
        star.innerHTML = "&#9733;";
        starContainer.appendChild(star);
      }

      if (halfStar) {
        const star = document.createElement("span");
        star.classList.add("star", "half-filled");
        star.innerHTML = "&#9733;";
        starContainer.appendChild(star);
      }

      for (let i = 0; i < emptyStars; i++) {
        const star = document.createElement("span");
        star.classList.add("star", "empty");
        star.innerHTML = "&#9733;";
        starContainer.appendChild(star);
      }
    }

    // Función de cierre de sesión
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
  });

  // Otros eventos de la página (desplazamiento, búsqueda de libros, etc.)
  // Asegúrate de que estos eventos funcionen correctamente.
  
  // Cargar novedades y recomendaciones
  cargarNovedades();
  cargarRecomendaciones();
});
