// Choir player script — Korean UI
// Creates an inline HTML5 player under each part when clicked.
let activeButton = null;

// 재생 횟수 추적을 위한 함수들
const PLAY_COUNT_KEY = 'choir_play_counts';

function getPlayCounts() {
  const countsStr = localStorage.getItem(PLAY_COUNT_KEY);
  return countsStr ? JSON.parse(countsStr) : {};
}

function savePlayCounts(counts) {
  localStorage.setItem(PLAY_COUNT_KEY, JSON.stringify(counts));
}

function incrementPlayCount(src) {
  const counts = getPlayCounts();
  counts[src] = (counts[src] || 0) + 1;
  savePlayCounts(counts);
  return counts[src];
}

function showPlayStats() {
  const counts = getPlayCounts();
  const statsContainer = document.getElementById('playStats');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = '<h3>음원 재생 통계</h3>';
  
  if (Object.keys(counts).length === 0) {
    statsContainer.innerHTML += '<p>아직 재생 기록이 없습니다.</p>';
    return;
  }
  
  let html = '<table><thead><tr><th>음원 파일</th><th>재생 횟수</th></tr></thead><tbody>';
  
  // 파일명만 표시하도록 정리
  Object.entries(counts).forEach(([src, count]) => {
    const fileName = src.split('/').pop();
    html += `<tr><td>${fileName}</td><td>${count}회</td></tr>`;
  });
  
  html += '</tbody></table>';
  statsContainer.innerHTML += html;
  statsContainer.style.display = 'block';
}

function createNoteIcon(){
  const span = document.createElement('span');
  span.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="#042027"/><path d="M9 7v10l10-3V4z" fill="#042027" opacity="0.9"/></svg>';
  span.style.display='inline-block';
  span.style.marginRight='8px';
  span.style.verticalAlign='middle';
  return span;
}

function clearOtherPlayers(){
  document.querySelectorAll('audio').forEach(a=>{
    try{ a.pause(); } catch(e){}
  });
}

function createOrTogglePlayer(btn){
  const src = btn.dataset.src;
  if(!src) return;

  // find or create local player container inside the same .song
  const song = btn.closest('.song');
  let container = song.querySelector('.local-player');
  if(!container){
    container = document.createElement('div');
    container.className = 'local-player';
    song.appendChild(container);
  }

  // If same src already loaded and playing -> toggle pause/play
  const existingAudio = container.querySelector('audio');
  if(existingAudio && existingAudio.src === src){
    if(existingAudio.paused) existingAudio.play().catch(err=>showError(container, err));
    else existingAudio.pause();
    return;
  }

  // remove other players and highlight current button
  clearOtherPlayers();
  document.querySelectorAll('.part').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeButton = btn;

  // create audio element
  container.innerHTML = '';
  const audioEl = document.createElement('audio');
  audioEl.controls = true;
  audioEl.preload = 'none';
  audioEl.src = src;
  container.appendChild(audioEl);

  // remove previous error messages
  const errEl = container.querySelector('.error'); if(errEl) errEl.remove();

  // try to play, catch CORS / permission errors
  audioEl.play().catch(err=>{
    showError(container, err);
    console.warn('재생 실패:', err);
  });

  // when audio ends, remove active state and increment play count
  audioEl.addEventListener('ended', ()=>{
    btn.classList.remove('active');
    activeButton = null; // 활성 버튼 초기화
    incrementPlayCount(src); // 재생 횟수 증가
  });

  // when audio pauses, remove active state
  audioEl.addEventListener('pause', () => {
    if (audioEl.currentTime > 0 && !audioEl.ended) { // 재생 중이거나 끝난 것이 아니면 (수동 일시 정지)
        btn.classList.remove('active');
        activeButton = null; // 활성 버튼 초기화
    }
  });
}

function showError(container, err){
  let el = container.querySelector('.error');
  if(!el){ el = document.createElement('div'); el.className = 'error'; container.appendChild(el); }
  el.textContent = '재생 실패: CORS 또는 접근 권한 문제일 수 있습니다. 콘솔의 오류를 확인하세요.';
}

// Attach to buttons
document.querySelectorAll('.part').forEach(btn=>{
  btn.prepend(createNoteIcon());
  btn.tabIndex = 0;
  btn.addEventListener('click', ()=> createOrTogglePlayer(btn));
  btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); btn.click(); } });
});

// 페이지 로드 시 URL 쿼리 파라미터 확인
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('stats')) {
    showPlayStats();
  }
});
