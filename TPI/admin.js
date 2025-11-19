// Rutas
const MOCKAPI_BASE_A = "https://6911ec2552a60f10c81fd632.mockapi.io/tpi/v1"; // users y menu
const MOCKAPI_BASE_B = "https://69126ba052a60f10c8219d66.mockapi.io/api/v1"; // orders
const USERS_URL = `${MOCKAPI_BASE_A}/users`;
const MENU_URL = `${MOCKAPI_BASE_A}/menu`;
const ORDERS_URL = `${MOCKAPI_BASE_B}/orders`;

// Elementos DOM
const pedidosBody = document.getElementById("pedidos-body");
const btnLogout = document.getElementById("btn-logout");
const form = document.getElementById("form-nuevo");
const tablaBody = document.getElementById("tabla-body");
const nombreInput = document.getElementById("nombre");
const tipoInput = document.getElementById("tipo");
const precioInput = document.getElementById("precio");
const disponibleInput = document.getElementById("disponible");
const editIdInput = document.getElementById("edit-id");
const btnGuardar = document.getElementById("btn-guardar");

// Verificar sesion y rol
const session = JSON.parse(localStorage.getItem("pizzeria_session"));
if (!session || session.role !== "admin") {
  alert("Acceso denegado. Solo administradores.");
  window.location.href = "index.html";
}

// Cerrar sesion
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("pizzeria_session");
  window.location.href = "index.html";
});

// Cargar productos existentes
async function cargarMenu() {
  try {
    const resp = await fetch(MENU_URL);
    const productos = await resp.json();
    renderTabla(productos);
  } catch (err) {
    console.error("Error al cargar menú:", err);
  }
}

// Renderizamos la tabla
function renderTabla(productos) {
  tablaBody.innerHTML = "";
  productos.forEach((prod) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${prod.nombre}</td>
      <td>${prod.tipo}</td>
      <td>$${prod.precio}</td>
      <td>${prod.disponible ? "Sí" : "No"}</td>
      <td>
        <button data-id="${prod.id}" class="btn-edit">Editar</button>
        <button data-id="${prod.id}" class="btn-del">Eliminar</button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });

  // Editar - eliminar
  document.querySelectorAll(".btn-edit").forEach((btn) => btn.addEventListener("click", () => cargarParaEditar(btn.dataset.id)));
  document.querySelectorAll(".btn-del").forEach((btn) => btn.addEventListener("click", () => eliminarProducto(btn.dataset.id)));
}

// Guardar o actualizar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const producto = {
    nombre: nombreInput.value.trim(),
    tipo: tipoInput.value,
    precio: parseFloat(precioInput.value),
    disponible: disponibleInput.value === "true",
  };

  const idEdit = editIdInput.value;

  // editamos y lo mandamos a mockapi
  try {
    if (idEdit) {
      await fetch(`${MENU_URL}/${idEdit}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
      alert("Producto actualizado");
    } 
    // creamos un prod y lo mandamos a mockapi
    else
    {
      await fetch(MENU_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
      alert("Producto agregado");
    }

    form.reset();
    editIdInput.value = "";
    btnGuardar.textContent = "Agregar producto";
    cargarMenu();
  }
  // Si algo falla muestra el error en consola
  catch (err) 
  {
    console.error("Error al guardar:", err);
  }
});

// Cargar datos para editar
async function cargarParaEditar(id) {
  try {
    const resp = await fetch(`${MENU_URL}/${id}`);
    const prod = await resp.json();

    nombreInput.value = prod.nombre;
    tipoInput.value = prod.tipo;
    precioInput.value = prod.precio;
    disponibleInput.value = prod.disponible.toString();
    editIdInput.value = prod.id;
    btnGuardar.textContent = "Actualizar producto";
  }
  catch (err)
  {
    console.error("Error al cargar producto:", err);
  }
}

// Eliminar producto
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar este producto?")) return;

  try {
    await fetch(`${MENU_URL}/${id}`, { method: "DELETE" });
    alert("Producto eliminado");
    cargarMenu();
  } catch (err) {
    console.error("Error al eliminar:", err);
  }
}

// Inicio
cargarMenu();

// Cargar pedidos
async function cargarPedidos() {
  try {
    const [pedidosResp, usersResp] = await Promise.all([
      fetch(ORDERS_URL),
      fetch(USERS_URL)
    ]);

    const pedidos = await pedidosResp.json();
    const users = await usersResp.json();

    renderPedidos(pedidos, users);
  } catch (err) {
    console.error("Error al cargar pedidos:", err);
  }
}

// Renderizar tabla de pedidos
function renderPedidos(pedidos, users) {
    const pedidosBody = document.getElementById("pedidos-body");
  pedidosBody.innerHTML = "";

  pedidos.forEach((p) => {
    if (p.estado === "entregado") return;
    const user = users.find((u) => u.id === p.userId);
    const userName = user ? user.nombre : "Desconocido";

    const itemsHtml = p.items
      .map((i) => `${i.nombre} (x${i.cantidad})`)
      .join("<br>");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${userName}</td>
      <td>${itemsHtml}</td>
      <td>$${p.total}</td>
      <td>${p.estado}</td>
      <td>
        <button class="btn-cambiar" data-id="${p.id}" data-estado="${p.estado}">Cambiar estado</button>
      </td>
    `;
    pedidosBody.appendChild(tr);
  });

  document.querySelectorAll(".btn-cambiar").forEach((btn) =>
    btn.addEventListener("click", () => cambiarEstado(btn.dataset.id, btn.dataset.estado))
  );
}

// Cambiar estado
async function cambiarEstado(id, estadoActual) {
  let nuevoEstado;
  if (estadoActual === "pendiente") nuevoEstado = "en preparación";
  else if (estadoActual === "en preparación") nuevoEstado = "entregado";
  else {
    alert("Este pedido ya está entregado");
    return;
  }

  try {
    await fetch(`${ORDERS_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    alert(`Estado cambiado a "${nuevoEstado}"`);
    cargarPedidos();
  } catch (err) {
    console.error("Error al cambiar estado:", err);
  } 
}

// Cargar todo al iniciar
cargarMenu();
cargarPedidos();

const btnVolver = document.getElementById("btn-volver");
const ctx = document.getElementById("grafico-pedidos");

// botones
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("pizzeria_session");
  window.location.href = "index.html";
});

// Cargar y graficar
async function cargarPedidos() {
  try {
    const [pedidosResp, usersResp] = await Promise.all([
      fetch(ORDERS_URL),
      fetch(USERS_URL)
    ]);

    const pedidos = await pedidosResp.json();
    const users = await usersResp.json();

    console.log("Pedidos obtenidos:", pedidos);
    renderPedidos(pedidos, users);
  } 
  catch (err)
  {
    console.error("Error al cargar pedidos:", err);
  }
}

function graficar(pedidos) {
  const estados = { pendiente: 0, "en preparación": 0, entregado: 0 };

  pedidos.forEach(p => {
    if (estados[p.estado] !== undefined) {
      estados[p.estado]++;
    }
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(estados),
      datasets: [{
        label: "Cantidad de pedidos",
        data: Object.values(estados),
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


cargarPedidos();

