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
	findNotInContacts: (client, data, callback): void => {
		let results = [];
		let query = client.query(`
			SELECT *
			FROM uzytkownicy
			WHERE (uz_id<>$1)
				AND (LOWER(uz_login) LIKE LOWER($2))
				AND (uz_id NOT IN (
					SELECT ko_uz_id_do
					FROM kontakty
					WHERE (ko_uz_id_od=$1)
						AND (ko_status<>(-1))
					GROUP BY ko_uz_id_do
				))
			ORDER BY uz_login
		`, [data.uz_id, `%${data.login}%`]);
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
const contacts = {
	findById: (client, data, callback): void => {
		let results = [];
		let query = client.query('SELECT * FROM kontakty WHERE (ko_id=$1)', [data.ko_id]);
		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	},
	findByUsers: (client, data, callback): void => {
		let results = [];
		let query = client.query('SELECT * FROM kontakty WHERE (ko_uz_id_od=$1) AND (ko_uz_id_do=$2)', [data.ko_uz_id_od, data.ko_uz_id_do]);
		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	},
	save: (client, data, callback): void => {
		let results = [];
		client.query('INSERT INTO kontakty (ko_uz_id_start, ko_uz_id_od, ko_uz_id_do, ko_status) VALUES ($1, $2, $3, 2)', [data.ko_uz_id_start, data.ko_uz_id_od, data.ko_uz_id_do], (err) => {
			if (err) {
				callback(err, undefined);
			}
			else {
				let query = client.query('SELECT currval(pg_get_serial_sequence(\'kontakty\', \'ko_id\')) AS id');
				query.on('row', (row) => {
					results.push(row);
				});
				query.on('end', () => {
					callback(undefined, results);
				})
			}
		});
	},
	updateStatus: (client, data, callback): void => {
		let results = [];
		client.query('UPDATE kontakty SET ko_status=$1 WHERE (ko_id=$2)', [data.ko_status, data.ko_id], (err) => {
			if (err) {
				callback(err, undefined);
			}
			else {
				results.push({id: data.ko_id});
				callback(undefined, results);
			}
		});
	},
	getNumWaitingInvitations: (client, data, callback): void => {
		let results = [];
		let query = client.query('SELECT COUNT(*) AS ile FROM kontakty WHERE (ko_uz_id_start<>$1) AND (ko_uz_id_od=$1) AND (ko_status=2)', [data.uz_id]);
		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	},
	getList: (client, data, callback): void => {
		let results = [];
		let query = undefined;
		if (data.type === 'active') {
			query = client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_od=$1) AND (ko_status=1)', [data.uz_id]);
		}
		else if (data.type === 'send') {
			query = client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_start=$1) AND (ko_uz_id_od=$1) AND (ko_status=2)', [data.uz_id]);
		}
		else if (data.type === 'received') {
			query = client.query('SELECT * FROM kontakty JOIN uzytkownicy ON (ko_uz_id_do=uz_id) WHERE (ko_uz_id_start<>$1) AND (ko_uz_id_od=$1) AND (ko_status=2)', [data.uz_id]);
		}

		query.on('row', (row) => {
			results.push(row);
		});
		query.on('end', () => {
			callback(undefined, results);
		});
	}
};

