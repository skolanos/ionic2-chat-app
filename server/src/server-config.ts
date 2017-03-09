import * as path from 'path';

const serverConfig = {
	httpServer: {
		port: process.env.PORT || 3000
	},
	database: {
		connectionString: process.env.DATABASE_URL || 'pg://postgres:postgres@localhost:5432/chat-app?stringtype=unspecified'
	},
	jsonwebtoken: {
		secret: 'ty4387th4387th'
	}
};

export { serverConfig }
