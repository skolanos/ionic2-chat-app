import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { SocketioService } from '../../providers/socketio-service';
import { ContactsService } from '../../providers/contacts-service';

import { ContactsPage } from '../contacts/contacts';
import { HomePage } from '../home/home';


/*
  Generated class for the Tabs page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
	private loading: Loading;
	private tab1: any;
	private tab2: any;
	private numOfWaitingContacts: number;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private socketioService: SocketioService,
		private contactsService: ContactsService
	) {
		this.tab1 = ContactsPage;
		this.tab2 = HomePage;
		this.numOfWaitingContacts = 0;

		this.socketioService.getSocket().on('contact-invite', (data) => {
			this.getNumOfWaitingContacts();
		});
	}
	ionViewDidLoad() {
//    console.log('ionViewDidLoad TabsPage');
		this.getNumOfWaitingContacts();
	}
	private getNumOfWaitingContacts(): void {
		this.showProcessing();
		this.contactsService.getNumOfWaitingInvitations().subscribe((value: any) => {
			this.hideProcessing();
			if (value.status === 0) {
				this.numOfWaitingContacts = value.data;
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public getNumOfContacts(): string {
		return (this.numOfWaitingContacts > 0) ? String(this.numOfWaitingContacts) : '';
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
