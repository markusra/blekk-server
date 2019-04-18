const io = require("socket.io")();

let lastTenMessages = [];
let onlineUsers = [];

function onConnect(client) {
  console.log("client connected =>", client.id);
}

function registerClient(client) {
  client.on("register", ({ name, imgId }) => {
    if (!onlineUsers.find(user => user.id === client.id)) {
      onlineUsers.push({
        id: client.id,
        name,
        imgId,
        status: "online"
      });
      console.log(`client '${client.id}' registered with name: ${name}`);

      io.emit("onlineUsers", onlineUsers);
      io.emit("lastTenMessages", lastTenMessages);
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

function setOnlineStatus(client) {
  client.on("status", status => {
    onlineUsers.find(user => user.id === client.id).status = status;
    io.emit("onlineUsers", onlineUsers);
  });
}

function addToLastTenMessages(message) {
  if (lastTenMessages.length < 10) {
    lastTenMessages.push(message);
  } else {
    lastTenMessages.shift();
    lastTenMessages.push(message);
  }
}

io.on("connection", client => {
  onConnect(client);
  registerClient(client);
  setOnlineStatus(client);

  client.on("message", msg => {
    console.log("received message =>", msg);

    addToLastTenMessages(msg);
    io.emit("message", msg);
  });

  client.on("disconnect", function() {
    console.log(`client disconnected => clientID: ${client.id}`);

    unregisterClient(client);
  });
});

const PORT = process.env.PORT || 3000;
io.listen(PORT);
console.log("listening on port", PORT);
