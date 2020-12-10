;(async () => {
  // シグナリングサーバーであるWebSocketサーバーに接続
  // 今回はsocket.ioを採用
  const socket = require('socket.io-client')('wss://lineapimaster.tk',{transports: ['websocket']})

  function setHandler(){
    document.getElementById('sendButton').onclick = sendMessage;
    console.log("handler set");
  }

  function sendMessage(){
    text=document.getElementById('chatInput').value;
    socket.emit('chatMessage', { message:text})
  }

  /**
   * RTCPeerConnectionをクライアントごとに格納する変数
   * keyをクライアントID（ソケットID）として保存する
   */
  const connections = {}

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

    // コネクションにストリームを設定
    stream.getTracks().forEach(track => {
        console.log(track,stream)
        peer.addTrack(track, stream)
    })

    // ICE candidateを取得イベントハンドラ
    peer.onicecandidate = evt => {
      // evt.candidateがnullならICE Candidateを全て取得したとみなしてオファーを送信
      if (!evt.candidate)
        socket.emit('offer', { offer: peer.localDescription, cid })
    }

    // オファーを作成
    const offer = await peer.createOffer()

    // オファーを自身に設定
    // STUNサーバーへアクセスが始まり、onicecandidateが呼ばれるようになる
    await peer.setLocalDescription(offer)
  }
  setHandler();
})()

