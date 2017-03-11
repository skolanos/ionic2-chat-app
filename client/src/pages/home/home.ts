import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

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
		private socketioService: SocketioService
	) {
		this.message = '';
		this.messages = [];
		this.socketioService.getSocket().on('login', (data) => {
			this.messages.push(data);
		});
		this.socketioService.getSocket().on('message', (data) => {
			this.messages.push(data);
		});
	}
	sendMessage(): void {
		if (this.message !== '') {
			this.socketioService.emitMessage(this.message);

			this.message = '';
		}
	}

}
