/**
 * シグナリングサーバー（WebSocketサーバー） + Webサーバー
 */
// Express
const express = require('express')
const app = express()

// publicディレクトリを公開
app.use(express.static(__dirname + '/public'))

const http = require('http')
const server = http.createServer(app)

// WebSocketサーバーにはsocket.ioを採用
const io = require('socket.io')(server)



function chatHandle(socket){
  socket.on('chatMessage',({message})=>{
    console.log(socket.userName)
    io.emit("chatMessage", {userName:socket.userName,message})
  })
}

userSockets= []

// 接続要求
io.on('connect', socket => {
  console.log('io', 'connect')
  console.log('io', 'socket: ', socket.id)

  // 受信側からの配信要求を配信側へ渡す
  socket.on('request', (name) =>{
      console.log(name,userSockets)
      io.to(userSockets[name]).emit('request', {cid:socket.id})
    }
  )

  // 配信側からのオファーを受信側へ渡す
  socket.on('offer', ({ offer,cid }) => {
    io.to(cid).emit('offer', { offer,cid:socket.id })
    // 配信側の接続が切れた場合にそれを受信側へ通知する
    socket.on('disconnect', (cid) => io.to().emit('close'))
  })
  socket.on('icecandidate', ({ candidate,cid }) => {
    io.to(cid).emit('icecandidate', { candidate,cid:socket.id })
    // 配信側の接続が切れた場合にそれを受信側へ通知する
  })

  // 受信側からのアンサーを配信側へ渡す
  socket.on('answer', ({ answer ,cid}) =>{
      console.log("answer")
      io.to(cid).emit('answer', { cid: socket.id, answer })
    }
  )
  socket.on('setUserName',(userName) => {
    if(!userName)userName = '';
    userSockets[userName]=socket.id;
    socket.userName=userName
    console.log(userName)
  }) 
  chatHandle(socket)
})

server.listen(55555)
