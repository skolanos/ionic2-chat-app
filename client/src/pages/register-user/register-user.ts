import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Loading } from 'ionic-angular';

import { AuthenticationService } from '../../providers/authentication-service';
import { HomePage } from '../home/home';

/*
  Generated class for the RegisterUser page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-register-user',
  templateUrl: 'register-user.html'
})
export class RegisterUserPage {
	private loading: Loading;
	// model
	public login: string;
	public email: string;
	public password: string;
	public password2: string;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private authenticationService: AuthenticationService
	) {
		this.login = '';
		this.email = '';
		this.password = '';
		this.password2 = '';
	}

//  ionViewDidLoad() {
//    console.log('ionViewDidLoad RegisterUserPage');
//  }

	private checkForm(): boolean {
		if (this.password !== this.password2) {
			this.showError('Powtórzone hasło nie jest takie samo jak wprowadzone hasło.');
		}

		return true;
	}
	public register(): void {
		if (this.checkForm()) {
			this.showProcessing();
			this.authenticationService.register(this.login, this.email, this.password, this.password2).subscribe((value: any) => {
				console.log('RegisterUserPage.register(): ', value);
				if (value.status === 0) {
					// zarejestrowano użytkownika więc jego automatyczne wlogowanie
					this.authenticationService.login(this.email, this.password).subscribe((value: any) => {
						console.log('RegisterUserPage.register(): login ', value);
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
				else {
					this.hideProcessing();
					this.showError(value.message);
				}
			}, error => {
				this.hideProcessing();
				this.showError(error);
			});
		}
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