const dataModel = {
	userLogin: (data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					user.findByEmail(client, { email: data.email }, (err, value) => {
						if (err) {
							done();
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
	userRegister: (data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					client.query('BEGIN', (err) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							user.findByEmail(client, { email: data.email }, (err, value) => {
								if (err) {
									client.query('ROLLBACK', (error) => {
										done();
										observer.error(err);
									});
								}
								else {
									if (value.length === 0) {
										user.findByLogin(client, { login: data.login }, (err, value) => {
											if (err) {
												client.query('ROLLBACK', (error) => {
													done();
													observer.error(err);
												});
											}
											else {
												if (value.length === 0) {
													user.save(client, { login: data.login, email: data.email, password: data.password }, (err, value) => {
														if (err) {
															client.query('ROLLBACK', (error) => {
																done();
																observer.error(err);
															});
														}
														else {
															client.query('COMMIT', (err, result) => {
																if (err) {
																	done();
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
														done();
														observer.error(new Error('Użytkownik o podanym loginie jest już zarejestrowany.'));
													});
												}
											}
										});
									}
									else {
										client.query('ROLLBACK', (error) => {
											done();
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
	},
	findUsersNotInContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					user.findNotInContacts(client, { uz_id: uz_id, login: data.login }, (err, value) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							observer.next({ status: 0, message: 'Lista użytkowników.', data: value });
							observer.complete();
						}
					});
				}
			});
		});
	},
	inviteUserToContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					client.query('BEGIN', (err) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							contacts.findByUsers(client, { ko_uz_id_od: uz_id, ko_uz_id_do: data.userId }, (err, value) => {
								if (err) {
									client.query('ROLLBACK', (error) => {
										done();
										observer.error(err);
									});
								}
								else {
									// rejestracja związków w obie strony (uzytkownik1 -> użytkownik2, użytkownik2 -> użytkownik1)
									if (value.length === 0) {
										contacts.save(client, { ko_uz_id_start: uz_id, ko_uz_id_od: uz_id, ko_uz_id_do: data.userId }, (err, value) => {
											if (err) {
												client.query('ROLLBACK', (error) => {
													done();
													observer.error(err);
												});
											}
											else {
												contacts.save(client, { ko_uz_id_start: uz_id, ko_uz_id_od: data.userId, ko_uz_id_do: uz_id }, (err, value) => {
													if (err) {
														client.query('ROLLBACK', (error) => {
															done();
															observer.error(err);
														});
													}
													else {
														client.query('COMMIT', (err, result) => {
															if (err) {
																done();
																observer.error(err);
															}
															else {
																done();
																observer.next({ status: 0, message: 'Poprawnie zaproszono nowego użytkownika do kontaktów.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
																observer.complete();
															}
														});
													}
												});
											}
										});
									}
									else {
										if (value[0].ko_status === (-1)) {
											contacts.updateStatus(client, { ko_id: value[0].ko_id, ko_status: 2 }, (err, value) => {
												if (err) {
													client.query('ROLLBACK', (error) => {
														done();
														observer.error(err);
													});
												}
												else {
													client.query('COMMIT', (err, result) => {
														if (err) {
															done();
															observer.error(err);
														}
														else {
															done();
															observer.next({ status: 0, message: 'Poprawnie odnowiono zaproszenie nowego użytkownika do kontaktów.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
															observer.complete();
														}
													});
												}
											});
										}
										else {
											observer.next({ status: 1, message: 'Użytkownik już jest w kontaktach.', data: { sourceUserId: uz_id, targetUserId: data.userId } });
											observer.complete();
										}
									}
								}
							});
						}
					});
				}
			});
		});
	},
	getNumWaitingInvitations: (uz_id: number): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					contacts.getNumWaitingInvitations(client, { uz_id: uz_id }, (err, value) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							observer.next({ status: 0, message: 'Poprawnie pobrano liczbę oczekujących zaproszeń do kontaktów.', data: value[0].ile });
							observer.complete();
						}
					});
				}
			});
		});
	},
	findContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					contacts.getList(client, { uz_id: uz_id, type: data.type }, (err, value) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							observer.next({ status: 0, message: 'Lista kontaktów.', data: value });
							observer.complete();
						}
					});
				}
			});
		});
	},
	deleteUserFromContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					client.query('BEGIN', (err) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							contacts.findById(client, { ko_id: data.contactId }, (err, value) => {
								if (err) {
									client.query('ROLLBACK', (error) => {
										done();
										observer.error(err);
									});
								}
								else {
									if (value.length === 1 && value[0].ko_uz_id_od === uz_id && value[0].ko_status !== (-1)) {
										let firstContact = value[0];
										contacts.findByUsers(client, { ko_uz_id_od: firstContact.ko_uz_id_do, ko_uz_id_do: firstContact.ko_uz_id_od }, (err, value) => {
											if (err) {
												client.query('ROLLBACK', (error) => {
													done();
													observer.error(err);
												});
											}
											else {
												if (value.length === 1 && value[0].ko_status !== (-1)) {
													let secondContact = value[0];
													contacts.updateStatus(client, { ko_id: firstContact.ko_id, ko_status: (-1)}, (err, value) => {
														if (err) {
															client.query('ROLLBACK', (error) => {
																done();
																observer.error(err);
															});
														}
														else {
															contacts.updateStatus(client, { ko_id: secondContact.ko_id, ko_status: (-1)}, (err, value) => {
																if (err) {
																	client.query('ROLLBACK', (error) => {
																		done();
																		observer.error(err);
																	});
																}
																else {
																	client.query('COMMIT', (err, result) => {
																		if (err) {
																			done();
																			observer.error(err);
																		}
																		else {
																			done();
																			observer.next({ status: 0, message: 'Poprawnie usunięto kontakt.', data: {} });
																			observer.complete();
																		}
																	});
																}
															});
														}
													});
												}
												else {
													client.query('ROLLBACK', (error) => {
														done();
														observer.error(new Error('Nieprawidłowy identyfikator kontaktu.'));
													});
												}
											}
										});
									}
									else {
										client.query('ROLLBACK', (error) => {
											done();
											observer.error(new Error('Nieprawidłowy identyfikator kontaktu.'));
										});
									}
								}
							});
						}
					});
				}
			});
		});
	},
	confirmUsersInvToContacts: (uz_id: number, data: any): Observable<any> => {
		return Observable.create((observer: Subscriber<any>) => {
			pool.connect((err, client, done) => {
				if (err) {
					done();
					observer.error(err);
				}
				else {
					client.query('BEGIN', (err) => {
						if (err) {
							done();
							observer.error(err);
						}
						else {
							contacts.findById(client, { ko_id: data.contactId }, (err, value) => {
								if (err) {
									client.query('ROLLBACK', (error) => {
										done();
										observer.error(err);
									});
								}
								else {
									if (value.length === 1 && value[0].ko_uz_id_od === uz_id && value[0].ko_status === 2) {
										let firstContact = value[0];
										contacts.findByUsers(client, { ko_uz_id_od: firstContact.ko_uz_id_do, ko_uz_id_do: firstContact.ko_uz_id_od }, (err, value) => {
											if (err) {
												client.query('ROLLBACK', (error) => {
													done();
													observer.error(err);
												});
											}
											else {
												if (value.length === 1 && value[0].ko_status === 2) {
													let secondContact = value[0];
													contacts.updateStatus(client, { ko_id: firstContact.ko_id, ko_status: 1}, (err, value) => {
														if (err) {
															client.query('ROLLBACK', (error) => {
																done();
																observer.error(err);
															});
														}
														else {
															contacts.updateStatus(client, { ko_id: secondContact.ko_id, ko_status: 1}, (err, value) => {
																if (err) {
																	client.query('ROLLBACK', (error) => {
																		done();
																		observer.error(err);
																	});
																}
																else {
																	client.query('COMMIT', (err, result) => {
																		if (err) {
																			done();
																			observer.error(err);
																		}
																		else {
																			done();
																			observer.next({ status: 0, message: 'Poprawnie zaakceptowano kontakt.', data: {} });
																			observer.complete();
																		}
																	});
																}
															});
														}
													});
												}
												else {
													client.query('ROLLBACK', (error) => {
														done();
														observer.error(new Error('Nieprawidłowy identyfikator kontaktu.'));
													});
												}
											}
										});
									}
									else {
										client.query('ROLLBACK', (error) => {
											done();
											observer.error(new Error('Nieprawidłowy identyfikator kontaktu.'));
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
