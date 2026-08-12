let invitadoActual = null;
let qrScanner = null;

/* NAVEGACIÓN */
function mostrar(id, btn) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  if (btn) btn.classList.add("active");

  if (id === "qr") iniciarQR();
  if (id === "lista") cargarLista();
}

/* QR */
function iniciarQR() {
  if (qrScanner) return;

  qrScanner = new Html5Qrcode("reader");

  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (txt) => {
      // Limpiar espacios en blanco al inicio o final del texto leído
      const familiaIdentificador = txt ? txt.trim() : "";

      if (!familiaIdentificador) {
        alert("El código QR está vacío o es inválido");
        return;
      }

      // Detener el escáner antes de procesar la búsqueda
      try {
        if (qrScanner) {
          await qrScanner.stop();
          qrScanner = null;
        }
      } catch (err) {
        console.error("Error al detener el lector QR:", err);
      }

      // Pasar directamente el nombre/identificador a la función de búsqueda
      buscarPorFamilia(familiaIdentificador);
    },
  );
}

function buscarPorFamilia(familia) {
  fetch(
    `/.netlify/functions/obtener-invitado-qr?familia=${encodeURIComponent(familia)}`,
  )
    .then((r) => r.json())
    .then((r) => {
      if (!r.ok || r.invitados.length === 0) {
        alert("Familia no encontrada");
        return;
      }

      if (r.invitados.length === 1) {
        seleccionar(r.invitados[0]);
        return;
      }

      mostrar("resultados");

      const cont = document.getElementById("listaResultados");
      cont.innerHTML = "";

      r.invitados.forEach((i) => {
        cont.innerHTML += `
              <div class="result-item" onclick='seleccionar(${JSON.stringify(i)})'>
                <strong>${i.familiades}</strong><br>
                Familia: ${i.familiaidentificador}
              </div>
            `;
      });
    });
}

/* BUSCAR */
function buscar() {
  const v = document.getElementById("familiaManual").value.trim();
  if (v) buscarInvitado(v);
}

function buscarInvitado(nombre) {
  fetch(
    `/.netlify/functions/obtener-invitado-nombre?displayname=${encodeURIComponent(nombre)}`,
  )
    .then((r) => r.json())
    .then((r) => {
      if (!r.ok || r.invitados.length === 0) {
        alert("No encontrado");
        return;
      }

      if (r.invitados.length === 1) {
        seleccionar(r.invitados[0]);
        return;
      }

      mostrar("resultados");
      const cont = document.getElementById("listaResultados");
      cont.innerHTML = "";

      r.invitados.forEach((i) => {
        cont.innerHTML += `
              <div class="result-item" onclick='seleccionar(${JSON.stringify(i)})'>
                <strong>${i.displayname}</strong><br>
                Familia: ${i.familia}
              </div>
            `;
      });
    });
}

/* SELECCIONAR */
function seleccionar(i) {
  invitadoActual = i;
  mostrar("infoBox");

  const usados = i.pasesuti || 0;
  const disponibles = (i.pases || 0) - usados;

  document.getElementById("nombre").textContent = i.displayname;
  document.getElementById("pases").textContent = i.pases;
  document.getElementById("usados").textContent = usados;

  const dispEl = document.getElementById("disponibles");
  dispEl.textContent = disponibles;

  if (disponibles > 0) {
    dispEl.className = "disponibles-ok";
  } else {
    dispEl.className = "disponibles-cero";
  }

  const btn = document.querySelector("#infoBox .btn-primary");
  const estado = document.getElementById("estadoAcceso");

  if (i.rechazo === true) {
    btn.disabled = true;
    btn.textContent = "Acceso Denegado";
    btn.style.opacity = "0.5";

    estado.textContent = "🔴 Invitación rechazada";
    estado.className = "estado-mensaje estado-denegado";
  } else if (i.acepto !== true) {
    btn.disabled = true;
    btn.textContent = "Pendiente";
    btn.style.opacity = "0.5";

    estado.textContent = "🟡 Invitación pendiente de confirmación";
    estado.className = "estado-mensaje estado-pendiente";
  } else if (disponibles <= 0) {
    btn.disabled = true;
    btn.textContent = "Sin pases disponibles";
    btn.style.opacity = "0.5";

    estado.textContent = "🔴 Todos los pases ya fueron utilizados";
    estado.className = "estado-mensaje estado-denegado";
  } else {
    btn.disabled = false;
    btn.textContent = "Registrar Entrada";
    btn.style.opacity = "1";

    estado.textContent = "🟢 Acceso permitido";
    estado.className = "estado-mensaje estado-ok";
  }

  document.getElementById("mensaje").style.display = "none";
}

