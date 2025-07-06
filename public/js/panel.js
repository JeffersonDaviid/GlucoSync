const socket = io();
const listaContainer = document.getElementById('lista');
const noUsersMessage = document.getElementById('no-users');
const modal = document.getElementById('modal-confirm');
const notification = document.getElementById('notification');

// Event listeners para los botones principales
document.getElementById('btn-clear-all').addEventListener('click', showConfirmModal);
document.getElementById('btn-refresh').addEventListener('click', refreshPanel);
document.getElementById('modal-cancel').addEventListener('click', hideConfirmModal);
document.getElementById('modal-confirm-btn').addEventListener('click', clearAllData);
document.getElementById('notification-close').addEventListener('click', hideNotification);

// Cerrar modal al hacer clic fuera
modal.addEventListener('click', (e) => {
	if (e.target === modal) {
		hideConfirmModal();
	}
});

socket.on('listaActivos', (lista) => {
	listaContainer.innerHTML = '';

	if (lista.length === 0) {
		noUsersMessage.style.display = 'block';
		return;
	}

	noUsersMessage.style.display = 'none';

	lista.forEach(([id, { nombre }]) => {
		const userCard = createUserCard(id, nombre);
		listaContainer.appendChild(userCard);
	});
});

// Funciones para el modal de confirmación
function showConfirmModal() {
	modal.classList.remove('hidden');
	document.body.style.overflow = 'hidden';
}

function hideConfirmModal() {
	modal.classList.add('hidden');
	document.body.style.overflow = 'auto';
}

// Función para limpiar todos los datos
function clearAllData() {
	hideConfirmModal();

	// Mostrar notificación de procesamiento
	showNotification('info', 'Procesando...', 'Limpiando todos los datos del sistema...');

	// Emitir evento para limpiar en el servidor
	socket.emit('panel:clearAll');

	// Limpiar la lista local inmediatamente
	listaContainer.innerHTML = '';
	noUsersMessage.style.display = 'block';

	// Simular éxito después de un breve delay
	setTimeout(() => {
		showNotification(
			'success',
			'Datos eliminados',
			'Se han eliminado todos los registros del sistema correctamente.'
		);
	}, 1500);
}

// Función para actualizar el panel
function refreshPanel() {
	showNotification('info', 'Actualizando...', 'Obteniendo datos más recientes...');
	socket.emit('panel:refresh');

	setTimeout(() => {
		showNotification('success', 'Actualizado', 'Panel actualizado correctamente.');
	}, 1000);
}

// Sistema de notificaciones
function showNotification(type, title, message) {
	const icon = document.getElementById('notification-icon');
	const titleEl = document.getElementById('notification-title');
	const messageEl = document.getElementById('notification-message');

	// Limpiar clases anteriores
	const notificationCard = notification.querySelector('.bg-white');
	notificationCard.className =
		'bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3';

	// Agregar clase según tipo
	switch (type) {
		case 'success':
			notificationCard.classList.add('border-green-500');
			break;
		case 'error':
			notificationCard.classList.add('border-red-500');
			break;
		case 'info':
			notificationCard.classList.add('border-blue-500');
			break;
		default:
			notificationCard.classList.add('border-gray-500');
	}

	// Configurar icono según tipo
	const icons = {
		success:
			'<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
		error:
			'<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
		info: '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
	};

	icon.innerHTML = icons[type] || icons.info;
	titleEl.textContent = title;
	messageEl.textContent = message;

	// Mostrar notificación
	notification.classList.remove('translate-x-full');
	notification.classList.add('translate-x-0');

	// Auto-ocultar después de 4 segundos
	setTimeout(() => {
		hideNotification();
	}, 4000);
}

function hideNotification() {
	notification.classList.remove('translate-x-0');
	notification.classList.add('translate-x-full');
}

function createUserCard(id, nombre) {
	const card = document.createElement('div');
	card.className =
		'bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow';

	card.innerHTML = `
		<div class="flex flex-col space-y-4">
			<!-- Header del usuario -->
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-medium text-gray-900">${nombre}</h3>
						<p class="text-sm text-gray-500">ID: ${id.slice(0, 8)}</p>
					</div>
				</div>
				<div class="flex items-center space-x-2">
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						<span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
						Activo
					</span>
				</div>
			</div>
			
			<!-- Controles de acción -->
			<div class="flex flex-wrap gap-2">
				<button id="sync-${id}" class="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					Sincronizar
				</button>

				<button id="measure-${id}" class="flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
					Iniciar Medición
				</button>
			</div>
			
			<!-- Input para enviar valor manual -->
			<div class="bg-gray-50 rounded-lg p-3">
				<label class="block text-sm font-medium text-gray-700 mb-2">Enviar valor manual de glucosa</label>
				<div class="flex space-x-2">
					<input id="valor-${id}" type="number" step="0.1" placeholder="mg/dL" 
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm">
					<button id="send-${id}" class="flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-md shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
						</svg>
						Enviar
					</button>
				</div>
			</div>
		</div>
	`;

	// Agregar event listeners
	setupEventListeners(id, card);

	return card;
}

function setupEventListeners(userId, card) {
	// Botón Sync
	card.querySelector(`#sync-${userId}`).addEventListener('click', () => {
		socket.emit('panel:sync', userId);
		showFeedback(card, 'Sincronizando dispositivo...', 'info');
	});

	// Botón Medir
	card.querySelector(`#measure-${userId}`).addEventListener('click', () => {
		socket.emit('panel:start', userId);
		showFeedback(card, 'Iniciando medición...', 'info');
	});

	// Botón Enviar valor
	card.querySelector(`#send-${userId}`).addEventListener('click', () => {
		const valorInput = card.querySelector(`#valor-${userId}`);
		const valor = parseFloat(valorInput.value);

		if (!Number.isFinite(valor) || valor <= 0) {
			showFeedback(card, 'Por favor ingrese un valor válido', 'error');
			return;
		}

		if (valor < 20 || valor > 600) {
			showFeedback(card, 'El valor debe estar entre 20 y 600 mg/dL', 'error');
			return;
		}

		socket.emit('panel:valor', { idDestino: userId, valor: valor });
		showFeedback(card, `Valor ${valor} mg/dL enviado correctamente`, 'success');
		valorInput.value = '';
	});

	// Enter key en el input
	card.querySelector(`#valor-${userId}`).addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			card.querySelector(`#send-${userId}`).click();
		}
	});
}

function showFeedback(card, message, type) {
	// Remover feedback anterior si existe
	const existingFeedback = card.querySelector('.feedback-message');
	if (existingFeedback) {
		existingFeedback.remove();
	}

	// Crear nuevo feedback
	const feedback = document.createElement('div');
	feedback.className = `feedback-message mt-2 p-2 rounded-md text-sm ${getFeedbackClass(
		type
	)}`;
	feedback.textContent = message;

	// Agregar al final de la tarjeta
	card.querySelector('.bg-gray-50').appendChild(feedback);

	// Remover después de 3 segundos
	setTimeout(() => {
		if (feedback.parentNode) {
			feedback.remove();
		}
	}, 3000);
}

function getFeedbackClass(type) {
	switch (type) {
		case 'success':
			return 'bg-green-100 text-green-800 border border-green-200';
		case 'error':
			return 'bg-red-100 text-red-800 border border-red-200';
		case 'info':
			return 'bg-blue-100 text-blue-800 border border-blue-200';
		default:
			return 'bg-gray-100 text-gray-800 border border-gray-200';
	}
}
