require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require("path");
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { setServers } = require("node:dns/promises");
const axios = require("axios");
setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => {
  console.error("MongoDB connection error:");
  console.error(err);
  console.error(err.stack);
});




// Socket.io events
require('./socket')(io);

// API routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "entrypage.html"));
});

app.use('/auth', require('./routes/auth'));
app.use('/board', require('./routes/board'));
app.use("/ai", require('./routes/ai'));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
  await axios.get(`${process.env.AI_SERVICE_URL}/`, {
    timeout: 60000,
  });
} catch (err) {
  console.log("AI service is starting...");
}
});
