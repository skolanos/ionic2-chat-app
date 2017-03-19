const stringTools = {
	isValidInt(value: string): boolean {
		if (typeof(value) === 'number' || typeof(value) === 'string') {
			let res: RegExpMatchArray = value.toString().match(/^[-+]?\d+$/);
			return (res && (res.length > 0)) ? true: false;
		}
		else {
			return false;
		}
	}
};

export { stringTools } 
