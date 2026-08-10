document.addEventListener("DOMContentLoaded", () => {
  const sobre = document.getElementById("botonAbrir");
  const textoElemento = document.getElementById("textoEscrito");
  const textoAEscribir = "Sarahí & Enrique";
  let abierto = false;

  sobre.addEventListener("click", () => {
    if (abierto) return; // Evita activar la animación más de una vez consecutiva
    abierto = true;

    // Activar animación CSS del sobre e invitación
    sobre.classList.add("abierto");

    // Iniciar efecto mecanografiado después de que la invitación suba
    setTimeout(() => {
      escribirTexto(textoElemento, textoAEscribir, 100);
    }, 1000); // 1 segundo de espera (coincide con el tiempo de subida)
  });

  function escribirTexto(elemento, texto, velocidad) {
    let i = 0;
    elemento.textContent = "";
    const intervalo = setInterval(() => {
      if (i < texto.length) {
        elemento.textContent += texto.charAt(i);
        i++;
      } else {
        clearInterval(intervalo);
      }
    }, velocidad);
  }
});
