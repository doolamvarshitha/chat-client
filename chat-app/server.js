const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const mongoose = require('mongoose')
const User = require('./models/User') // User model
const Room = require('./models/Room') // Room model
const Message = require('./models/Message') // Message model

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/chatApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// Serve static files (like frontend)
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.send('Real-time chat app running')
})

// Socket.io connection
io.on('connection', socket => {
  console.log('A user connected')

  // Handle user joining a room
  socket.on('joinRoom', async ({username, room}) => {
    socket.join(room)

    // Find or create a user and room
    const user = await User.findOneAndUpdate(
      {username},
      {username},
      {upsert: true, new: true},
    )
    const chatRoom = await Room.findOneAndUpdate(
      {name: room},
      {name: room},
      {upsert: true, new: true},
    )

    // Retrieve chat history for the room
    const messages = await Message.find({room: chatRoom._id}).populate('user')

    socket.emit('loadMessages', messages) // Send chat history to the user

    socket.broadcast.to(room).emit('message', `${username} has joined the chat`)
  })

  // Handle message sent by a user
  socket.on('chatMessage', async ({msg, username, room}) => {
    const user = await User.findOne({username})
    const chatRoom = await Room.findOne({name: room})

    const message = new Message({
      content: msg,
      user: user._id,
      room: chatRoom._id,
    })

    await message.save()

    io.to(room).emit('message', {content: msg, username})
  })

  // Handle user disconnect
  socket.on('disconnect', () => {
    io.emit('message', 'A user has left the chat')
  })
})

// Start the server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
