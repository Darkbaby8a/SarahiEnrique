document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("imagenes");
  const estado = document.getElementById("estado");
  const boton = document.getElementById("btnSubir");
  const dropzoneText = document.getElementById("dropzoneText");

  // Mostrar la cantidad de archivos seleccionados en la UI
  if (input) {
    input.addEventListener("change", () => {
      const cantidad = input.files.length;
      if (cantidad > 0) {
        dropzoneText.textContent = `${cantidad} archivo(s) seleccionado(s)`;
      } else {
        dropzoneText.textContent = "Selecciona o arrastra tus fotos y videos";
      }
    });
  }

  // ==========================================
  // 1. EVENTO DE SUBIDA DE ARCHIVOS
  // ==========================================
  boton.onclick = async () => {
    if (!input.files || input.files.length === 0) {
      mostrarNotificacion(
        "Por favor, selecciona al menos una foto o video.",
        "warning",
      );
      return;
    }

    boton.disabled = true;
    boton.style.opacity = "0.6";
    boton.style.cursor = "not-allowed";
    estado.innerHTML = "";

    let subidasExitosas = 0;

    for (const archivo of input.files) {
      const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;

      try {
        let archivoFinal = archivo;

        // Compresión solo para imágenes
        if (archivo.type.startsWith("image/")) {
          actualizarEstadoItem(
            fileId,
            `🖼 Comprimiendo <b>${archivo.name}</b>...`,
            "info",
          );

          archivoFinal = await imageCompression(archivo, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1800,
            useWebWorker: true,
            initialQuality: 0.85,
          });

          console.log(
            `[Compresión] ${archivo.name}: ${(archivo.size / 1024 / 1024).toFixed(2)}MB ➔ ${(archivoFinal.size / 1024 / 1024).toFixed(2)}MB`,
          );
        } else {
          console.log(`[Video] ${archivo.name}`);
        }

        // Convertir a Base64
        actualizarEstadoItem(
          fileId,
          `☁ Subiendo <b>${archivo.name}</b>...`,
          "info",
        );
        const base64 = await convertirBase64(archivoFinal);

        // Enviar a Netlify Function
        const respuesta = await fetch("/.netlify/functions/subir-foto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64 }),
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
          throw new Error(datos.error || "Error al procesar en el servidor.");
        }

        actualizarEstadoItem(
          fileId,
          `✅ <b>${archivo.name}</b> subida con éxito`,
          "success",
        );
        subidasExitosas++;
      } catch (e) {
        console.error(`Error con ${archivo.name}:`, e);
        actualizarEstadoItem(
          fileId,
          `❌ Error al subir <b>${archivo.name}</b>`,
          "error",
        );
      }
    }

    // Finalización
    if (subidasExitosas > 0) {
      estado.innerHTML += `
                        <div style="margin-top: 25px; padding: 20px; background: var(--tarjeta-suave); border-radius: 12px; border: 1px solid var(--oro-acento); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                            <h3 style="font-family: 'Cinzel Decorative', 'Cinzel', serif; color: var(--oro-acento); margin-bottom: 6px; font-size: 1.2rem;">🤍 ¡Muchas gracias!</h3>
                            <p style="font-size: 0.9rem; color: var(--crema-secundario);">Tus recuerdos se han compartido correctamente.</p>
                        </div>
                    `;

      input.value = "";
      if (dropzoneText)
        dropzoneText.textContent = "Selecciona o arrastra tus fotos y videos";
      cargarFotos();
    }

    boton.disabled = false;
    boton.style.opacity = "1";
    boton.style.cursor = "pointer";
  };

  // Inicializar Lightbox y cargar la Galería
  inicializarLightbox();
  cargarFotos();
});

