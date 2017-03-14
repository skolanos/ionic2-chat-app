import { Observable } from 'rxjs/Observable';

import { dataModel } from './data-model';

const contactsCtrl = {
	findUsers: (req): Observable<any> => {
		return dataModel.findUsersByLogin(req.decoded.uz_id, {
			login: req.body.login
		});
	},
};

export { contactsCtrl }
