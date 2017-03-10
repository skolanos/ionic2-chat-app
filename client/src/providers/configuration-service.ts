import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the ConfigurationService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class ConfigurationService {
	private config: any;

	constructor(public http: Http) {
		this.config = {
			serverURL: 'http://localhost:3000'
		};
	}
	public get(property_name: string): string {
		return this.config[property_name];
	}
}
