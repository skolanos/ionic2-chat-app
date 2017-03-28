import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Observable }  from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import { serverConfig } from './server-config';

const pool = new pg.Pool(serverConfig.database);

pool.on('error', (err, client) => {
	console.error('Wystąpił błąd przy pobieraniu połączenia do bazy danych!', err.message, err.stack)
});

const kontaktyStatusy = {
	usuniety: (-1),
	aktywny: 1,
	oczekujacy: 2
};

/**
 * Obiekt odpowiedzialny za logowanie i rejestrowanie nowych użytkowników.
 */
const dataModelUsers = {
	/**
	 * Logowanie użytkownika.
	 * 
	 * @param data.email
	 * @param data.password
	 */
	userLogin: (data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('SELECT * FROM uzytkownicy WHERE (LOWER(uz_email)=LOWER($1))', [data.email]).then(result => {
					let results = [];
					result.rows.forEach(row => {
						if (bcrypt.compareSync(data.password, row.uz_haslo)) {
							results.push(row);
						}
					});
					if (results.length === 1) {
						let tokenData = { uz_id: results[0].uz_id, uz_login: results[0].uz_login };
						let token = jwt.sign(tokenData, serverConfig.jsonwebtoken.secret, { expiresIn: 60 * 24 });
						client.release();
						observer.next({ status: 0, message: 'Poprawnie zalogowano użytkownika.', data: { token: token, login: results[0].uz_login }});
						observer.complete();
					}
					else {
						client.release();
						observer.error(new Error('Nieprawidłowy adres e-mail albo hasło użytkownika.'));
					}
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Zarejestrowanie nowego użytkownika.
	 * 
	 * @param data.email
	 * @param data.login
	 * @param data.password
	 */
	userRegister: (data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('BEGIN').then(result => {
					client.query('SELECT COUNT(*) AS ile FROM uzytkownicy WHERE (LOWER(uz_email)=LOWER($1))', [data.email]).then(result => {
						if (result.rows && Number(result.rows[0].ile) === 0) {
							client.query('SELECT COUNT(*) AS ile FROM uzytkownicy WHERE (LOWER(uz_login)=LOWER($1))', [data.login]).then(result => {
								if (result.rows && Number(result.rows[0].ile) === 0) {
									let pom = new Promise((resolve, reject) => {
										bcrypt.genSalt(10, (err, salt) => {
											if (err) {
												reject(err);
											}
											else {
												bcrypt.hash(data.password, salt, (err, hash) => {
													if (err) {
														reject(err);
													}
													else {
														resolve(hash);
													}
												});
											}
										});
									}).then(hash => {
										client.query('INSERT INTO uzytkownicy (uz_haslo, uz_login, uz_email) VALUES ($1, $2, $3)', [hash, data.login, data.email]).then(result => {
											client.query('COMMIT').then(result => {
												client.release();
												observer.next({ status: 0, message: 'Poprawnie zarejestrowano nowego użytkownika.' });
												observer.complete();
											});
										});
									});
								}
								else {
									throw(new Error('Użytkownik o podanym loginie jest już zarejestrowany.'));
								}
							});
						}
						else {
							throw(new Error('Użytkownik o podanym adresie e-mail jest już zarejestrowany.'));
						}
					});
				}).catch(error => {
					client.query('ROLLBACK').then(result => {
						client.release();
						observer.error(error);
					});
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	}
};

/**
 * Obiekt odpowiedzialny za zarządzanie listą kontaktów.
 */
const dataModelContacts = {
	/**
	 * Zwraca listę użytkowników którzy nie znajdują się na liście kontaktów
	 * użytkownika (niezależnie od statusu).
	 * 
	 * @param uz_id {number} identyfikator użytkownika
	 * @param data.login {string} napis do filtrowania listy użytkowników
	 * 
	 * Jest to lista osób które można zaprosić do kontaktów.
	 */
	findUsersNotInContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query(`
					SELECT *
					FROM uzytkownicy
					WHERE (uz_id<>$1)
						AND (LOWER(uz_login) LIKE LOWER($2))
						AND (uz_id NOT IN (
							SELECT ko_uz_id_do
							FROM kontakty
							WHERE (ko_uz_id_od=$1)
								AND (ko_ks_id<>(-1))
							GROUP BY ko_uz_id_do
						))
					ORDER BY uz_login
				`, [uz_id, `%${data.login}%`]).then(result => {
					client.release();
					observer.next({ status: 0, message: 'Lista użytkowników.', data: result.rows });
					observer.complete();
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Zarejestrowanie zaproszenia do kontaktów.
	 * 
	 * @param uz_id {number} identyfikator użytkownika (użytkownik zapraszający do kontaktów)
	 * @param data.userId {nuumber} identyfikator użytkownika (użytkownik zapraszany do kontaktów)
	 */
	inviteUserToContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('BEGIN').then(result => {
					client.query('SELECT * FROM kontakty WHERE (ko_uz_id_od=$1) AND (ko_uz_id_do=$2)', [uz_id, data.userId]).then(result => {
						if (result.rows.length === 0) {
							// związku jeszcze nie było - rejestracja związków w obie strony (uzytkownik1 -> użytkownik2, użytkownik2 -> użytkownik1)
							client.query('INSERT INTO kontakty (ko_uz_id_start, ko_uz_id_od, ko_uz_id_do, ko_ks_id) VALUES ($1, $2, $3, 2)', [uz_id, uz_id, data.userId]).then(result => {
								client.query('INSERT INTO kontakty (ko_uz_id_start, ko_uz_id_od, ko_uz_id_do, ko_ks_id) VALUES ($1, $2, $3, 2)', [uz_id, data.userId, uz_id]).then(result => {
									client.query('COMMIT').then(result => {
										client.release();
										observer.next({ status: 0, message: 'Poprawnie zaproszono nowego użytkownika do kontaktów.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
										observer.complete();
									});
								});
							});
						}
						else {
							// związek już był - aktualizacja związków w obie strony (uzytkownik1 -> użytkownik2, użytkownik2 -> użytkownik1)
							if (Number(result.rows[0].ko_ks_id) === kontaktyStatusy.usuniety) {
								client.query('UPDATE kontakty SET ko_uz_id_start=$1, ko_ks_id=$2 WHERE (ko_uz_id_od=$3) AND (ko_uz_id_do=$4)', [uz_id, kontaktyStatusy.oczekujacy, uz_id, data.userId]).then(result => {
									client.query('UPDATE kontakty SET ko_uz_id_start=$1, ko_ks_id=$2 WHERE (ko_uz_id_od=$3) AND (ko_uz_id_do=$4)', [uz_id, kontaktyStatusy.oczekujacy, data.userId, uz_id]).then(result => {
										client.query('COMMIT').then(result => {
											client.release();
											observer.next({ status: 0, message: 'Poprawnie zaproszono nowego użytkownika do kontaktów.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
											observer.complete();
										});
									});
								});
							}
							else {
								client.release();
								observer.next({ status: 0, message: 'Kontakt jest już zarejestrowany.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
								observer.complete();
							}
						}
					});
				}).catch(error => {
					client.query('ROLLBACK').then(result => {
						client.release();
						observer.error(error);
					});
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Zwraca liczbę kontaktów oczekujących na zatwierdzenie przez użytkownika.
	 * 
	 * @param uz_id
	 * 
	 * Do pokazania liczby na ikonce kontaktów.
	 */
	getNumWaitingInvitations: (uz_id: number): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('SELECT COUNT(*) AS ile FROM kontakty WHERE (ko_uz_id_start<>$1) AND (ko_uz_id_od=$1) AND (ko_ks_id=$2)', [uz_id, kontaktyStatusy.oczekujacy]).then(result => {
					client.release();
					observer.next({ status: 0, message: 'Poprawnie pobrano liczbę oczekujących zaproszeń do kontaktów.', data: result.rows[0].ile });
					observer.complete();
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Zwraca listę kontaktów.
	 * 
	 * @param data.type {string} typ listy (active, send, received)
	 */
	findContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				if (data.type === 'active') {
					client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_od=$1) AND (ko_ks_id=$2) ORDER BY uz_login', [uz_id, kontaktyStatusy.aktywny]).then(result => {
						client.release();
						observer.next({ status: 0, message: 'Lista kontaktów.', data: result.rows });
						observer.complete();
					});
				}
				else if (data.type === 'send') {
					client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_start=$1) AND (ko_uz_id_od=$1) AND (ko_ks_id=$2) ORDER BY uz_login', [uz_id, kontaktyStatusy.oczekujacy]).then(result => {
						client.release();
						observer.next({ status: 0, message: 'Lista kontaktów.', data: result.rows });
						observer.complete();
					});
				}
				else if (data.type === 'received') {
					client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_start<>$1) AND (ko_uz_id_od=$1) AND (ko_ks_id=$2) ORDER BY uz_login', [uz_id, kontaktyStatusy.oczekujacy]).then(result => {
						client.release();
						observer.next({ status: 0, message: 'Lista kontaktów.', data: result.rows });
						observer.complete();
					});
				}
				else {
					observer.error(new Error('Nieprawidłowy typ listy.'));
				}
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Usunięcie kontaktu.
	 * 
	 * @param uz_id
	 * @param data.contactId
	 */
	deleteUserFromContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('BEGIN').then(result => {
					client.query('SELECT * FROM kontakty WHERE (ko_id=$1)', [data.contactId]).then(result => {
						if (result.rows.length === 1 && Number(result.rows[0].ko_uz_id_od) === uz_id && Number(result.rows[0].ko_ks_id) !== kontaktyStatusy.usuniety) {
							let firstContact = result.rows[0];
							client.query('SELECT * FROM kontakty WHERE (ko_uz_id_od=$1) AND (ko_uz_id_do=$2)', [firstContact.ko_uz_id_do, firstContact.ko_uz_id_od]).then(result => {
								if (result.rows.length === 1 && Number(result.rows[0].ko_ks_id) !== kontaktyStatusy.usuniety) {
									let secondContact = result.rows[0];
									client.query('UPDATE kontakty SET ko_ks_id=$1 WHERE (ko_id=$2)', [kontaktyStatusy.usuniety, firstContact.ko_id]).then(result => {
										client.query('UPDATE kontakty SET ko_ks_id=$1 WHERE (ko_id=$2)', [kontaktyStatusy.usuniety, secondContact.ko_id]).then(result => {
											client.query('COMMIT').then(result => {
												client.release();
												observer.next({ status: 0, message: 'Poprawnie usunięto kontakt.', data: {} });
												observer.complete();
											});
										});
									});
								}
								else {
									throw(new Error('Nieprawidłowy identyfikator kontaktu (2).'));
								}
							});
						}
						else {
							throw(new Error('Nieprawidłowy identyfikator kontaktu (1).'));
						}
					});
				}).catch(error => {
					client.query('ROLLBACK').then(result => {
						client.release();
						observer.error(error);
					});
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	},
	/**
	 * Zatwierdzenie kontaktu.
	 * 
	 * @param uz_id
	 * @param data.contactId
	 */
	confirmUsersInvToContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('BEGIN').then(result => {
					client.query('SELECT * FROM kontakty WHERE (ko_id=$1)', [data.contactId]).then(result => {
						if (result.rows.length === 1 && Number(result.rows[0].ko_uz_id_od) === uz_id && Number(result.rows[0].ko_ks_id) === kontaktyStatusy.oczekujacy) {
							let firstContact = result.rows[0];
							client.query('SELECT * FROM kontakty WHERE (ko_uz_id_od=$1) AND (ko_uz_id_do=$2)', [firstContact.ko_uz_id_do, firstContact.ko_uz_id_od]).then(result => {
								if (result.rows.length === 1 && Number(result.rows[0].ko_ks_id) === kontaktyStatusy.oczekujacy) {
									let secondContact = result.rows[0];
									client.query('UPDATE kontakty SET ko_ks_id=$1 WHERE (ko_id=$2)', [kontaktyStatusy.aktywny, firstContact.ko_id]).then(result => {
										client.query('UPDATE kontakty SET ko_ks_id=$1 WHERE (ko_id=$2)', [kontaktyStatusy.aktywny, secondContact.ko_id]).then(result => {
											client.query('COMMIT').then(result => {
												client.release();
												observer.next({ status: 0, message: 'Poprawnie zaakceptowano kontakt.', data: {} });
												observer.complete();
											});
										});
									});
								}
								else {
									throw(new Error('Nieprawidłowy identyfikator kontaktu (2).'));
								}
							});
						}
						else {
							throw(new Error('Nieprawidłowy identyfikator kontaktu (1).'));
						}
					});
				}).catch(error => {
					client.query('ROLLBACK').then(result => {
						client.release();
						observer.error(error);
					});
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	}
};

/**
 * Obiekt odpowiedzialny za rejestrowanie i wczytywanie wiadomości.
 */
const dataModelMessages = {
	/**
	 * Zapisanie wiadomości.
	 * 
	 * @param data.type
	 * @param data.srcUserId
	 * @param data.destUserId
	 * @param data.message
	 */
	saveChatMessage: (data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect().then(client => {
				client.query('BEGIN').then(result => {
					client.query('INSERT INTO wiadomosci (wi_wt_id, wi_uz_id_od, wi_uz_id_do, wi_tresc) VALUES ($1, $2, $3, $4)', [data.type, data.srcUserId, data.destUserId, data.message]).then(result => {
						client.query(`SELECT currval(pg_get_serial_sequence('wiadomosci', 'wi_id')) AS id`).then(result => {
							client.query('SELECT * FROM wiadomosci WHERE (wi_id=$1)', [result.rows[0].id]).then(result => {
								if (result.rows.length === 1) {
									let wiadomosc: any = result.rows[0];
//									let wiadomosc: any = { testowy: 'xxxxxxxxxxxxxxxxxxx'};
console.log('wiadomosc: ' + JSON.stringify(wiadomosc));
									return client.query('COMMIT').then(result => {
console.log('9: saveChatMessage');
										client.release();
console.log('9.1: saveChatMessage');
										observer.next({ status: 0, message: 'Zapisano wiadomość.', data: wiadomosc });
console.log('9.2: saveChatMessage');
										observer.complete();
									});
								}
								else {
console.log('10: saveChatMessage');
									throw(new Error('Błąd przy zapisywaniu wiadomości.'));
								}
							});
						});
					});
				}).catch(error => {
console.log('11: saveChatMessage');
					client.query('ROLLBACK').then(result => {
						client.release();
						observer.error(error);
					});
				});
			}).catch(error => {
				observer.error(error);
			});
		});
	}
};

export { dataModelUsers, dataModelContacts, dataModelMessages }
