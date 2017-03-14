import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { ConfigurationService } from '../providers/configuration-service';
import { AuthenticationService } from '../providers/authentication-service';
import { ContactsService } from '../providers/contacts-service';
import { SocketioService } from '../providers/socketio-service';

import { LoginPage } from '../pages/login/login';
import { RegisterUserPage } from '../pages/register-user/register-user';
import { TabsPage } from '../pages/tabs/tabs';
import { HomePage } from '../pages/home/home';
import { ContactsPage } from '../pages/contacts/contacts';

@NgModule({
	declarations: [
		MyApp,
		TabsPage,
		HomePage,
		LoginPage,
		RegisterUserPage,
		ContactsPage
	],
	imports: [
		IonicModule.forRoot(MyApp)
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MyApp,
		TabsPage,
		HomePage,
		LoginPage,
		RegisterUserPage,
		ContactsPage
	],
	providers: [
		{provide: ErrorHandler, useClass: IonicErrorHandler},
		ConfigurationService,
		AuthenticationService,
		ContactsService,
		SocketioService
	]
})
export class AppModule {}
