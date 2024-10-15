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
				  document.getElementById("modal-view-reviews-link").href = `muestraReseñas.html?bookId=${bookId}&titulo=${encodeURIComponent(titulo)}`;
				
				  // Obtener las reseñas del libro desde Firestore
				  const reviewsSnapshot = await getDocs(query(collection(db, "Resenas"), where("libro_id", "==", bookId)));
				  const reviews = reviewsSnapshot.docs.map(doc => doc.data());
				  
				  // Calcular la puntuación media
				  if (reviews.length > 0) {
				    const totalScore = reviews.reduce((sum, review) => sum + review.puntuacion, 0);
				    const averageRating = (totalScore / reviews.length).toFixed(1);
				    document.getElementById("average-rating").innerText = averageRating;
				
				    // Generar los datos para la gráfica de votos
				    const voteCounts = Array(10).fill(0); // Array para contar votos del 1 al 10
				    reviews.forEach(review => voteCounts[review.puntuacion - 1]++); // Incrementar el contador correspondiente
				
				    // Dibujar la gráfica con Chart.js
				    const ctx = document.getElementById("votes-chart").getContext("2d");
				    new Chart(ctx, {
				      type: 'bar',
				      data: {
				        labels: Array.from({ length: 10 }, (_, i) => i + 1), // Números del 1 al 10
				        datasets: [{
				          label: 'Votos',
				          data: voteCounts,
				          backgroundColor: 'rgba(75, 192, 192, 0.2)',
				          borderColor: 'rgba(75, 192, 192, 1)',
				          borderWidth: 1
				        }]
				      },
				      options: {
				        scales: {
				          y: {
				            beginAtZero: true
				          }
				        }
				      }
				    });
				  } else {
				    document.getElementById("average-rating").innerText = "N/A";
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
    
		// Actualizar la barra de estrellas según la calificación promedio (0-10)
		function updateStarRating(rating) {
		  const starsElement = document.querySelector('.stars');
		  const percentage = (rating / 10) * 100; // Calcular el porcentaje lleno
		  starsElement.style.backgroundSize = `${percentage}% 100%`; 
		}
		
		// Generar gráfica con Chart.js
		function generateChart(voteCounts) {
		  const ctx = document.getElementById('votes-chart').getContext('2d');
		  new Chart(ctx, {
		    type: 'bar',
		    data: {
		      labels: Array.from({ length: 10 }, (_, i) => i + 1),
		      datasets: [{
		        label: 'Votos',
		        data: voteCounts,
		        backgroundColor: 'rgba(75, 192, 192, 0.6)',
		        borderColor: 'rgba(75, 192, 192, 1)',
		        borderWidth: 1
		      }]
		    },
		    options: {
		      indexAxis: 'y', // Hace que las barras sean horizontales
		      scales: {
		        x: { beginAtZero: true }
		      },
		      plugins: {
		        legend: { display: false }
		      }
		    }
		  });
		}
		
		// Ejemplo de uso (reemplaza con datos reales)
		updateStarRating(9.0);
		generateChart([5, 10, 15, 30, 50, 70, 90, 110, 120, 150]);
		
 		document.querySelectorAll('.star-rating .star').forEach(function(star, index) {
	    star.addEventListener('click', function() {
	      const allStars = document.querySelectorAll('.star-rating .star');
	      for (let i = 0; i < allStars.length; i++) {
	        allStars[i].textContent = i <= index ? '★' : '☆'; // Llena las estrellas hasta donde se haya hecho clic
	      }         
	    });         
	  });  
