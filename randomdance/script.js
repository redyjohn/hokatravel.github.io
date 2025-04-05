const API_KEY = 'AIzaSyBoBluiwJEmslSiPQdFJHfD1ehfINexnvE' // <-- 替換成你的金鑰
const PLAYLIST_ID = 'PLadf_ia2rR2Jkdd6gsXd_u0ksykkoEXyO'

let videos = []
let player = null
let currentIndex = 0
let shuffled = []
let isSequential = false
let isRandom = false

// 當 API 載入完畢時呼叫
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      'onStateChange': onPlayerStateChange
    }
  })
  loadPlaylist()
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    if (isSequential) playNextSequential()
    if (isRandom) playNextRandom()
  }
}

async function loadPlaylist() {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  videos = data.items.map(item => ({
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title
  }))

  const select = document.getElementById('videoSelect')
  videos.forEach(v => {
    const option = document.createElement('option')
    option.value = v.videoId
    option.textContent = v.title
    select.appendChild(option)
  })
}

function playSelected() {
  isSequential = false
  isRandom = false
  const selected = document.getElementById('videoSelect').value
  if (selected && player) {
    player.loadVideoById(selected)
  }
}

function playSequential() {
  isSequential = true
  isRandom = false
  currentIndex = 0
  playNextSequential()
}

function playNextSequential() {
  if (currentIndex < videos.length) {
    const videoId = videos[currentIndex].videoId
    player.loadVideoById(videoId)
    currentIndex++
  } else {
    isSequential = false
  }
}

function playRandom() {
  isRandom = true
  isSequential = false
  shuffled = shuffleArray([...videos])
  currentIndex = 0
  playNextRandom()
}

function playNextRandom() {
  if (currentIndex < shuffled.length) {
    const videoId = shuffled[currentIndex].videoId
    player.loadVideoById(videoId)
    currentIndex++
  } else {
    isRandom = false
  }
}

function pauseVideo() {
  if (player) player.pauseVideo()
}

function resumeVideo() {
  if (player) player.playVideo()
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
