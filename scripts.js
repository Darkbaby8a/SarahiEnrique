document.addEventListener("DOMContentLoaded", () => {
  const sobre = document.getElementById("botonAbrir");
  const contenedorSobre = document.getElementById("contenedorSobre");
  const seccionPrincipal = document.getElementById("seccionPrincipal");
  const textoElemento = document.getElementById("textoEscrito");
  const textoEscritoFecha = document.getElementById("textoEscritoFecha");

  const textoAEscribir = "Sarahí & Enrique";
  const textoAEscribirFecha = "27 de Septiembre de 2026";
  let abierto = false;

  sobre.addEventListener("click", () => {
    if (abierto) return;
    abierto = true;

    // 1. Abrir la solapa y desplazar la tarjeta interior
    sobre.classList.add("abierto");

    // 2. Iniciar el efecto de mecanografiado de forma secuencial
    setTimeout(() => {
      // Activa el cursor parpadeante en el primer texto
      textoElemento.classList.add("escribiendo");

      // Escribir Nombres
      escribirTexto(textoElemento, textoAEscribir, 90, () => {
        textoElemento.classList.remove("escribiendo"); // Remueve cursor de nombres
        textoEscritoFecha.classList.add("escribiendo"); // Activa cursor en fecha

        // Escribir Fecha
        escribirTexto(textoEscritoFecha, textoAEscribirFecha, 90, () => {
          // 3. Ocultar el sobre y mostrar la sección principal
          setTimeout(() => {
            contenedorSobre.classList.add("oculto");
            seccionPrincipal.classList.add("visible");
          }, 1000);
        });
      });
      startPetals();
    }, 800);
  });

  function escribirTexto(elemento, texto, velocidad, callback) {
    let i = 0;
    elemento.textContent = "";
    const intervalo = setInterval(() => {
      if (i < texto.length) {
        elemento.textContent += texto.charAt(i);
        i++;
      } else {
        clearInterval(intervalo);
        if (callback) callback();
      }
    }, velocidad);
  }
  // Fecha objetivo: 27 de Septiembre de 2026 a las 3:30 PM
  const fechaEvento = new Date("September 27, 2026 15:30:00").getTime();

  function actualizarCuentaRegresiva() {
    const ahora = new Date().getTime();
    const diferencia = fechaEvento - ahora;

    if (diferencia > 0) {
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor(
        (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      document.getElementById("days").innerText = String(dias).padStart(2, "0");
      document.getElementById("hours").innerText = String(horas).padStart(
        2,
        "0",
      );
      document.getElementById("minutes").innerText = String(minutos).padStart(
        2,
        "0",
      );
      document.getElementById("seconds").innerText = String(segundos).padStart(
        2,
        "0",
      );
    } else {
      document.querySelector(".cuentaregresiva").innerHTML =
        "<h2 class='colordorado'>¡El gran día ha llegado!</h2>";
    }
  }

  // Ejecutar cada segundo
  setInterval(actualizarCuentaRegresiva, 1000);
  actualizarCuentaRegresiva();
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // Envía la pantalla al inicio al cargar el DOM
  window.addEventListener("beforeunload", function () {
    window.scrollTo(0, 0);
  });

  window.onload = function () {
    window.scrollTo(0, 0);
  };
});
// Selección de elementos
const params = new URLSearchParams(window.location.search);
const familia = params.get("familia");

const contenedor = document.getElementById("contenedorConfirmacion");

let datosInvitado = null;

if (!familia) {
  contenedor.innerHTML = `
    <section class="confirmacionInvitacion">
      <div class="tarjeta-confirmacion">
        <h2 class="titulo-esperamos">Invitación no válida</h2>
        <p class="subtitulo-confirmacion">El enlace de invitación es incorrecto o está incompleto.</p>
      </div>
    </section>
  `;
} else {
  fetch(
    `/.netlify/functions/obtener-invitado?familia=${encodeURIComponent(familia)}`,
  )
    .then((res) => res.json())
    .then((res) => {
      if (!res.ok || !res.invitado) {
        contenedor.innerHTML = `
          <section class="confirmacionInvitacion">
            <div class="tarjeta-confirmacion">
              <h2 class="titulo-esperamos">Invitación no encontrada</h2>
              <p class="subtitulo-confirmacion">${res.message || "No pudimos encontrar tus datos."}</p>
            </div>
          </section>
        `;
        return;
      }

      datosInvitado = res.invitado;
      renderizarSeccionConfirmacion(datosInvitado);
    })
    .catch((error) => {
      console.error("Error al obtener la invitación:", error);
      contenedor.innerHTML = `
        <section class="confirmacionInvitacion">
          <div class="tarjeta-confirmacion">
            <h2 class="titulo-esperamos">Error de conexión</h2>
            <p class="subtitulo-confirmacion">Ocurrió un problema al cargar tu invitación. Intenta nuevamente más tarde.</p>
          </div>
        </section>
      `;
    });
}

function renderizarSeccionConfirmacion(invitado) {
  let textoBoton = "Confirmar Asistencia";
  if (invitado.acepto) textoBoton = "Asistencia Confirmada";
  if (invitado.rechazo) textoBoton = "Inasistencia Registrada";

  // Identificador único para el código QR
  const qrData = familia;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  // Se genera el bloque del pase QR únicamente si aceptó
  let bloqueQR = "";
  if (invitado.acepto) {
    bloqueQR = `
      <div class="seccion-pase-qr">
        <p class="texto-pase-entrada">Este es tu pase de entrada</p>
        <img class="codigo-qr-img" src="${qrUrl}" alt="Pase de Entrada QR" />
        <p class="subtitulo-confirmacion">Favor de mostrarlo en la entrada de la recepción</p>
      </div>
    `;
  }

  contenedor.innerHTML = `
    <!-- Sección Principal de Confirmación -->
    <section class="confirmacionInvitacion">
      <div class="tarjeta-confirmacion">
        <h2 class="titulo-esperamos">Te esperamos</h2>
        <p class="subtitulo-confirmacion">Esperamos tu confirmación</p>
        
        <div class="datos-invitado">
          <span id="nombreFamilia" class="nombre-familia">${invitado.FamiliaDesc || invitado.familiaNombre}</span>
          <span id="CantidadPases" class="cantidad-pases">Pases asignados: ${invitado.Pases}</span>
        </div>

        ${bloqueQR}

        <button id="btnAbrirModal" class="boton-confirmar">${textoBoton}</button>
      </div>
    </section>

    <!-- Modal de Confirmación -->
    <div id="modalOverlay" class="modal-overlay">
      <div class="modal-contenido">
        <h3 class="modal-titulo">Confirma tu asistencia</h3>
        <p class="modal-instruccion">Por favor, indícanos si podrás acompañarnos en este día tan especial.</p>
        
        <div class="modal-acciones">
          <button id="btnSiAsistire" class="btn-opcion btn-si">Sí Asistiré</button>
          <button id="btnNoAsistire" class="btn-opcion btn-no">No Asistiré</button>
        </div>
        
        <button id="btnCerrarModal" class="btn-cerrar">&times; Cerrar</button>
      </div>
    </div>
  `;

  inicializarEventosModal();
}

function inicializarEventosModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  const btnAbrirModal = document.getElementById("btnAbrirModal");
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  const btnSiAsistire = document.getElementById("btnSiAsistire");
  const btnNoAsistire = document.getElementById("btnNoAsistire");

  btnAbrirModal.addEventListener("click", () => {
    modalOverlay.classList.add("activo");
  });

  btnCerrarModal.addEventListener("click", () => {
    modalOverlay.classList.remove("activo");
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("activo");
    }
  });

  btnSiAsistire.addEventListener("click", () => enviarRespuesta(true));
  btnNoAsistire.addEventListener("click", () => enviarRespuesta(false));
}

