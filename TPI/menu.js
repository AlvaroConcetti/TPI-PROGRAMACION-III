// Rutas
const MOCKAPI_BASE_A = "https://6911ec2552a60f10c81fd632.mockapi.io/tpi/v1"; // users y menu
const MOCKAPI_BASE_B = "https://69126ba052a60f10c8219d66.mockapi.io/api/v1"; // orders
const MENU_URL = `${MOCKAPI_BASE_A}/menu`;
const ORDERS_URL = `${MOCKAPI_BASE_B}/orders`;

// Elementos DOM
const menuContainer = document.getElementById("menu-container");
const carritoSection = document.getElementById("carrito-section");
const carritoLista = document.getElementById("carrito-lista");
const carritoTotal = document.getElementById("carrito-total");
const btnVerCarrito = document.getElementById("btn-ver-carrito");
const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
const btnEnviarPedido = document.getElementById("btn-enviar-pedido");
const btnLogout = document.getElementById("btn-logout");

// Declaramos el carrito como array vacio
let carrito = [];

// Verificacion inicio de sesion
const session = JSON.parse(localStorage.getItem("pizzeria_session"));
if (!session) {
  // Si no hay sesión activa, redirigir al login
  window.location.href = "index.html";
}

// Cargar menu desde MockAPI
async function cargarMenu() {
  try {
    const resp = await fetch(MENU_URL);
    const productos = await resp.json();
    renderMenu(productos);
  } 
  catch (err) 
  {
    console.error(err);
    menuContainer.innerHTML = "<p>Error al cargar el menú.</p>";
  }
}

// Renderizar las cards
function renderMenu(productos) {
  menuContainer.innerHTML = ""; // limpiar antes de renderizar
  
  productos.forEach((prod) => {
    if (!prod.disponible) return; // solo mostrar disponibles

    //Creamos la card y la insertamos en menuContainer 
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${prod.nombre}</h3>
      <p>Tipo: ${prod.tipo}</p>
      <p>Precio: $${prod.precio}</p>
      <button data-id="${prod.id}">Agregar al carrito</button>
    `;
    menuContainer.appendChild(card);

    // Evento de agregar al carrito
    card.querySelector("button").addEventListener("click", () => agregarAlCarrito(prod));
  });
}

// Agregar producto al carrito
function agregarAlCarrito(producto) {
  const existente = carrito.find((p) => p.id === producto.id); // Busca si el prod ya existe
  if (existente) {
    existente.cantidad++; // Si existe aumenta la cantidad
  }
  else 
  {
    carrito.push({ ...producto, cantidad: 1 }); // Si no, suma 1
  }
  actualizarCarritoUI(); // actualizamos el carro
}

// Actualizar visualizacion del carrito 
function actualizarCarritoUI() {
  carritoLista.innerHTML = ""; // Limpia la lista del carrito
  let total = 0;

  carrito.forEach((item, index) => {const li = document.createElement("li");
    li.innerHTML = `
      ${item.nombre} (x${item.cantidad}) - $${item.precio * item.cantidad}
      <button class="btn-eliminar-item" data-index="${index}">❌</button>
    `; // Recorre el carrito y pro cada item agrega los datos correspondientes
    carritoLista.appendChild(li);
    total += item.precio * item.cantidad; // calula el total
  });

  carritoTotal.textContent = total; // muestra

  // Eliminar producto
  document.querySelectorAll(".btn-eliminar-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = e.target.dataset.index; //obtenemos el indice del prodocto que queremos eliminar
      carrito.splice(i, 1); // elimina el producto del indice 'i'
      actualizarCarritoUI(); // vuelve a renderizar
    });
  });
}

// Mostrar carro
btnVerCarrito.addEventListener("click", () => {
  carritoSection.style.display = "block";
});

// Ocultar carrito
btnCerrarCarrito.addEventListener("click", () => {
  carritoSection.style.display = "none";
});

// Enviar pedido
btnEnviarPedido.addEventListener("click", async () => {
  // Validacin
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  // Construccion del pedido
  const pedido = {
    userId: session.id, // Toma el id del user
    items: carrito.map((i) => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
    total: carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0), // recorremos el carro sumando las unidadsed
    estado: "pendiente"
  };

  // Enviamos el pedido a MockAPI
  try {
    const resp = await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    if (!resp.ok) throw new Error("Error al enviar pedido");

    carrito = []; // limpiar carrito
    actualizarCarritoUI(); // Acutualiza el carrito
    carritoSection.style.display = "none"; // Oculta el carrito
    alert("Pedido enviado correctamente");
  } 
  // Si algo falla muestra el error en consola y tira error al usuario.
  catch (err) 
  {
    console.error(err);
    alert("Error al enviar pedido.");
  }
});

// Cerrar sesion
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("pizzeria_session");
  window.location.href = "index.html";
});

// Inicializar
cargarMenu();