/* REGISTRAR ENTRADA */
function registrar() {
  if (!invitadoActual) return;

  const usados = invitadoActual.pasesuti || 0;
  const disponibles = (invitadoActual.pases || 0) - usados;

  if (!(invitadoActual.acepto === true && invitadoActual.rechazo === false)) {
    alert("Este invitado no aceptó la invitación.");
    return;
  }

  if (disponibles <= 0) {
    alert("No hay pases disponibles.");
    return;
  }

  const usar = parseInt(document.getElementById("pasesUsar").value);

  if (!usar || usar <= 0) {
    alert("Cantidad inválida");
    return;
  }

  if (usar > disponibles) {
    alert("Excede los pases disponibles");
    return;
  }

  fetch("/.netlify/functions/registrar-acceso", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familia: invitadoActual.familia,
      pasesUsar: usar,
    }),
  })
    .then((r) => r.json())
    .then((r) => {
      if (r.ok) {
        document.getElementById("mensaje").style.display = "block";
        document.getElementById("pasesUsar").value = "";

        invitadoActual.pasesuti = usados + usar;

        seleccionar(invitadoActual);
      }
    });
}

/* LISTA */
let listaGlobal = [];

function cargarLista() {
  fetch("/.netlify/functions/listar-invitados")
    .then((r) => r.json())
    .then((r) => {
      if (!r.ok) return;

      listaGlobal = r.invitados;
      renderTabla(listaGlobal);
    });
}

function renderTabla(data) {
  const tabla = document.getElementById("tabla");
  tabla.innerHTML = "";

  let totalInvitados = 0;
  let totalAceptaron = 0;
  let totalRechazaron = 0;
  let totalPendientes = 0;
  let totalPasesAceptados = 0;

  data.forEach((i) => {
    totalInvitados++;

    const usados = i.pasesuti || 0;
    const disponibles = (i.pases || 0) - usados;

    let acepto = "";
    let rechazo = "";
    let pendiente = "";

    if (i.acepto === true && i.rechazo === false) {
      acepto = "✔";
      totalAceptaron++;
      totalPasesAceptados += i.pases || 0;
    } else if (i.acepto === false && i.rechazo === true) {
      rechazo = "✖";
      totalRechazaron++;
    } else {
      pendiente = "⏳";
      totalPendientes++;
    }

    tabla.innerHTML += `
          <tr>
            <td>${i.familiaNombre}</td>
            <td>${i.FamiliaDesc}</td>
            <td>${i.pases}</td>
            <td>${usados}</td>
            <td>${disponibles}</td>
            <td style="text-align:center;color:var(--verde-exito);font-weight:bold;">${acepto}</td>
            <td style="text-align:center;color:var(--rojo-error);font-weight:bold;">${rechazo}</td>
            <td style="text-align:center;color:var(--amarillo-pendiente);font-weight:bold;">${pendiente}</td>
          </tr>
        `;
  });

  document.getElementById("totalInvitados").textContent = totalInvitados;
  document.getElementById("totalAceptaron").textContent = totalAceptaron;
  document.getElementById("totalRechazaron").textContent = totalRechazaron;
  document.getElementById("totalPendientes").textContent = totalPendientes;
  document.getElementById("totalDisponibles").textContent = totalPasesAceptados;
}

/* FILTROS */
document
  .getElementById("filtroNombre")
  .addEventListener("input", aplicarFiltros);
document
  .getElementById("filtroEstado")
  .addEventListener("change", aplicarFiltros);

function aplicarFiltros() {
  const nombreFiltro = document
    .getElementById("filtroNombre")
    .value.toLowerCase();
  const estadoFiltro = document.getElementById("filtroEstado").value;

  let filtrados = listaGlobal.filter((i) => {
    const coincideNombre =
      i.displayname.toLowerCase().includes(nombreFiltro) ||
      i.familia.toLowerCase().includes(nombreFiltro);

    let coincideEstado = true;

    if (estadoFiltro === "aceptado") {
      coincideEstado = i.acepto === true && i.rechazo === false;
    }

    if (estadoFiltro === "rechazado") {
      coincideEstado = i.acepto === false && i.rechazo === true;
    }

    if (estadoFiltro === "pendiente") {
      coincideEstado = i.acepto === false && i.rechazo === false;
    }

    return coincideNombre && coincideEstado;
  });

  renderTabla(filtrados);
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