async function enviarRespuesta(asistira) {
  const modalOverlay = document.getElementById("modalOverlay");
  const btnSiAsistire = document.getElementById("btnSiAsistire");
  const btnNoAsistire = document.getElementById("btnNoAsistire");
  const btnAbrirModal = document.getElementById("btnAbrirModal");

  // Bloqueamos los botones mientras dura el fecth
  btnSiAsistire.disabled = true;
  btnNoAsistire.disabled = true;

  try {
    const response = await fetch("/.netlify/functions/aceptarinvitados", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        familiaNombre: datosInvitado.familiaNombre,
        asistira: asistira,
      }),
    });

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    await response.json();

    // Actualizamos el objeto local
    datosInvitado.acepto = asistira;
    datosInvitado.rechazo = !asistira;

    // Actualizamos la UI
    modalOverlay.classList.remove("activo");
    btnAbrirModal.innerText = asistira
      ? "Asistencia Confirmada"
      : "Inasistencia Registrada";

    mostrarMensaje(asistira);
    renderizarSeccionConfirmacion(datosInvitado);
  } catch (error) {
    console.error(error);
    alert("No fue posible registrar tu respuesta. Inténtalo nuevamente.");
  } finally {
    btnSiAsistire.disabled = false;
    btnNoAsistire.disabled = false;
  }
}

