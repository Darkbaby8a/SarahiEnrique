const tbody = document.getElementById("tablaCuerpo");
const txtFamilias = document.getElementById("txtTotalFamilias");
const txtPases = document.getElementById("txtTotalPases");
const formBoda = document.getElementById("formConfirmarBoda");
const btnSubmit = document.getElementById("btnConfirmarModal");
const btnCancelar = document.getElementById("btnCancelarEdicion");
const tituloFormulario = document.getElementById("tituloFormulario");

const inputFamiliaDesc = document.getElementById("familiaDesc");
const inputFamiliaNombre = document.getElementById("familiaNombre");

let datosGlobal = [];
let idEditando = null;

//==============================
// GENERADOR AUTOMÁTICO DE SLUG / CLAVE
//==============================
function generarSlug(texto) {
  return texto
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

inputFamiliaDesc.addEventListener("input", function () {
  inputFamiliaNombre.value = generarSlug(this.value);
});

//==============================
// CARGAR TABLA
//==============================
function cargarInvitados() {
  fetch("/.netlify/functions/ObtenerInvitados")
    .then((response) => {
      if (!response.ok) throw new Error("Error al obtener datos");
      return response.json();
    })
    .then((res) => {
      datosGlobal = res.data || [];

      txtFamilias.textContent = res.totalInvitados ?? datosGlobal.length;
      txtPases.textContent =
        res.totalPases ??
        datosGlobal.reduce((acc, curr) => acc + Number(curr.Pases || 0), 0);

      tbody.innerHTML = "";

      if (datosGlobal.length === 0) {
        tbody.innerHTML = `
                            <tr>
                                <td colspan="6" style="text-align:center;padding:30px;color:#666;">
                                    No hay invitados registrados.
                                </td>
                            </tr>`;
        return;
      }

      datosGlobal.forEach((invitado) => {
        let estadoTexto = "Pendiente";
        let estadoClase = "pendiente";

        if (invitado.acepto == 1) {
          estadoTexto = "Aceptó";
          estadoClase = "acepto";
        } else if (invitado.rechazo == 1) {
          estadoTexto = "Rechazó";
          estadoClase = "rechazo";
        }

        const fila = document.createElement("tr");

        fila.innerHTML = `
                            <td><strong>#${invitado.id}</strong></td>
                            <td>${invitado.familiades || ""}</td>
                            <td><strong>${invitado.pases || 0}</strong></td>
                            <td><span class="badge-estatus ${estadoClase}">${estadoTexto}</span></td>
                            <td>
                                <button class="btn-copiar-link" onclick="copiarLink('https://sarahienrique.netlify.app/?familia=${encodeURIComponent(invitado.familiaidentificador || "")}')">
                                    📋 Copiar
                                </button>
                            </td>
                            <td>
                                <button class="btn-editar" onclick="editarInvitado(${invitado.id})">✏️</button>
                                <button class="btn-eliminar" onclick="eliminarInvitado(${invitado.id})">🗑️</button>
                            </td>
                        `;

        tbody.appendChild(fila);
      });
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="color:red;text-align:center;padding:30px;">
                                Error al cargar la lista de invitados.
                            </td>
                        </tr>`;
    });
}

//==============================
// EDITAR
//==============================
function editarInvitado(id) {
  const invitado = datosGlobal.find((x) => x.id == id);
  if (!invitado) return;

  idEditando = id;

  inputFamiliaDesc.value = invitado.familiades || "";
  inputFamiliaNombre.value = invitado.familiaidentificador || "";

  document.getElementById("pases").value = invitado.pases || 1;

  tituloFormulario.textContent = "Editar Invitado";
  btnSubmit.textContent = "Guardar Cambios";
  btnCancelar.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

//==============================
// CANCELAR EDICION
//==============================
function cancelarEdicion() {
  idEditando = null;
  formBoda.reset();
  inputFamiliaNombre.setAttribute("readonly", true);
  tituloFormulario.textContent = "Agregar Invitado";
  btnSubmit.textContent = "Registrar Asistencia";
  btnCancelar.style.display = "none";
}

//==============================
// GUARDAR (CREAR O EDITAR)
//==============================
formBoda.addEventListener("submit", function (e) {
  e.preventDefault();

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Procesando...";

  const datos = {
    id: idEditando,
    FamiliaDesc: inputFamiliaDesc.value,
    familiaNombre: inputFamiliaNombre.value,
    Pases: parseInt(document.getElementById("pases").value),
  };

  const url = idEditando
    ? "/.netlify/functions/EditarInvitado"
    : "/.netlify/functions/AgregarInvitado";

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      return response.json();
    })
    .then((res) => {
      cancelarEdicion();
      cargarInvitados();
    })
    .catch((err) => {
      console.error(err);
      alert("Ocurrió un error al procesar la solicitud.");
    })
    .finally(() => {
      btnSubmit.disabled = false;
      if (!idEditando) {
        btnSubmit.textContent = "Registrar Asistencia";
      }
    });
});

//==============================
// ELIMINAR
//==============================
function eliminarInvitado(id) {
  if (!confirm("¿Deseas eliminar este invitado?")) return;

  fetch("/.netlify/functions/EliminarInvitado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    })
    .then(() => {
      cargarInvitados();
    })
    .catch((err) => {
      console.error(err);
      alert("No fue posible eliminar el invitado.");
    });
}

//==============================
// COPIAR LINK
//==============================
function copiarLink(texto) {
  navigator.clipboard
    .writeText(texto)
    .then(() => mostrarNotificacion("Enlace copiado correctamente"))
    .catch(() => mostrarNotificacion("No fue posible copiar"));
}

function mostrarNotificacion(msj) {
  const mensaje = document.getElementById("mensajeCopiado");
  mensaje.textContent = msj;
  mensaje.classList.add("mostrar");

  setTimeout(() => {
    mensaje.classList.remove("mostrar");
  }, 2500);
}

//==============================
// INICIO
//==============================
document.addEventListener("DOMContentLoaded", cargarInvitados);
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
