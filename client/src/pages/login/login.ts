import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AuthenticationService } from '../../providers/authentication-service';
import { HomePage } from '../home/home';
import { RegisterUserPage } from '../register-user/register-user';

/*
  Generated class for the Login page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
	private loading: Loading;
	// model
	public email: string;
	public password: string;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private authenticationService: AuthenticationService
	) {
		this.email = '';
		this.password = ''
	}

//  ionViewDidLoad() {
//    console.log('ionViewDidLoad LoginPage');
//  }

	public login(): void {
		this.showProcessing();
		this.authenticationService.login(this.email, this.password).subscribe((value: any) => {
			console.log('LoginPage.login():', value);
			this.hideProcessing();
			if (this.authenticationService.getUserToken() !== '') {
				this.navCtrl.setRoot(HomePage);
			}
			else {
				this.showError(value.message);
			}
		}, error => {
			this.hideProcessing();
			this.showError(error);
		});
	}
	public registerNewUser(): void {
		this.navCtrl.push(RegisterUserPage);
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
