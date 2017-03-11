import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
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
	private emit(event_type: string, message: string): void {
		this.socket.emit(event_type, { token: this.authenticationService.getUserToken(), text: message });
	}
	public emitMessage(message: string): void {
		this.emit('message', message);
	}
	public emitLogin(): void {
		this.emit('login', undefined);
	}
}
