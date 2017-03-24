import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { ContactsService } from '../../providers/contacts-service';
import { ContactsAddPage } from '../contacts-add/contacts-add';
/*
  Generated class for the Contacts page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-contacts',
  templateUrl: 'contacts.html'
})
export class ContactsPage {
	private loading: Loading;
	private activeContacts: any[];
	private sendContacts: any[];
	private receivedContacts: any[];
	// model
	public contactsType: string;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private contactsService: ContactsService
	) {
		this.contactsType = 'active'; // który segment ma być widoczny
		this.activeContacts = [];
		this.sendContacts = [];
		this.receivedContacts = [];
	}
	ionViewDidEnter() {
		this.showProcessing();
		this.getActiveContacts();
		this.getSendContacts();
		this.getReceivedContacts();
		this.hideProcessing();
	}
	public addContact(): void {
		this.navCtrl.push(ContactsAddPage, {});
	}
	private getActiveContacts(): void {
		//this.showProcessing();
		this.contactsService.getListOfContacts('active').subscribe((value: any) => {
			//this.hideProcessing();
			if (value.status === 0) {
				this.activeContacts = value.data;
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	private getSendContacts(): void {
		//this.showProcessing();
		this.contactsService.getListOfContacts('send').subscribe((value: any) => {
			//this.hideProcessing();
			if (value.status === 0) {
				this.sendContacts = value.data;
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	private getReceivedContacts(): void {
		//this.showProcessing();
		this.contactsService.getListOfContacts('received').subscribe((value: any) => {
			//this.hideProcessing();
			if (value.status === 0) {
				this.receivedContacts = value.data;
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public deleteActiveContact(contact: any): void {
		this.showProcessing();
		this.contactsService.deleteFromContacts(contact.contactId).subscribe((value: any) => {
			if (value.status === 0) {
				this.getActiveContacts();
				this.hideProcessing();
			}
			else {
				this.hideProcessing();
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public deleteSendContact(contact: any): void {
		this.showProcessing();
		this.contactsService.deleteFromContacts(contact.contactId).subscribe((value: any) => {
			if (value.status === 0) {
				this.getSendContacts();
				this.hideProcessing();
			}
			else {
				this.hideProcessing();
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public deleteReceivedContact(contact: any): void {
		this.showProcessing();
		this.contactsService.deleteFromContacts(contact.contactId).subscribe((value: any) => {
			if (value.status === 0) {
				this.getReceivedContacts();
				this.hideProcessing();
			}
			else {
				this.hideProcessing();
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public confirmReceivedContact(contact: any): void {
		this.showProcessing();
		this.contactsService.confirInvToContacts(contact.contactId).subscribe((value: any) => {
			if (value.status === 0) {
				this.getReceivedContacts();
				this.getActiveContacts();
				this.hideProcessing();
			}
			else {
				this.hideProcessing();
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
