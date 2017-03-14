import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { ConfigurationService } from './configuration-service';
import { AuthenticationService } from './authentication-service';

/*
  Generated class for the ContactsService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class ContactsService {

	constructor(
		public http: Http,
		private configurationService: ConfigurationService,
		private authenticationService: AuthenticationService
	) {
	}

	public findUsers(login: string): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-find-users', JSON.stringify({
			login: login
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}

}
