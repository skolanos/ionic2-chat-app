import { Observable } from 'rxjs/Observable';

import { dataModel } from './data-model';
import { stringTools } from './string-tools';

const contactsCtrl = {
	find: (req): Observable<any> => {
		return dataModel.findContacts(req.decoded.uz_id, {
			type: req.body.type
		});
	},
	findUsersNotInContacts: (req): Observable<any> => {
		return dataModel.findUsersNotInContacts(req.decoded.uz_id, {
			login: req.body.login
		});
	},
	inviteUser: (req): Observable<any> => {
		return dataModel.inviteUserToContacts(req.decoded.uz_id, {
			userId: req.body.userId
		});
	},
	getNumWaitingInvitations: (req): Observable<any> => {
		return dataModel.getNumWaitingInvitations(req.decoded.uz_id);
	},
	deteleUser: (req): Observable<any> => {
		return dataModel.deleteUserFromContacts(req.decoded.uz_id, {
			contactId: req.body.contactId
		});
	},
	confirmUser: (req): Observable<any> => {
		return dataModel.confirmUsersInvToContacts(req.decoded.uz_id, {
			contactId: req.body.contactId
		});
	}
};

export { contactsCtrl }
