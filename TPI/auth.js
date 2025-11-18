// Rutas
const MOCKAPI_BASE = "https://6911ec2552a60f10c81fd632.mockapi.io/tpi/v1"; // users y menu
const USERS_URL = `${MOCKAPI_BASE}/users`;

// Elementos DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMsg = document.getElementById('login-msg');
const regMsg = document.getElementById('reg-msg');

// Registro - evento para cuando el usuario hace submit en el formulario de registro
registerForm.addEventListener('submit', async (e) => {e.preventDefault();
  regMsg.textContent = '';

  // Obtener los valores que el usuario escribio
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('role').value;

  try {
    // Verificamos si email ya existe (busqueda local)
    const allResp = await fetch(USERS_URL); // Con el await le decimos al codigo que espere un resultado antes de continuar. Y el fetch pide info al sv. (MockAPI)
    const allUsers = await allResp.json();
    
    // Chequeamos que el email no de null y convertimos el email a minusculas.
    const exists = allUsers.some(u => (u.email || "").toLowerCase() === email);

    if (exists) {
      regMsg.textContent = 'Ese email ya está registrado.';
      return;
    }

    // Creamos el usuario y lo enviamos a MockAPI con metodo POST
    const newUser = { nombre, email, password, role };
    const createResp = await fetch(USERS_URL, {method: 'POST', headers: { 'Content-Type': 'application/json' },body: JSON.stringify(newUser)});

    if (!createResp.ok) throw new Error('Error creando usuario');

    // Guardamos sesion local (simulamos login)
    const created = await createResp.json();
    saveSession({ id: created.id, nombre: created.nombre, email: created.email, role: created.role });

    // Rediirgir segun rol
    redirectByRole(created.role);
  } 
  // Si algo falla muestra el error en consola y tira error al usuario.
  catch (err) 
  {
    console.error(err);
    regMsg.textContent = 'Ocurrió un error al registrarse.';
  }
});

// Login - evento para cuando el usuario hace submit en el formulario de login
loginForm.addEventListener('submit', async (e) => {e.preventDefault();
  loginMsg.textContent = '';

  // Obtener los valores que el usuaro escribio
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  try {
    // Buscar usuario por email utilizando MockAPI
    const resp = await fetch(`${USERS_URL}?email=${encodeURIComponent(email)}`);
    const users = await resp.json();
    
    // Validacion
    if (users.length === 0) {
      loginMsg.textContent = 'Email no registrado.';
      return;
    }

    //Tomamos el usuario (primera posicion del array)
    const user = users[0];

    // Validamos la password
    if (user.password !== password) {
      loginMsg.textContent = 'Password incorrecta.';
      return;
    }

    // Guardar sesion y redirigir
    saveSession({ id: user.id, nombre: user.nombre, email: user.email, role: user.role });
    redirectByRole(user.role);
  }
  
  // Si algo falla muestra el error en consola y tira error al usuario.
  catch (err) 
  {
    console.error(err);
    loginMsg.textContent = 'Ocurrió un error al iniciar sesión.';
  }
});

// Funciones
function saveSession(userObj) {
  // Guardamos lo minimo en localStorage para "mantener sesion"
  localStorage.setItem('pizzeria_session', JSON.stringify(userObj));
}

// Redirige según rol
function redirectByRole(role) {
  if (role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'menu.html';
  }
}