import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Observable }  from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import { serverConfig } from './server-config';

const user = {
	findByEmail: (client, data, callback): void => {
		let results = [];
		let query = client.query('SELECT * FROM uzytkownicy WHERE (LOWER(uz_email)=LOWER($1))', [data.email]);
		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	},
	findByLogin: (client, data, callback): void => {
		let results = [];
		let query = client.query('SELECT * FROM uzytkownicy WHERE (LOWER(uz_login)=LOWER($1))', [data.login]);
		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	},
	save: (client, data, callback): void => {
		let results = [];
		bcrypt.genSalt(10, (err, salt) => {
			if (err) {
				callback(err, undefined);
			}
			else {
				bcrypt.hash(data.password, salt, (err, hash) => {
					if (err) {
						callback(err, undefined);
					}
					else {
						client.query('INSERT INTO uzytkownicy (uz_haslo, uz_login, uz_email) VALUES ($1, $2, $3)', [hash, data.login, data.email], (err) => {
							if (err) {
								callback(err, undefined);
							}
							else {
								let query = client.query('SELECT currval(pg_get_serial_sequence(\'uzytkownicy\', \'uz_id\')) AS id');
								query.on('row', (row) => {
									results.push(row);
								});
								query.on('end', () => {
									callback(undefined, results);
								})
							}
						});
					}
				});
			}
		});
	}
};

const dataModel = {
	userLogin: (data): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pg.connect(serverConfig.database.connectionString, (err, client, done) => {
				if (err) {
					done(err);
					observer.error(err);
				}
				else {
					user.findByEmail(client, { email: data.email }, (err, value) => {
						if (err) {
							done(err);
							observer.error(err);
						}
						else {
							let results = [];
							for (let i = 0; i < value.length; i += 1) {
								if (bcrypt.compareSync(data.password, value[i].uz_haslo)) {
									results.push(value[i]);
								}
							}
							if (results.length === 1) {
								let tokenData = { uz_id: results[0].uz_id, uz_login: results[0].uz_login };
								let token = jwt.sign(tokenData, serverConfig.jsonwebtoken.secret, { expiresIn: 60 * 24 });
								observer.next({ status: 0, message: 'Poprawnie zalogowano użytkownika.', data: { token: token, login: results[0].uz_login }});
								observer.complete();
							}
							else {
								observer.error(new Error('Nieprawidłowy adres e-mail albo hasło użytkownika.'));
							}
						}
					});
				}
			});
		});
	},
	userRegister: (data): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pg.connect(serverConfig.database.connectionString, (err, client, done) => {
				if (err) {
					done(err);
					observer.error(err);
				}
				else {
					client.query('BEGIN', (err) => {
						if (err) {
							client.query('ROLLBACK', (error) => {
								done(err);
								observer.error(err);
							});
						}
						else {
							user.findByEmail(client, { email: data.email }, (err, value) => {
								if (err) {
									client.query('ROLLBACK', (error) => {
										done(err);
										observer.error(err);
									});
								}
								else {
									if (value.length === 0) {
										user.findByLogin(client, { login: data.login }, (err, value) => {
											if (err) {
												client.query('ROLLBACK', (error) => {
													done(err);
													observer.error(err);
												});
											}
											else {
												if (value.length === 0) {
													user.save(client, { login: data.login, email: data.email, password: data.password }, (err, value) => {
														if (err) {
															client.query('ROLLBACK', (error) => {
																done(err);
																observer.error(err);
															});
														}
														else {
															client.query('COMMIT', (err, result) => {
																if (err) {
																	done(err);
																	observer.error(err);
																}
																else {
																	done();
																	observer.next({ status: 0, message: 'Poprawnie zarejestrowano nowego użytkownika.' });
																	observer.complete();
																}
															});
														}
													});
												}
												else {
													client.query('ROLLBACK', (error) => {
														done(err);
														observer.error(new Error('Użytkownik o podanym loginie jest już zarejestrowany.'));
													});
												}
											}
										});
									}
									else {
										client.query('ROLLBACK', (error) => {
											done(err);
											observer.error(new Error('Użytkownik o podanym adresie e-mail jest już zarejestrowany.'));
										});
									}
								}
							});
						}
					});
				}
			});
		});
	}
};

export { dataModel }
