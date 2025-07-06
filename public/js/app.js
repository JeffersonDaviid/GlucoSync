// Helper fetch JSON
const API = (url, opts = {}) =>
	fetch('https://glucosync-8ry3.onrender.com' + url, {
		...opts,
		headers: { 'Content-Type': 'application/json' },
	}).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)));

// ----- Ruteo SPA -----
const sections = [...document.querySelectorAll('section')];
const bottomNav = document.getElementById('bottom-nav');

function show(id) {
	sections.forEach((s) => s.classList.toggle('hidden', s.id !== id));

	// Mostrar/ocultar barra inferior según la pantalla
	const showNav = ['dash', 'control', 'recordatorios', 'perfil'].includes(id);
	bottomNav.classList.toggle('hidden', !showNav);

	// Actualizar elemento activo en la navegación
	document.querySelectorAll('.nav-item').forEach((item) => {
		item.classList.remove('active');
		if (item.dataset.route === id) {
			item.classList.add('active');
		}
	});
}

document.body.addEventListener('click', (e) => {
	if (e.target.dataset.route) {
		e.preventDefault();
		show(e.target.dataset.route);
	}
});

// ----- Estado -----
let token = localStorage.getItem('token');
let registrationData = {}; // Datos del registro multi-paso

// ----- Sistema de notificaciones -----
function showNotification(type, title, message) {
	const notification = document.getElementById('notification');
	const icon = document.getElementById('notification-icon');
	const titleEl = document.getElementById('notification-title');
	const messageEl = document.getElementById('notification-message');

	// Limpiar clases anteriores
	notification.querySelector('.bg-white').className =
		'bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3';
	notification.querySelector('.bg-white').classList.add(`notification-${type}`);

	// Configurar icono según tipo
	const icons = {
		error:
			'<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
		success:
			'<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
		warning:
			'<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
		info: '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
	};

	icon.innerHTML = icons[type] || icons.info;
	titleEl.textContent = title;
	messageEl.textContent = message;

	// Mostrar notificación
	notification.classList.add('notification-show');

	// Auto-ocultar después de 5 segundos
	setTimeout(() => {
		hideNotification();
	}, 5000);
}

function hideNotification() {
	const notification = document.getElementById('notification');
	notification.classList.remove('notification-show');
}

// Event listener para cerrar notificación
document.getElementById('notification-close').addEventListener('click', hideNotification);

// ----- Registro Multi-paso -----
let currentStep = 1;

function updateProgressBar() {
	const progressBar = document.getElementById('progress-bar');
	const currentStepEl = document.getElementById('current-step');
	const currentProgressEl = document.getElementById('current-progress');

	const progress = (currentStep / 3) * 100;
	progressBar.style.width = `${progress}%`;
	currentStepEl.textContent = currentStep;
	currentProgressEl.textContent = Math.round(progress);
}

function showStep(step) {
	// Ocultar todos los pasos
	document
		.querySelectorAll('.registration-step')
		.forEach((s) => s.classList.add('hidden'));

	// Mostrar el paso actual
	document.getElementById(`step-${step}`).classList.remove('hidden');

	currentStep = step;
	updateProgressBar();
}

function validateStep1() {
	const email = document.getElementById('reg-email').value;
	const pass = document.getElementById('reg-pass').value;
	const confirmPass = document.getElementById('reg-confirm-pass').value;

	if (!email || !pass || !confirmPass) {
		showNotification('error', 'Campos requeridos', 'Por favor complete todos los campos');
		return false;
	}

	if (pass.length < 6) {
		showNotification(
			'error',
			'Contraseña muy corta',
			'La contraseña debe tener al menos 6 caracteres'
		);
		return false;
	}

	if (pass !== confirmPass) {
		showNotification(
			'error',
			'Contraseñas no coinciden',
			'Las contraseñas ingresadas no son iguales'
		);
		return false;
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		showNotification('error', 'Email inválido', 'Por favor ingrese un email válido');
		return false;
	}

	registrationData.email = email;
	registrationData.pass = pass;
	return true;
}

