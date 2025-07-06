// npm i express nanoid cors socket.io
import cors from 'cors';
import express from 'express';
import { nanoid } from 'nanoid';
import { createServer } from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';

const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== “Base de datos” en memoria =====
const users = []; // { id,email,pass,profile:{} }
const sessions = new Map(); // token => userId
const measures = []; // { userId,value,date }

function auth(token) {
	const uid = sessions.get(token);
	if (!uid) throw 'unauth';
	return uid;
}

// ---------- API ----------
app.post('/api/register', (req, res) => {
	const { email, pass, profile } = req.body;
	if (users.find((u) => u.email === email.toLowerCase())) return res.status(409).end();
	users.push({ id: nanoid(), email: email.toLowerCase(), pass, profile });
	res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
	const { email, pass } = req.body;
	const u = users.find((x) => x.email === email.toLowerCase() && x.pass === pass);
	if (!u) return res.status(401).end();
	const token = nanoid();
	sessions.set(token, u.id);
	res.json({ token, userId: u.id, name: u.profile.name }); // <── añadimos name
});

app.post('/api/measure', (req, res) => {
	try {
		const uid = auth(req.body.token);
		measures.unshift({ userId: uid, value: req.body.value, date: new Date() });
		res.json({ ok: true });
	} catch {
		res.status(401).end();
	}
});

app.get('/api/measure', (req, res) => {
	try {
		const uid = auth(req.query.token);
		res.json(measures.filter((m) => m.userId === uid));
	} catch {
		res.status(401).end();
	}
});

// ---------- SOCKET.IO (panel <-> móvil) ----------
const usuarios = new Map(); // socket.id => {nombre}

io.on('connection', (sock) => {
	sock.on('registroUsuario', (nombre) => {
		usuarios.set(sock.id, { nombre });
		io.emit('listaActivos', [...usuarios.entries()]);
	});

	// señales provenientes del panel
	sock.on('panel:sync', (id) => io.to(id).emit('movil:sync'));
	sock.on('panel:start', (id) => io.to(id).emit('movil:start'));
	sock.on('panel:valor', ({ idDestino, valor }) =>
		io.to(idDestino).emit('movil:valor', valor)
	);

	// Limpiar todos los datos del sistema
	sock.on('panel:clearAll', () => {
		console.log('🧹 Limpiando todos los datos del sistema...');

		// Limpiar base de datos en memoria
		users.length = 0;
		sessions.clear();
		measures.length = 0;

		// Desconectar todos los usuarios
		usuarios.clear();

		// Notificar a todos los clientes que se desconecten
		io.emit('system:clearAll');

		// Actualizar lista vacía
		io.emit('listaActivos', []);

		console.log('✅ Todos los datos han sido eliminados');
	});

	// Refrescar panel
	sock.on('panel:refresh', () => {
		io.emit('listaActivos', [...usuarios.entries()]);
	});

	sock.on('disconnect', () => {
		usuarios.delete(sock.id);
		io.emit('listaActivos', [...usuarios.entries()]);
	});
});

http.listen(3000, () => console.log('Servidor listo en http://localhost:3000'));

const publicDir = path.join(process.cwd(), 'public');

/* ✅  Alias opcional para evitar “.html” */
app.get('/panel', (_, res) => res.sendFile(path.join(publicDir, 'panel.html')));
app.get('/client', (_, res) => res.sendFile(path.join(publicDir, 'index.html'))); // por si necesitas
