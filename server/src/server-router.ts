import * as express from 'express';

import { stringTools } from './string-tools';
import { authenticationCtrl } from './authentication-controller';
import { contactsCtrl } from './contacts-controller';
import { socketIoWraper } from './socket-io-wraper';

const serverRouter = express.Router();

// CORS
serverRouter.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Access-Token');
	next();
});
/**
 * Logowanie użytkownika.
 * 
 * @param req.body.email
 * @param req.body.password
 */
serverRouter.post('/user-login', (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.email || req.body.email === '') {
			return false;
		}
		if (!req.body.password || req.body.password === '') {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		authenticationCtrl.login({
			email: req.body.email,
			password: req.body.password
		}).subscribe(value => {
			res.json({ status: 0, message: 'Poprawnie zalogowano użytkownika.', data: value.data });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});
/**
 * Rejestracja nowego użytkownika.
 * 
 * @param req.body.login
 * @param req.body.email
 * @param req.body.password
 */
serverRouter.post('/user-register', (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.login || req.body.login === '') {
			return false;
		}
		if (!req.body.email || req.body.email === '') {
			return false;
		}
		if (!req.body.password || req.body.password === '') {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		authenticationCtrl.register({
			login: req.body.login,
			email: req.body.email,
			password: req.body.password
		}).subscribe(value => {
			res.json({ status: 0, message: 'Poprawnie zarejestrowano nowego użytkownika.' });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});
/**
 * Pobranie listy kontaktów.
 * 
 * @param req.body.type 'active'   - lista zaakceptowanych kontaktów,
 *                      'send'     - lista wysłanych przez użytkownika kontaktów niezaakceptowanych,
 *                      'received' - lista otrzymanych przez użytkownika kontaktów niezaakceptowanych,
 */
serverRouter.post('/contacts-list', authenticationCtrl.authenticateRequest, (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.type || (req.body.type !== 'active' && req.body.type !== 'send' && req.body.type !== 'received')) {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		contactsCtrl.find(req).subscribe(value => {
			let data = value.data.map((element: any) => {
				return {
					contactId: element.ko_id,
					userId: element.uz_id,
					login: element.uz_login
				};
			});
			res.json({ status: 0, message: 'Lista kontaktów.', data: data });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});
/**
 * Lista użytkowników których można zaprosić do kontaktów (jeszcze nie wysłano
 * im zaproszenia).
 * 
 * @param req.body.login
 */
serverRouter.post('/contacts-find-users', authenticationCtrl.authenticateRequest, (req, res) => {
	contactsCtrl.findUsersNotInContacts(req).subscribe(value => {
		let data = value.data.map((element: any) => {
			return {
				id: element.uz_id,
				login: element.uz_login
			};
		});
		res.json({ status: 0, message: 'Lista użytkowników.', data: data });
	}, (error: Error) => {
		res.json({ status: (-1), message: error.message });
	});
});
/**
 * Liczba otrzymanych zaproszeń do kontaktów oczekujących na akceptację.
 */
serverRouter.post('/contacts-num-waiting-invitations', authenticationCtrl.authenticateRequest, (req, res) => {
	contactsCtrl.getNumWaitingInvitations(req).subscribe(value => {
		res.json({ status: 0, message: value.message, data: value.data });
	}, (error: Error) => {
		res.json({ status: (-1), message: error.message });
	});
});
/**
 * Zaproszenie użytkownika do kontaktów.
 * 
 * @param req.body.userId
 */
serverRouter.post('/contacts-invite-users', authenticationCtrl.authenticateRequest, (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.userId || !stringTools.isValidInt(req.body.userId)) {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		contactsCtrl.inviteUser(req).subscribe(value => {
			if (value.status === 0) {
				// wysłanie powiadomienia do zaproszonego użytkownika
				socketIoWraper.getAll().forEach(socket => {
					if (socket['userId'] && socket['userId'] === Number(req.body.userId)) {
						socket.emit('contact-invite', { type: 'contact-invite', time: new Date() });
					}
				});
			}
			res.json({ status: 0, message: value.message, data: value.data });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});
/**
 * Usunięcie użytkownika z kontaktów.
 * 
 * @param req.body.contactId
 */
serverRouter.post('/contacts-delete-users', authenticationCtrl.authenticateRequest, (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.contactId || !stringTools.isValidInt(req.body.contactId)) {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		contactsCtrl.deteleUser(req).subscribe(value => {
			if (value.status === 0) {
				// wysłanie powiadomienia do usuniętego użytkownika
				socketIoWraper.getAll().forEach(socket => {
					if (socket['userId'] && socket['userId'] === Number(req.body.userId)) {
						socket.emit('contact-invite', { type: 'contact-invite', time: new Date() });
					}
				});
				// wysłanie powiadomienia do użytkownika który usuwał
				socketIoWraper.getAll().forEach(socket => {
					if (socket['userId'] && socket['userId'] === Number(req['decoded'].uz_id)) {
						socket.emit('contact-invite', { type: 'contact-invite', time: new Date() });
					}
				});
			}
			res.json({ status: 0, message: value.message, data: value.data });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});
/**
 * Zaakceptowanie zaproszenia do kontaktów.
 * 
 * @param req.body.contactId
 */
serverRouter.post('/contacts-confirm-users', authenticationCtrl.authenticateRequest, (req, res) => {
	const validateParams = (req): boolean => {
		if (!req.body.contactId || !stringTools.isValidInt(req.body.contactId)) {
			return false;
		}

		return true;
	};

	if (validateParams(req)) {
		contactsCtrl.confirmUser(req).subscribe(value => {
			if (value.status === 0) {
				// wysłanie powiadomienia do użytkownika którego zaposzenie zaakceptowaliśmy
				socketIoWraper.getAll().forEach(socket => {
					if (socket['userId'] && socket['userId'] === Number(req.body.userId)) {
						socket.emit('contact-invite', { type: 'contact-invite', time: new Date() });
					}
				});
				// wysłanie powiadomienia do użytkownika który zaakceptował zaproszenie
				socketIoWraper.getAll().forEach(socket => {
					if (socket['userId'] && socket['userId'] === Number(req['decoded'].uz_id)) {
						socket.emit('contact-invite', { type: 'contact-invite', time: new Date() });
					}
				});
			}
			res.json({ status: 0, message: value.message, data: value.data });
		}, (error: Error) => {
			res.json({ status: (-1), message: error.message });
		});
	}
	else {
		res.json({ status: (-1), message: 'Przekazano nieprawidłowe parametry do funkcji.' });
	}
});

export { serverRouter }
