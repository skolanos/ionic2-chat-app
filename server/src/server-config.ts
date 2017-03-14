import * as path from 'path';

const serverConfig = {
	httpServer: {
		port: process.env.PORT || 3000
	},
	database: {
		host: 'localhost',
		port: 5432,
		database: 'chat-app',
		user: 'postgres',
		password: 'postgres',
		max: 10, // maksymalna liczba połączeń do bazy danych
		idleTimeoutMillis: 30000
	},
	jsonwebtoken: {
		secret: 'ty4387th4387th'
	}
};

export { serverConfig }
