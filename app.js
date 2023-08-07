const path = require('path');
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const formatMessage = require("./utils/formate_msg");
const userController = require("./utils/userControll");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
  socket.on('joinRoom', ({ username, room }) => {

    const user = userController.userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit('message', formatMessage("chatbot",`Hello to room ${user.room}`));


    socket.broadcast.to(room).emit('message', formatMessage("chatbot",` ${user.username} has join the room`));

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: userController.getRoomUsers(user.room),
    });
  })

  socket.on('chatMessage', (msg) => {
    const user = userController.getUser(socket.id);
    if(user){
      io.to(user.room).emit('message', formatMessage(user.username,msg));
    }
  })

  socket.on('disconnect', () => {

    const user = userController.userLeave(socket.id);

    if(user){
      io.to(user.room).emit('message', formatMessage("chatbot",`${user.username} has left the room`));
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: userController.getRoomUsers(user.room),
      });
    }
  })
});

httpServer.listen(3000);