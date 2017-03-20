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
	public getListOfContacts(type: string): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-list', JSON.stringify({
			type: type
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
	public findUsersNotInContacts(login: string): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-find-users', JSON.stringify({
			login: login
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
	public inviteUserToContacts(userId: number): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-invite-users', JSON.stringify({
			userId: userId
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
	public getNumOfWaitingInvitations(): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-num-waiting-invitations', '', {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
	public deleteFromContacts(contactId: number): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-delete-users', JSON.stringify({
			contactId: contactId
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
	public confirInvToContacts(contactId: number): Observable<Response> {
		return this.http.post(this.configurationService.getServerUrl() + '/api/contacts-confirm-users', JSON.stringify({
			contactId: contactId
		}), {
			headers: new Headers({
				'Content-Type': 'application/json',
				'x-access-token': this.authenticationService.getUserToken()
			})
		}).map((response: Response) => response.json());
	}
}
