import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const socketInstances: Map<string, Socket> = new Map();

export function getSocket(namespace: string): Socket {
  const existingSocket = socketInstances.get(namespace);
  if (existingSocket) {
    return existingSocket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
    : 'https://api.iris365.in';

  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;

  const newSocket = io(`${socketUrl}${namespace}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstances.set(namespace, newSocket);
  return newSocket;
}

export function disconnectSocket(namespace: string): void {
  const existingSocket = socketInstances.get(namespace);
  if (existingSocket) {
    existingSocket.disconnect();
    socketInstances.delete(namespace);
  }
}

export function disconnectAllSockets(): void {
  socketInstances.forEach((socket) => socket.disconnect());
  socketInstances.clear();
}

export { socket };