const { io } = require('socket.io-client');

const SERVER = 'http://localhost:5000';

function makeClient(id) {
  const socket = io(SERVER, { reconnectionDelay: 0, timeout: 20000 });
  socket.on('connect', () => console.log(`${id} connected -> ${socket.id}`));
  socket.on('connected', () => console.log(`${id} server ack`));
  socket.on('message_received', (m) => console.log(`${id} message_received:`, m));
  socket.on('notification_received', (n) => console.log(`${id} notification_received:`, n));
  return socket;
}

(async () => {
  const A = makeClient('userA');
  const B = makeClient('userB');

  // wait for both to connect
  await new Promise((r) => setTimeout(r, 1000));

  A.emit('setup', 'userA');
  B.emit('setup', 'userB');

  A.emit('join_chat', 'room1');
  B.emit('join_chat', 'room1');

  // small delay then send message from A to B
  setTimeout(() => {
    const payload = { conversationId: 'room1', senderId: 'userA', receiverId: 'userB', content: 'Hello from userA' };
    console.log('userA emitting new_message:', payload);
    A.emit('new_message', payload);
  }, 500);

  // let it run a short while then exit
  setTimeout(() => {
    A.disconnect();
    B.disconnect();
    console.log('Finished test.');
    process.exit(0);
  }, 2500);
})();