function validateStep2() {
	const name = document.getElementById('reg-name').value;
	const dob = document.getElementById('reg-dob').value;
	const diabetes = document.getElementById('reg-diabetes').value;

	if (!name || !dob || !diabetes) {
		showNotification('error', 'Campos requeridos', 'Por favor complete todos los campos');
		return false;
	}

	if (name.length < 2) {
		showNotification(
			'error',
			'Nombre muy corto',
			'El nombre debe tener al menos 2 caracteres'
		);
		return false;
	}

	// Validar que la fecha de nacimiento sea válida
	const birthDate = new Date(dob);
	const today = new Date();
	const age = today.getFullYear() - birthDate.getFullYear();

	if (age < 0 || age > 120) {
		showNotification(
			'error',
			'Fecha inválida',
			'Por favor ingrese una fecha de nacimiento válida'
		);
		return false;
	}

	registrationData.name = name;
	registrationData.dob = dob;
	registrationData.diabetes = diabetes;
	return true;
}

function validateStep3() {
	const weight = document.getElementById('reg-weight').value;
	const height = document.getElementById('reg-height').value;
	const glucoseFreq = document.getElementById('reg-glucose-frequency').value;
	const exerciseFreq = document.getElementById('reg-exercise-frequency').value;

	if (!weight || !height || !glucoseFreq || !exerciseFreq) {
		showNotification('error', 'Campos requeridos', 'Por favor complete todos los campos');
		return false;
	}

	const weightNum = parseFloat(weight);
	const heightNum = parseFloat(height);

	if (weightNum < 20 || weightNum > 300) {
		showNotification('error', 'Peso inválido', 'El peso debe estar entre 20 y 300 kg');
		return false;
	}

	if (heightNum < 0.5 || heightNum > 3.0) {
		showNotification(
			'error',
			'Estatura inválida',
			'La estatura debe estar entre 0.5 y 3.0 metros'
		);
		return false;
	}

	registrationData.weight = weightNum;
	registrationData.height = heightNum;
	registrationData.glucoseFrequency = glucoseFreq;
	registrationData.exerciseFrequency = exerciseFreq;
	return true;
}

// Event listeners para los botones
document.getElementById('btn-step-1').addEventListener('click', () => {
	if (validateStep1()) {
		showStep(2);
	}
});

document.getElementById('btn-step-2').addEventListener('click', () => {
	if (validateStep2()) {
		showStep(3);
	}
});

document.getElementById('btn-back-1').addEventListener('click', () => {
	showStep(1);
});

document.getElementById('btn-back-2').addEventListener('click', () => {
	showStep(2);
});

document.getElementById('btn-final').addEventListener('click', async () => {
	if (validateStep3()) {
		try {
			await API('/api/register', {
				method: 'POST',
				body: JSON.stringify({
					email: registrationData.email,
					pass: registrationData.pass,
					profile: {
						name: registrationData.name,
						dob: registrationData.dob,
						diabetes: registrationData.diabetes,
						weight: registrationData.weight,
						height: registrationData.height,
						glucoseFrequency: registrationData.glucoseFrequency,
						exerciseFrequency: registrationData.exerciseFrequency,
					},
				}),
			});

			showNotification(
				'success',
				'Registro exitoso',
				'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.'
			);

			// Limpiar datos y resetear formulario
			registrationData = {};
			document
				.querySelectorAll('#register input, #register select')
				.forEach((input) => (input.value = ''));

			// Volver al paso 1 y luego al login después de 2 segundos
			setTimeout(() => {
				showStep(1);
				show('login');
			}, 2000);
		} catch (error) {
			showNotification(
				'error',
				'Error en el registro',
				error.message || 'Ocurrió un error al crear tu cuenta. Inténtalo nuevamente.'
			);
		}
	}
});

// Inicializar el registro en el paso 1
document.addEventListener('DOMContentLoaded', () => {
	showStep(1);
});

// ----- Login -----
document.getElementById('form-login').addEventListener('submit', async (e) => {
	e.preventDefault();
	const d = Object.fromEntries(new FormData(e.target));

	try {
		const r = await API('/api/login', { method: 'POST', body: JSON.stringify(d) });
		token = r.token;
		myName = r.name;
		localStorage.setItem('token', token);
		localStorage.setItem('name', myName);
		socket.emit('registroUsuario', myName); // ⬅️ avisamos al panel
		await cargarMediciones();
		show('dash');
		showNotification(
			'success',
			'Bienvenido',
			`Hola ${myName}, has iniciado sesión correctamente`
		);
	} catch (error) {
		showNotification(
			'error',
			'Error de autenticación',
			'Credenciales incorrectas. Verifica tu email y contraseña.'
		);
	}
});

// ----- Logout -----
document.getElementById('btn-logout').addEventListener('click', () => {
	localStorage.removeItem('token');
	localStorage.removeItem('name');
	token = null;
	myName = null;
	show('landing');
	window.location.reload(); // recargar la página para limpiar el estado
});

