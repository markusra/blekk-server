const io = require("socket.io")();

let lastTenMessages = [];
let onlineUsers = [];
let typingUsers = [];

function onConnect(client) {
  console.log("client connected =>", client.id);
}

const validateStatusText = statusText => (statusText.length > 50)
  ? statusText.substring(0, 50) + "..."
  : statusText;

function registerClient(client) {
  client.on("register", ({ name, imgId, statusText = "" }) => {
    if (!onlineUsers.find(user => user.id === client.id)) {
      const validatedStatusText = validateStatusText(statusText);

      onlineUsers.push({
        id: client.id,
        name: name.substring(0, 20),
        imgId,
        status: "online",
        statusText: validatedStatusText,
      });
      console.log(`client '${client.id}' registered with name: ${name.substring(0, 20)}`);

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

function setStatusText(client) {
  client.on("setStatusText", statusText => {
    const validatedStatusText = validateStatusText(statusText);
    onlineUsers.find(user => user.id === client.id).statusText = validatedStatusText;
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

function setIsTyping(client) {
  client.on("setIsTyping", message => {
    if (message.isTyping) {
      if (!typingUsers.find(username => username === message.username)) {
        typingUsers.push(message.username);

        io.emit("typingUsers", typingUsers);
      }
    }

    if (!message.isTyping) {
      if (typingUsers.find(username => username === message.username)) {
        const updatedtypingUsers = typingUsers.filter(
          username => username !== message.username
        );
        typingUsers = updatedtypingUsers;

        io.emit("typingUsers", typingUsers);
      }
    }
  });
}

io.on("connection", client => {
  onConnect(client);
  registerClient(client);
  setOnlineStatus(client);
  setStatusText(client);
  setIsTyping(client);

  client.on("message", msg => {
    console.log("received message =>", msg);

    addToLastTenMessages(msg);
    io.emit("message", msg);
  });

  client.on("disconnect", function () {
    console.log(`client disconnected => clientID: ${client.id}`);

    unregisterClient(client);
  });
});

const PORT = process.env.PORT || 3000;
io.listen(PORT);
console.log("listening on port", PORT);
