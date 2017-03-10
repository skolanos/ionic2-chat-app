import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { ConfigurationService } from '../providers/configuration-service';
import { AuthenticationService } from '../providers/authentication-service';
import { LoginPage } from '../pages/login/login';
import { RegisterUserPage } from '../pages/register-user/register-user';
import { HomePage } from '../pages/home/home';

@NgModule({
	declarations: [
		MyApp,
		HomePage,
		LoginPage,
		RegisterUserPage
	],
	imports: [
		IonicModule.forRoot(MyApp)
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MyApp,
		HomePage,
		LoginPage,
		RegisterUserPage
	],
	providers: [
		{provide: ErrorHandler, useClass: IonicErrorHandler},
		ConfigurationService,
		AuthenticationService
	]
})
export class AppModule {}
