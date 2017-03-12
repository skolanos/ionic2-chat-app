import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

import { AuthenticationService } from '../../providers/authentication-service';
import { SocketioService } from '../../providers/socketio-service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
	private message: string;
	private messages: any[];

	constructor(
		public navCtrl: NavController,
		private authenticationService: AuthenticationService,
		private socketioService: SocketioService
	) {
		this.message = '';
		this.messages = [];
		/*this.socketioService.getSocket().on('login', (data) => {
			this.messages.push(data);
		});*/
		this.socketioService.getSocket().on('message', (data) => {
			this.messages.push(data);
		});
	}
	public sendMessage(): void {
		if (this.message !== '') {
			this.socketioService.emitMessage(this.message);

			this.message = '';
		}
	}
	public getUserLogin(): string {
		return this.authenticationService.getUserLogin();
	}
	public formatMessageTime(time: any): string {
		let res = '';
		let messageDate = new Date(time).toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
		let messageTime = new Date(time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
		let currDate = new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });

		if (messageDate === currDate) {
			res = messageTime;
		}
		else {
			res = messageDate;
		}

		return res;
	}
}
