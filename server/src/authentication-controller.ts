import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import { serverConfig } from './server-config';
import { dataModel } from './data-model';

const authenticationCtrl = {
	test: (data): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			observer.next({ error: (-2), message: 'Nieprawidłowy adres e-mail albo hasło użytkownika' });
			observer.complete();
		});
	},
	authenticateRequest: (token: string, callback): void => {
		if (token) {
			jwt.verify(token, serverConfig.jsonwebtoken.secret, (err, decoded) => {
				if (err) {
					callback({ error: (-1), message: 'Błąd weryfikacji użytkownika'}, undefined);
				}
				else {
					callback(undefined, decoded);
				}
			});
		}
		else {
			callback({ error: (-1), message: 'Błąd weryfikacji użytkownika'}, undefined);
		}
	},
	login: (req): Observable<any> => {
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
			return dataModel.userLogin({
				email: req.body.email,
				password: req.body.password
			});
		}
		else {
			return Observable.create(observer => {
				observer.error(new Error('Przekazano nieprawidłowe parametry do funkcji.'));
			});
		}
	},
	register: (req): Observable<any> => {
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
			return dataModel.userRegister({
				login: req.body.login,
				email: req.body.email,
				password: req.body.password
			});
		}
		else {
			return Observable.create(observer => {
				observer.error(new Error('Przekazano nieprawidłowe parametry do funkcji.'));
			});
		}
	}
};

export { authenticationCtrl }
