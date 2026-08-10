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

    // 1. Abrir la solapa y elevar la invitación pequeña
    sobre.classList.add("abierto");

    // 2. Escribir el texto letra por letra después de abrir la solapa
    setTimeout(() => {
      escribirTexto(textoElemento, textoAEscribir, 100, () => {
        // 3. Una vez terminado el texto, esperar 1.2s y desplazar la pantalla al contenido principal
        setTimeout(() => {
          contenedorSobre.classList.add("oculto");
          seccionPrincipal.classList.add("visible");
        }, 1200);
      });
    }, 1000);
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
});
