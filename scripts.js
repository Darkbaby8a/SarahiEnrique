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
});
