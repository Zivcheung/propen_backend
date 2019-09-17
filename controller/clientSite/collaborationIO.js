const socket = require('socket.io');

module.exports.listen = (app) => {
  const io = socket(app);

  io.on('connection', (socket) => {
    let room = '';
    console.log('a socket connected');
    socket.on('joinRoom', (payload) => {
      room = payload.roomId;
      socket.join(room);
      io.to(room).emit('userJoined', { user: payload.user });
    });

    socket.on('disconnect', (payload) => {
      console.log('a user disconnected');
      io.to(room).emit('userLeaveNotify', { user: payload.user });
    });
  });

  return io;
};
