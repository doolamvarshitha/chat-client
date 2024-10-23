import React, {useState, useEffect} from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:3000')

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')

  useEffect(() => {
    socket.on('message', msg => {
      setMessages(prevMessages => [...prevMessages, msg])
    })

    socket.on('loadMessages', messages => {
      setMessages(messages)
    })
  }, [])

  const joinRoom = () => {
    if (username && room) {
      socket.emit('joinRoom', {username, room})
    }
  }

  const sendMessage = () => {
    if (input) {
      socket.emit('chatMessage', {msg: input, username, room})
      setInput('')
    }
  }

  return (
    <div>
      <div>
        <input
          placeholder='Username'
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          placeholder='Room'
          value={room}
          onChange={e => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            {msg.username ? `${msg.username}: ${msg.content}` : msg}
          </p>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Type a message'
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}

export default App
