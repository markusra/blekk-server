const io = require("socket.io")();

let onlineUsers = [];

function onConnect(client) {
  console.log("client connected =>", client.id);
}

function registerClient(client) {
  client.on("register", username => {
    if (!onlineUsers.find(user => user.id === client.id)) {
      onlineUsers.push({ id: client.id, username });
      console.log(
        `client '${client.id}' registered with username: ${username}`
      );
      io.emit("onlineUsers", onlineUsers);
    }
  });
}

function unregisterClient(client) {
  if (onlineUsers.find(user => user.id === client.id)) {
    const updatedOnlineUsers = onlineUsers.filter(
      user => user.id !== client.id
    );
    onlineUsers = updatedOnlineUsers;

    io.emit("onlineUsers", onlineUsers);
  }
}

io.on("connection", client => {
  onConnect(client);
  registerClient(client);

  client.on("chat", msg => {
    console.log("received message =>", msg);
    io.emit("chat", msg);
  });

  client.on("disconnect", function() {
    console.log(`client disconnected => clientID: ${client.id}`);

    unregisterClient(client);
  });
});

const PORT = process.env.PORT || 3000;
io.listen(PORT, () => console.log("listening on port", PORT));
