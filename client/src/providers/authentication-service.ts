import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { ConfigurationService } from './configuration-service';

/*
  Generated class for the AuthenticationService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class AuthenticationService {
	private userToken: string;
	private userLogin: string;

	constructor(
		public http: Http,
		private configurationService: ConfigurationService
	) {
		this.userToken = '';
		this.userLogin = '';
	}
	public getUserToken(): string {
		return this.userToken;
	}
	public getUserLogin(): string {
		return this.userLogin;
	}
	public login(email: string, password: string): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/user-login', JSON.stringify({
			email: email,
			password: password
		}), {
			headers: new Headers({ 'Content-Type': 'application/json' })
		}).map((response: Response) => {
			let value: any = response.json();
			if (value.status === 0) {
				this.userToken = value.data.token;
				this.userLogin = value.data.login;
			}

			return value;
		});
	}
	public register(login: string, email: string, password: string, password2: string): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/user-register', JSON.stringify({
			login: login,
			email: email,
			password: password,
			password2: password2
		}), {
			headers: new Headers({ 'Content-Type': 'application/json' })
		}).map((response: Response) => response.json());
	}
}
