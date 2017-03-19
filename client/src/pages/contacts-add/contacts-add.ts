import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { ContactsService } from '../../providers/contacts-service';

/*
  Generated class for the ContatcsAdd page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-contacts-add',
  templateUrl: 'contacts-add.html'
})
export class ContactsAddPage {
	private loading: Loading;
	private users: any;
	// model
	public login: string;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private contactsService: ContactsService
	) {
		this.users = [];
		this.login = '';
	}
	ionViewDidLoad() {
		this.findUser({});
	}
	public findUser(event: any): void {
		//this.showProcessing();
		this.contactsService.findUsersNotInContacts(this.login).subscribe((value: any) => {
			//this.hideProcessing();
			if (value.status === 0) {
				this.users = value.data;
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			//this.hideProcessing();
			this.showError(error);
		});
	}
	public inviteUser(user: any): void {
		this.showProcessing();
		this.contactsService.inviteUserToContacts(user.id).subscribe((value: any) => {
			this.hideProcessing();
			if (value.status === 0) {
				this.findUser({});
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}

	private showProcessing(): void {
		this.loading = this.loadingCtrl.create({
			content: 'Proszę czekać...'
		});
		this.loading.present();
	}
	private hideProcessing(): void {
		this.loading.dismiss();
	}
	private showError(message: string): void {
		let alert = this.alertCtrl.create({
			title: 'Błąd',
			subTitle: message,
			buttons: ['OK']
		});
		alert.present(prompt);
	}

}
