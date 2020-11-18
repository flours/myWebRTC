;(() => {
  // シグナリングサーバーであるWebSocketサーバーに接続
  // 今回はsocket.ioを採用
  const socket = require('socket.io-client')('wss://lineapimaster.tk')
  const a=require("../500-milliseconds-of-silence.mp3")
  console.log(a)

  /**
   * @type {HTMLVideoElement}
   */
  const video = document.querySelector('video')
  const audio2 = document.querySelector('audio#audio2');

  video.addEventListener('click', evt => {
  })

  /**
   * コネクションを保存しておく用
   *
   * @type {RTCPeerConnection}
   */
  let connection = null

  // ソケット接続で配信要求する
  socket.on('connect', () => socket.emit('request'))

  // アンサーを受ける
  socket.on('offer', async ({ offer }) => sendAnswer(offer))

  // closeがきたらコネクションを切ってvideoも止める
  socket.on('close', () => {
    if (connection) {
      connection.close()
      connection = null
    }
  })

  /**
   * アンサーを送信する
   *
   * @param {RTCSessionDescription} offer
   * @return {void}
   */
  async function sendAnswer(offer) {
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
      if (audio2.srcObject !== evt.streams[0]) {
        audio2.srcObject = evt.streams[0]
        console.log('Received remote stream')
      }
      video.srcObject = evt.streams[0]
    }

    // ICE candidateを取得イベントハンドラ
    peer.onicecandidate = evt => {
      console.log(evt);
      // evt.candidateがnullならICE Candidateを全て取得したとみなしてアンサーを送信
      if (!evt.candidate)
        socket.emit('answer', { answer: peer.localDescription })
    }

    // コネクションの通信先としてオファーを設定
    await peer.setRemoteDescription(offer)

    // アンサーを作成
    const answer = await peer.createAnswer()

    // アンサーを自身に設定
    await peer.setLocalDescription(answer)
  }
})()
