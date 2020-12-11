;(async () => {
  // シグナリングサーバーであるWebSocketサーバーに接続
  // 今回はsocket.ioを採用
  const socket = require('socket.io-client')('wss://lineapimaster.tk',{transports: ['websocket']})
  connection=null
  function setHandler(){
    document.getElementById('sendButton').onclick = sendMessage;
    document.getElementById('watchButton').onclick = watchRequest;
    console.log("handler set");
  }

  function sendMessage(){
    text=document.getElementById('chatInput').value;
    socket.emit('chatMessage', { message:text})
  }
  function watchRequest(){
    text=document.getElementById('watchName').value;
    socket.emit('request',text)
  }

  /**
   * RTCPeerConnectionをクライアントごとに格納する変数
   * keyをクライアントID（ソケットID）として保存する
   */
  const connections = {}
  const video = document.querySelector('video')

  video.addEventListener('click', evt => {
    if (video.paused) video.play()
    else video.pause()
  })
  socket.on('close', () => {
    if (connection) {
      video.pause()
      video.srcObject = null
      connection.close()
      connection = null
    }
  })
  /**
   * PC映像streamを取得
   * @type {MediaStream}
   */
  var stream = null;
  document.getElementById('allowDelivery').onclick=async function(){
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
  }

  // ソケットサーバー疎通確認
  socket.on('connect', () => {
    socket.emit('setUserName',prompt('ユーザー名を半角英数で入力してください'))
  })

  // 配信要求を受ける
  // Client ID （cid）を受け取りコネクションを作成する
  socket.on('request', ({ cid }) => sendOffer(cid))

  // アンサーを受ける
  socket.on('answer', async ({ cid, answer }) => {
    console.log("answer",cid in connections)
    if (cid in connections) connections[cid].setRemoteDescription(answer)
  })
  

  socket.on('chatMessage', ({userName,message}) => {
    chatDiv=document.getElementById('chatMessages')
    chatDiv.innerHTML+="<hr>"+userName+"<br>"+message+"<hr><br>"
  })
  socket.on('offer', async ({ offer ,cid}) => sendAnswer(offer,cid))
  socket.on('icecandidate',async ({candidate,cid})=>receiveIceCandidate(candidate,cid))

  async function receiveIceCandidate(candidate,cid){
    console.log("get ice candidate",candidate,cid)
    if(connections[cid])connections[cid].addIceCandidate(candidate);
    if(connection)connection.addIceCandidate(candidate);
  }

  /**
   * オファーを送信する
   *
   * @param {string} cid Client ID
   * @return {void}
   */
  async function sendOffer(cid) {
    // コネクションの設定
    const pcConfig = {
      // STUNサーバーはGoogle様のものを利用させていただく
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }

    // コネクションの作成
    const peer = new RTCPeerConnection(pcConfig)

    // cidをキーとしてコネクションを保存
    connections[cid] = peer
    peer.onnegotiationneeded = async ()=>{
        await peer.setLocalDescription(await peer.createOffer());
        socket.emit('offer',{offer:peer.localDescription,cid});
    }
    // コネクションにストリームを設定
    stream.getTracks().forEach(track => {
        console.log(track,stream)
        peer.addTrack(track, stream)
    })

    // ICE candidateを取得イベントハンドラ
    peer.onicecandidate = evt => {
      // evt.candidateがnullならICE Candidateを全て取得したとみなしてオファーを送信
      if (evt.candidate)
        socket.emit('icecandidate', { candidate: evt.candidate, cid })
      else{
        console.log("send offer end")
      }
    }

    // オファーを作成
  }

  async function sendAnswer(offer,cid) {
    // コネクションの設定
    const pcConfig = {
      // STUNサーバーはGoogle様のものを利用させていただく
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }

    // コネクションの作成
    const peer = new RTCPeerConnection(pcConfig)

    // コネクションを保存
    connection = peer

    // 配信イベントハンドラ的な？
    peer.ontrack = evt => {
      console.log('ontrack')

      // streamを設定
      video.srcObject = evt.streams[0]
    }

    // ICE candidateを取得イベントハンドラ
    peer.onicecandidate = evt => {
      // evt.candidateがnullならICE Candidateを全て取得したとみなしてアンサーを送信
      if (evt.candidate)
        socket.emit('icecandidate', { candidate: evt.candidate ,cid })
      else{
        console.log("send answer end")
      }
    }

    // コネクションの通信先としてオファーを設定
    await peer.setRemoteDescription(offer)

    // アンサーを作成
    const answer = await peer.createAnswer()

    // アンサーを自身に設定
    await peer.setLocalDescription(answer)
    socket.emit('answer',{answer:peer.localDescription,cid})
  }

  setHandler();
})()
1
