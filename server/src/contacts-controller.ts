import { Observable } from 'rxjs/Observable';

import { dataModel } from './data-model';
import { stringTools } from './string-tools';

const contactsCtrl = {
	find: (req): Observable<any> => {
		return dataModel.findContacts(req.decoded.uz_id, {
			type: req.body.type
		});
	},
	findUsers: (req): Observable<any> => {
		return dataModel.findUsersNotInContacts(req.decoded.uz_id, {
			login: req.body.login
		});
	},
	inviteUser: (req): Observable<any> => {
		const validateParams = (req): boolean => {
			if (!req.body.userId || !stringTools.isValidInt(req.body.userId)) {
				return false;
			}

			return true;
		};

		if (validateParams(req)) {
			return dataModel.inviteUserToContacts(req.decoded.uz_id, {
				userId: req.body.userId
			});
		}
		else {
			return Observable.create(observer => {
				observer.error(new Error('Przekazano nieprawidłowe parametry do funkcji.'));
			});
		}
	},
	getNumWaitingInvitations: (req): Observable<any> => {
		return dataModel.getNumWaitingInvitations(req.decoded.uz_id);
	}

};

export { contactsCtrl }
