// 配置
const CONFIG = {
    PLAYLIST_ID: 'PLadf_ia2rR2Jkdd6gsXd_u0ksykkoEXyO',
    API_KEY: 'AIzaSyBoBluiwJEmslSiPQdFJHfD1ehfINexnvE', // 替換為你的 YouTube API 金鑰
    MAX_RESULTS: 50 // 每次請求最大結果數 (分頁用)
};

// 全局變數
let player;
let playlistItems = [];
let currentVideoIndex = -1;
let selectedVideos = [];
let playedVideos = [];
let isLoading = true;

// YouTube API 準備好後會自動呼叫此函數
function onYouTubeIframeAPIReady() {
    player = new YT.Player('video-player', {
        height: '450',
        width: '800',
        playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin // 重要！解決跨域限制
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    
    // 載入播放清單
    loadPlaylist();
}

function onPlayerReady(event) {
    console.log('播放器準備就緒');
    updateUI();
}

function onPlayerStateChange(event) {
    // 當影片結束時自動播放下一首
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
    // 處理播放錯誤
    else if (event.data === YT.PlayerState.ERROR) {
        handlePlaybackError();
    }
    
    updateUI();
}

// 處理播放錯誤
function handlePlaybackError() {
    const currentVideo = playlistItems[currentVideoIndex];
    let errorMsg = `無法播放: ${currentVideo.title}`;
    
    // 根據錯誤類型提供不同訊息
    const errorData = player.getVideoData().error;
    switch (errorData) {
        case 'auth':
            errorMsg += ' (需要登入 YouTube 帳號)';
            break;
        case 'private':
            errorMsg += ' (私人影片)';
            break;
        case 'unplayable':
            errorMsg += ' (版權或地區限制)';
            break;
        default:
            errorMsg += ' (播放錯誤)';
    }
    
    document.getElementById('status').textContent = errorMsg;
    
    // 標記當前項目為不可播放
    const currentItem = document.querySelector(`.playlist-item[data-index="${currentVideoIndex}"]`);
    if (currentItem) {
        currentItem.classList.add('unplayable');
    }
    
    // 自動跳過無法播放的影片
    setTimeout(playNextVideo, 2000);
}

// 從 YouTube API 載入播放清單 (含分頁處理)
async function loadPlaylist() {
    try {
        let nextPageToken = '';
        playlistItems = [];
        
        // 分頁獲取所有影片
        do {
            const playlistItemsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&maxResults=${CONFIG.MAX_RESULTS}&pageToken=${nextPageToken}&playlistId=${CONFIG.PLAYLIST_ID}&key=${CONFIG.API_KEY}`
            );
            
            if (!playlistItemsResponse.ok) {
                throw new Error(`API 請求失敗: ${playlistItemsResponse.status}`);
            }
            
            const playlistItemsData = await playlistItemsResponse.json();
            
            // 過濾可嵌入的公開影片
            const validItems = playlistItemsData.items.filter(item => 
                item.status.privacyStatus === 'public' &&
                item.status.embeddable === true
            );
            
            playlistItems.push(...validItems.map(item => ({
                id: item.id,
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.default?.url,
                embeddable: item.status.embeddable
            })));
            
            nextPageToken = playlistItemsData.nextPageToken || '';
            
            // 更新載入狀態
            document.getElementById('playlist').innerHTML = 
                `<li class="loading">已載入 ${playlistItems.length} 首歌曲...</li>`;
            
        } while (nextPageToken && playlistItems.length < 500); // 安全限制
        
        renderPlaylist();
        updateCounts();
        isLoading = false;
        
    } catch (error) {
        console.error('載入播放清單失敗:', error);
        document.getElementById('playlist').innerHTML = 
            `<li style="color:red">載入失敗: ${error.message}</li>`;
    }
}

// 渲染播放清單
function renderPlaylist() {
    const playlistElement = document.getElementById('playlist');
    playlistElement.innerHTML = '';
    
    if (playlistItems.length === 0) {
        playlistElement.innerHTML = '<li>沒有可用的影片</li>';
        return;
    }
    
    playlistItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.dataset.index = index;
        
        // 標記不可播放的影片
        if (!item.embeddable) {
            li.classList.add('unplayable');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.dataset.index = index;
        checkbox.addEventListener('change', updateSelectedVideos);
        
        const thumbnail = document.createElement('img');
        thumbnail.className = 'video-thumbnail';
        thumbnail.src = item.thumbnail || '';
        thumbnail.alt = item.title;
        
        const title = document.createElement('span');
        title.className = 'video-title';
        title.textContent = item.title;
        
        li.appendChild(checkbox);
        li.appendChild(thumbnail);
        li.appendChild(title);
        playlistElement.appendChild(li);
        
        // 初始化選中的影片
        selectedVideos.push(index);
    });
}

// 更新選中的影片
function updateSelectedVideos() {
    selectedVideos = [];
    const checkboxes = document.querySelectorAll('#playlist input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedVideos.push(parseInt(checkbox.dataset.index));
    });
    
    // 重置已播放列表
    playedVideos = [];
    currentVideoIndex = -1;
    
    updateCounts();
    updateUI();
}

// 播放選中的影片
function playSelectedVideos() {
    if (isLoading) {
        alert('播放清單正在載入中，請稍候');
        return;
    }
    
    if (selectedVideos.length === 0) {
        alert('請至少選擇一首歌曲');
        return;
    }
    
    const playMode = document.getElementById('play-mode').value;
    
    if (playMode === 'random') {
        playRandomVideo();
    } else {
        playSequentialVideo(0);
    }
    
    updateUI();
}

// 隨機播放
function playRandomVideo() {
    if (playedVideos.length === selectedVideos.length) {
        document.getElementById('status').textContent = '所有選中的歌曲已播放完畢';
        return;
    }
    
    // 獲取尚未播放的影片
    const availableVideos = selectedVideos.filter(index => !playedVideos.includes(index));
    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const videoIndex = availableVideos[randomIndex];
    
    playVideoByIndex(videoIndex);
}

// 順序播放
function playSequentialVideo(index) {
    if (index >= selectedVideos.length) {
        document.getElementById('status').textContent = '所有選中的歌曲已播放完畢';
        return;
    }
    
    const videoIndex = selectedVideos[index];
    playVideoByIndex(videoIndex);
}

// 播放指定索引的影片
function playVideoByIndex(index) {
    if (index < 0 || index >= playlistItems.length) return;
    
    const videoId = playlistItems[index].videoId;
    player.loadVideoById(videoId);
    currentVideoIndex = index;
    playedVideos.push(index);
    
    // 更新 UI 標記正在播放的項目
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('playing');
    });
    
    const currentItem = document.querySelector(`.playlist-item[data-index="${index}"]`);
    if (currentItem) {
        currentItem.classList.add('playing');
        currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    document.getElementById('status').textContent = `正在播放: ${playlistItems[index].title}`;
    updateUI();
}

// 播放下一首
function playNextVideo() {
    const playMode = document.getElementById('play-mode').value;
    
    if (playMode === 'random') {
        playRandomVideo();
    } else {
        // 找到當前影片在 selectedVideos 中的位置
        const currentPos = selectedVideos.indexOf(currentVideoIndex);
        if (currentPos !== -1 && currentPos < selectedVideos.length - 1) {
            playSequentialVideo(currentPos + 1);
        } else {
            document.getElementById('status').textContent = '已播放完所有選中的歌曲';
        }
    }
    
    updateUI();
}

// 更新計數顯示
function updateCounts() {
    document.getElementById('total-count').textContent = playlistItems.length;
    document.getElementById('selected-count').textContent = selectedVideos.length;
}

// 更新 UI 狀態
function updateUI() {
    const isPlaying = player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING;
    
    document.getElementById('play-btn').disabled = selectedVideos.length === 0;
    document.getElementById('pause-btn').disabled = !isPlaying;
    document.getElementById('next-btn').disabled = selectedVideos.length === 0 || 
        (playedVideos.length === selectedVideos.length && currentVideoIndex !== -1);
}

// 清除所有選擇
function clearSelection() {
    document.querySelectorAll('#playlist input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedVideos();
}

// 全選
function selectAll() {
    document.querySelectorAll('#playlist input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectedVideos();
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('play-btn').addEventListener('click', playSelectedVideos);
    document.getElementById('pause-btn').addEventListener('click', () => {
        player.pauseVideo();
        updateUI();
    });
    document.getElementById('next-btn').addEventListener('click', playNextVideo);
    document.getElementById('clear-btn').addEventListener('click', clearSelection);
    document.getElementById('select-all-btn').addEventListener('click', selectAll);
    document.getElementById('play-mode').addEventListener('change', () => {
        // 切換播放模式時重置播放狀態
        playedVideos = [];
        if (currentVideoIndex !== -1) {
            playedVideos.push(currentVideoIndex);
        }
    });
});