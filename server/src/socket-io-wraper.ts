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
}

const socketIoWraper = new SocketIoWraper();

export { socketIoWraper }
