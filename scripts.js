document.addEventListener("DOMContentLoaded", () => {
  const sobre = document.getElementById("botonAbrir");
  const contenedorSobre = document.getElementById("contenedorSobre");
  const seccionPrincipal = document.getElementById("seccionPrincipal");
  const textoElemento = document.getElementById("textoEscrito");
  const textoAEscribir = "Sarahí & Enrique";
  let abierto = false;

  sobre.addEventListener("click", () => {
    if (abierto) return;
    abierto = true;

    // 1. Abrir la solapa y desplazar la tarjeta interior
    sobre.classList.add("abierto");

    // 2. Iniciar el efecto de mecanografiado
    setTimeout(() => {
      escribirTexto(textoElemento, textoAEscribir, 90, () => {
        // 3. Ocultar el sobre y mostrar la sección principal con la foto
        setTimeout(() => {
          contenedorSobre.classList.add("oculto");
          seccionPrincipal.classList.add("visible");
        }, 1000);
      });
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