function mostrarMensaje(asistira) {
  if (asistira) {
    alert(
      "¡Muchas gracias por confirmar! Nos dará mucho gusto compartir este día contigo.",
    );
  } else {
    alert(
      "Muchas gracias por avisarnos. Lamentamos que no puedas acompañarnos.",
    );
  }
}
// 1. Deshabilitar el clic derecho
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// 2. Deshabilitar atajos de teclado para inspeccionar
document.addEventListener("keydown", (e) => {
  //Deshabilitar F12
  if (e.key === "F12") {
    e.preventDefault();
  }

  // Deshabilitar Ctrl+Shift+I (Inspeccionar), Ctrl+Shift+J (Consola), Ctrl+Shift+C (Elemento)
  if (
    e.ctrlKey &&
    e.shiftKey &&
    ["I", "J", "C", "i", "j", "c"].includes(e.key)
  ) {
    e.preventDefault();
  }

  // Deshabilitar Cmd+Option+I / Cmd+Option+J en macOS
  if (e.metaKey && e.altKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) {
    e.preventDefault();
  }

  // Deshabilitar Ctrl+U / Cmd+U (Ver código fuente)
  if ((e.ctrlKey || e.metaKey) && ["U", "u"].includes(e.key)) {
    e.preventDefault();
  }
});

// 3. Trampa de debugger (opcional: pausa la ejecución si logran abrir la consola)
setInterval(() => {
  const startTime = performance.now();
  debugger;
  const endTime = performance.now();
  //Si la consola está abierta, la instrucción 'debugger' pausa el flujo y causa un retraso medible
  if (endTime - startTime > 100) {
    console.clear();
  }
}, 1000);

let petalInterval = null;

function createPetal() {
  const leaf = document.createElement("div");
  leaf.className = "petal";

  // Tamaños variados y proporcionales
  const width = Math.random() * 14 + 14; // entre 14px y 28px
  const height = width * (Math.random() * 0.3 + 1.4); // forma alargada

  leaf.style.width = `${width}px`;
  leaf.style.height = `${height}px`;

  // Posición horizontal inicial
  leaf.style.left = `${Math.random() * 100}vw`;

  // Tonalidades de verde con degradado para mayor realismo
  const greenGradients = [
    "linear-gradient(135deg, #E8E3C8, #B7B58A)", // Crema + olivo suave
    "linear-gradient(135deg, #F3E9D2, #C5C9A5)", // Crema + salvia
    "linear-gradient(135deg, #DDE2C6, #9DA77A)", // Verde salvia otoñal
    "linear-gradient(135deg, #F1DFC4, #B8B68A)", // Beige cálido + olivo
    "linear-gradient(135deg, #E6E0C9, #A8AD82)", // Crema + verde musgo claro
    "linear-gradient(135deg, #F5E6C8, #C9C49A)", // Arena + verde oliva
  ];

  leaf.style.background =
    greenGradients[Math.floor(Math.random() * greenGradients.length)];

  // Ángulo de inclinación inicial aleatorio
  const initialRotate = Math.random() * 360;
  leaf.style.transform = `rotate(${initialRotate}deg)`;

  // Duración de caída más lenta (10 a 16 segundos para mayor suavidad)
  const duration = Math.random() * 6 + 10;
  leaf.style.setProperty("--fall-duration", `${duration}s`);

  // Desplazamiento lateral suave en una sola dirección (entre -30px y 30px)
  const drift = (Math.random() - 0.5) * 60;
  leaf.style.setProperty("--drift-distance", `${drift}px`);

  // Giro final uniforme
  const finalRotation = initialRotate + (Math.random() > 0.5 ? 180 : -180);
  leaf.style.setProperty("--final-rotation", `${finalRotation}deg`);

  // Opacidad
  const opacity = Math.random() * 0.4 + 0.6;
  leaf.style.setProperty("--leaf-opacity", opacity);

  document.body.appendChild(leaf);

  // Limpieza del elemento al finalizar
  setTimeout(() => {
    leaf.remove();
  }, duration * 1000);
}

function startPetals() {
  if (petalInterval) return;

  const isMobile = window.innerWidth < 768;
  const interval = isMobile ? 1200 : 700; // Frecuencia más baja para mantener fluidez

  petalInterval = setInterval(createPetal, interval);
}