// ----- Clasificación y color -----
function clasificar(v, perfil = 'diabetes') {
	const thresholds = {
		normal: { low: 70, normalHigh: 140, highHigh: 180 },
		prediabetes: { low: 80, normalHigh: 160, highHigh: 200 },
		diabetes: { low: 90, normalHigh: 180, highHigh: 240 },
	}[perfil] || { low: 70, normalHigh: 140, highHigh: 180 };

	if (v < thresholds.low) return ['Nivel de azúcar peligrosamente bajo', 'blue-500'];
	if (v <= thresholds.normalHigh) return ['Nivel de azúcar normal', 'green-500'];
	if (v <= thresholds.highHigh) return ['Nivel de azúcar alto', 'yellow-400'];
	return ['Nivel de azúcar crítico', 'red-500'];
}

// ----- Render listado + resumen -----
async function cargarMediciones() {
	const datos = await API(`/api/measure?token=${token}`);
	const ul = document.getElementById('list-measures');
	ul.innerHTML = '';
	let suma = 0;
	datos.forEach((m) => {
		suma += m.value;
		const [txt, color] = clasificar(m.value);
		const li = document.createElement('li');
		li.className = 'bg-white rounded-md shadow flex';
		li.innerHTML = `
      <div class="w-2 rounded-l-md bg-${color}"></div>
      <div class="flex-1 p-3">
        <div class="text-xl font-bold">${m.value.toFixed(
					1
				)} <small class="text-xs">mg/dL</small></div>
        <div class="text-sm">${txt}</div>
        <div class="text-xs text-gray-500">${new Date(m.date).toLocaleString()}</div>
      </div>`;
		ul.appendChild(li);
	});
	document.getElementById('avg').textContent = datos.length
		? Math.round(suma / datos.length)
		: '--';
	document.getElementById('total').textContent = datos.length;
}

// ----- Modal registro manual -----
const modal = document.getElementById('modal-manual');
document.getElementById('btn-add').onclick = () => modal.classList.remove('hidden');
document.getElementById('cancel').onclick = () => modal.classList.add('hidden');
document.getElementById('form-measure').addEventListener('submit', async (e) => {
	e.preventDefault();
	const v = parseFloat(document.getElementById('valorGlu').value);
	await API('/api/measure', {
		method: 'POST',
		body: JSON.stringify({ token, value: v }),
	});
	e.target.reset();
	modal.classList.add('hidden');
	cargarMediciones();
});

// ----- Overlay mensajería dispositivos -----
const ov = document.getElementById('overlay'),
	ovText = document.getElementById('ov-text');
function showOv(msg, time) {
	ovText.textContent = msg;
	ov.classList.remove('hidden');
	if (time) setTimeout(() => ov.classList.add('hidden'), time);
}

// ----- Socket.IO (simulación Bluetooth) -----
const socket = io();
let myName = localStorage.getItem('name'); // nombre guardado (si existía)

// cuando el socket (re)conecte, manda el nombre si lo tenemos
socket.on('connect', () => {
	if (myName) socket.emit('registroUsuario', myName);
});

socket.on('movil:sync', () => {
	showOv('Sincronizando dispositivo…');
	setTimeout(() => showOv('Dispositivo listo para usar', 2000), 3000);
});
socket.on('movil:start', () => showOv('Midiendo glucosa…'));
socket.on('movil:valor', async (v) => {
	ov.classList.add('hidden');
	await API('/api/measure', {
		method: 'POST',
		body: JSON.stringify({ token, value: v }),
	});
	cargarMediciones();
});

// Manejar limpieza del sistema desde el panel
socket.on('system:clearAll', () => {
	// Limpiar localStorage
	localStorage.removeItem('token');
	localStorage.removeItem('name');

	// Reset variables
	token = null;
	myName = null;
	registrationData = {};

	// Mostrar notificación
	showNotification(
		'warning',
		'Sistema reiniciado',
		'Todos los datos han sido eliminados por el administrador. Debes registrarte nuevamente.'
	);

	// Volver al landing
	show('landing');

	// Limpiar formularios
	document.querySelectorAll('input, select').forEach((input) => {
		input.value = '';
	});

	// Reset registro al paso 1
	if (typeof showStep === 'function') {
		showStep(1);
	}
});

// ----- Auto-login si ya había token -----
if (token) {
	cargarMediciones().then(() => show('dash'));
}
