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
});
