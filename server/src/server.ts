import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as socketio from 'socket.io';

import { serverConfig } from './server-config';
import { authenticationCtrl } from './authentication-controller';

const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);

const port = serverConfig.httpServer.port;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

io.sockets.on('connection', (socket) => {
	console.log('Użytkownik podłączył się do serwera');

	socket.on('disconnect', (socket) => {
		console.log('Użytkownik odłączył się od serwera');
	});
	socket.on('login', (data) => {
		console.log('Event(\'login\'): ' + JSON.stringify(data));

		authenticationCtrl.authenticateRequest(data.token, (err, value) => {
			if (err) {
				console.log('Event(\'login\'): błąd autentykacji użytkownika');
			}
			else {
				io.sockets.emit('login', { type: 'login', time: new Date(), login: value.uz_login, text: 'zalogował się' });
			}
		});
	});
	socket.on('message', (data) => {
		console.log('Event(\'message\'): ' + JSON.stringify(data));

		authenticationCtrl.authenticateRequest(data.token, (err, value) => {
			if (err) {
				console.log('Event(\'message\'): błąd autentykacji użytkownika');
			}
			else {
				io.sockets.emit('message', { type: 'message', time: new Date(), login: value.uz_login, text: data.text });
			}
		});
	});
});

// CORS
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.post('/api/user-login', (req, res) => {
	authenticationCtrl.login(req).subscribe(value => {
		res.json({ status: 0, message: 'Poprawnie zalogowano użytkownika.', data: value.data });
	}, (error: Error) => {
		res.json({ status: (-1), message: error.message });
	});
});
app.post('/api/user-register', (req, res) => {
	authenticationCtrl.register(req).subscribe(value => {
		res.json({ status: 0, message: 'Poprawnie zarejestrowano nowego użytkownika.' });
	}, (error: Error) => {
		res.json({ status: (-1), message: error.message });
	});
});

server.listen(port, function () {
	console.log(`Serwer uruchomiony http://localhost:${port}/`);
});
