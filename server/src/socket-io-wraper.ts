import * as socketio from 'socket.io';

class SocketIoWraper {
	private sockets: SocketIO.Socket[];

	constructor() {
		this.sockets = [];
	}
	public push(socket: SocketIO.Socket): void {
		this.sockets.push(socket);
	}
	public remove(socket: SocketIO.Socket): void {
		let idx: number = this.sockets.indexOf(socket);
		if (idx >= 0) {
			this.sockets.splice(idx, 1);
		}
	}
	public getAll(): SocketIO.Socket[] {
		return this.sockets;
	}
	public findByUserId(userId: number): SocketIO.Socket {
		let res: SocketIO.Socket = undefined;

		for (let i = 0; i < this.sockets.length; i += 1) {
			if (this.sockets[i]['userId'] === userId) {
				res = this.sockets[i];
				break;
			}
		}

		return res;
	}
}

const socketIoWraper = new SocketIoWraper();

export { socketIoWraper }
