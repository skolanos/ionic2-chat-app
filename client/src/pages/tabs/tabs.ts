import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

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
	private tab1: any;
	private tab2: any;

	constructor(public navCtrl: NavController, public navParams: NavParams) {
		this.tab1 = ContactsPage;
		this.tab2 = HomePage;
	}

//  ionViewDidLoad() {
//    console.log('ionViewDidLoad TabsPage');
//  }

}
