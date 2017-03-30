import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import 'rxjs/add/operator/map';

import { ConfigurationService } from './configuration-service';
import { AuthenticationService } from './authentication-service';

declare var io: any;

/*
  Generated class for the SocketioService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class SocketioService {
	private socket: any;

	constructor(
		public http: Http,
		private configurationService: ConfigurationService,
		private authenticationService: AuthenticationService
	) {
		this.socket = io(this.configurationService.getServerUrl());
	}
	public getSocket(): any {
		return this.socket;
	}
	public emitLogin(): void {
		this.socket.emit('login', { token: this.authenticationService.getUserToken(), text: '' });
	}
	public emitMessage(message: string): void {
		this.socket.emit('message', { token: this.authenticationService.getUserToken(), text: message });
	}
	public emitPrivateMessage(userId: number, message: string): void {
		this.socket.emit('private-message', { token: this.authenticationService.getUserToken(), text: message, destUserId: userId });
	}
}
