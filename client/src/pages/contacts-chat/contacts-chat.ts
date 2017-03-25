import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { AuthenticationService } from '../../providers/authentication-service';
import { SocketioService } from '../../providers/socketio-service';

/*
  Generated class for the ContactsChat page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-contacts-chat',
  templateUrl: 'contacts-chat.html'
})
export class ContactsChatPage {
	private contact: any;
	private message: string;
	private messages: any[];

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private authenticationService: AuthenticationService,
		private socketioService: SocketioService
	) {
		this.contact = this.navParams.get('contact');

		this.message = '';
		this.messages = [];

		this.socketioService.getSocket().on('private-message', (data) => {
			this.messages.push(data);
		});
	}

//  ionViewDidLoad() {
//    console.log('ionViewDidLoad ContactsChatPage');
//  }

	public sendMessage(): void {
		if (this.message !== '') {
			this.socketioService.emitPrivateMessage(this.contact.userId, this.message);

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