// ==========================================
// 2. CARGAR FOTOS EN LA GALERÍA
// ==========================================
async function cargarFotos() {
  const contenedor = document.getElementById("galeriaBoda");
  if (!contenedor) return;

  try {
    const res = await fetch("/.netlify/functions/galeria");
    if (!res.ok) throw new Error("Error al consultar la galería");

    const fotos = await res.json();
    contenedor.innerHTML = "";

    if (fotos.length === 0) {
      contenedor.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--crema-secundario); font-style: italic; font-size: 0.95rem;">
                            ✨ Aún no hay fotos en el álbum. ¡Sé el primero en subir un recuerdo!
                        </div>
                    `;
      return;
    }

    fotos.forEach((foto) => {
      const card = document.createElement("div");
      card.className = "item-galeria";

      if (foto.tipo === "image") {
        card.innerHTML = `
                            <div class="item-galeria-inner">
                                <img src="${foto.url}" loading="lazy" alt="Recuerdo Boda">
                            </div>
                        `;
        card.onclick = () => abrirLightbox("image", foto.url);
      } else {
        card.innerHTML = `
                            <div class="item-galeria-inner">
                                <div class="badge-video">
                                    ▶ Video
                                </div>
                                <video preload="metadata" muted>
                                    <source src="${foto.original || foto.url}">
                                </video>
                            </div>
                        `;
        card.onclick = () => abrirLightbox("video", foto.original || foto.url);
      }

      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar la galería:", error);
  }
}

// ==========================================
// 3. FUNCIONES AUXILIARES Y NOTIFICACIONES
// ==========================================
function convertirBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function actualizarEstadoItem(id, mensaje, tipo) {
  const estado = document.getElementById("estado");
  let el = document.getElementById(id);

  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "margin: 8px 0; padding: 12px 16px; border-radius: 8px; font-size: 0.88rem; transition: all 0.3s ease; text-align: left;";
    estado.appendChild(el);
  }

  if (tipo === "info") {
    el.style.background = "var(--tarjeta-suave)";
    el.style.color = "var(--crema-principal)";
    el.style.borderLeft = "3px solid var(--oro-acento)";
  } else if (tipo === "success") {
    el.style.background = "rgba(40, 167, 69, 0.2)";
    el.style.color = "#a3e635";
    el.style.borderLeft = "3px solid #28a745";
  } else if (tipo === "error") {
    el.style.background = "rgba(220, 53, 69, 0.2)";
    el.style.color = "#f87171";
    el.style.borderLeft = "3px solid #dc3545";
  }

  el.innerHTML = mensaje;
}

function mostrarNotificacion(mensaje, tipo) {
  const estado = document.getElementById("estado");
  estado.innerHTML = `
                <div style="padding: 14px; background: rgba(28, 77, 52, 0.35); color: var(--crema-principal); border-radius: 8px; border: 1px solid var(--oro-acento); margin-top: 15px; font-size: 0.9rem; font-weight: 500;">
                    ⚠️ ${mensaje}
                </div>
            `;
}

// ==========================================
// 4. SISTEMA LIGHTBOX
// ==========================================
function inicializarLightbox() {
  if (document.getElementById("lightboxModal")) return;

  const modal = document.createElement("div");
  modal.id = "lightboxModal";
  modal.className = "lightbox-modal";
  modal.innerHTML = `
                <button class="lightbox-cerrar" id="btnCerrarLightbox">&times;</button>
                <div class="lightbox-contenido" id="lightboxTarget"></div>
            `;

  document.body.appendChild(modal);

  const cerrar = () => modal.classList.remove("activo");
  document.getElementById("btnCerrarLightbox").onclick = cerrar;
  modal.onclick = (e) => {
    if (e.target === modal) cerrar();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrar();
  });
}

function abrirLightbox(tipo, url) {
  const modal = document.getElementById("lightboxModal");
  const target = document.getElementById("lightboxTarget");
  if (!modal || !target) return;

  if (tipo === "image") {
    target.innerHTML = `<img src="${url}" alt="Foto ampliada">`;
  } else {
    target.innerHTML = `
                    <video controls autoplay style="max-height: 80vh; width: 100%;">
                        <source src="${url}">
                    </video>
                `;
  }

  modal.classList.add("activo");
}
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
