// Choir player script — Korean UI
// Creates an inline HTML5 player under each part when clicked.
let activeButton = null;

// Firebase 구성 (사용자가 자신의 Firebase 프로젝트 구성으로 교체해야 함)
const firebaseConfig = {
  apiKey: "AIzaSyDNGPwze7HnjgGgCKPXtFTk62bfrwrZt6E",
  authDomain: "choir-a63d6.firebaseapp.com",
  projectId: "choir-a63d6",
  storageBucket: "choir-a63d6.firebasestorage.app",
  messagingSenderId: "798976162474",
  appId: "1:798976162474:web:f170bb9f9d953d8ba3eed3",
  measurementId: "G-SV0B6L7VQZ"
};

// Firebase 초기화
try {
  firebase.initializeApp(firebaseConfig);
} catch (err) {
  console.log('Firebase already initialized or config missing');
}

const db = firebase.firestore();

// 재생 이벤트를 Firestore에 저장
async function logPlayEvent(src) {
  try {
    const playEvent = {
      src: src,
      fileName: src.split('/').pop(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };
    
    await db.collection('playEvents').add(playEvent);
    console.log('Play event logged:', src);
  } catch (error) {
    console.error('Error logging play event:', error);
    // 실패 시 localStorage에 임시 저장 (나중에 동기화)
    saveToLocalStorage(src);
  }
}

// Firestore 연결 실패 시 localStorage에 임시 저장
function saveToLocalStorage(src) {
  const key = 'pendingPlayEvents';
  const pending = JSON.parse(localStorage.getItem(key) || '[]');
  pending.push({
    src: src,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(pending));
}

// 관리자 통계 조회
async function showAdminStats() {
  const statsContainer = document.getElementById('playStats');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = '<h3>전체 음원 재생 통계 (관리자)</h3><p>데이터 로딩 중...</p>';
  statsContainer.style.display = 'block';
  
  try {
    // 모든 재생 이벤트 조회
    const snapshot = await db.collection('playEvents').get();
    
    if (snapshot.empty) {
      statsContainer.innerHTML = '<h3>전체 음원 재생 통계 (관리자)</h3><p>아직 재생 기록이 없습니다.</p>';
      return;
    }
    
    // 음원별 재생 횟수 집계
    const counts = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const src = data.src;
      counts[src] = (counts[src] || 0) + 1;
    });
    
    // 날짜별 통계도 추가
    const dateCounts = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date || new Date(doc.data().timestamp?.toDate()).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    let html = '<div class="stats-section"><h4>음원별 재생 횟수</h4><table><thead><tr><th>음원 파일</th><th>재생 횟수</th></tr></thead><tbody>';
    
    // 파일명만 표시하도록 정리
    Object.entries(counts).forEach(([src, count]) => {
      const fileName = src.split('/').pop();
      html += `<tr><td>${fileName}</td><td>${count}회</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    
    // 날짜별 통계
    html += '<div class="stats-section" style="margin-top: 2rem;"><h4>날짜별 재생 횟수</h4><table><thead><tr><th>날짜</th><th>재생 횟수</th></tr></thead><tbody>';
    
    Object.entries(dateCounts).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, count]) => {
      html += `<tr><td>${date}</td><td>${count}회</td></tr>`;
    });
    
    html += '</tbody></table></div>';
    
    // 총 재생 횟수
    const totalPlays = Object.values(counts).reduce((sum, count) => sum + count, 0);
    html = `<p><strong>총 재생 횟수: ${totalPlays}회</strong></p>` + html;
    
    statsContainer.innerHTML = '<h3>전체 음원 재생 통계 (관리자)</h3>' + html;
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    statsContainer.innerHTML = '<h3>전체 음원 재생 통계 (관리자)</h3><p style="color: red;">통계 조회 중 오류가 발생했습니다.</p>';
  }
}

// 기존 showPlayStats 함수 (로컬 통계) 유지
function showLocalStats() {
  const PLAY_COUNT_KEY = 'choir_play_counts';
  const countsStr = localStorage.getItem(PLAY_COUNT_KEY);
  const counts = countsStr ? JSON.parse(countsStr) : {};
  
  const statsContainer = document.getElementById('playStats');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = '<h3>내 재생 통계 (로컬)</h3>';
  
  if (Object.keys(counts).length === 0) {
    statsContainer.innerHTML += '<p>아직 재생 기록이 없습니다.</p>';
    return;
  }
  
  let html = '<table><thead><tr><th>음원 파일</th><th>재생 횟수</th></tr></thead><tbody>';
  
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

  // when audio ends, remove active state and log play event
  audioEl.addEventListener('ended', ()=>{
    btn.classList.remove('active');
    activeButton = null; // 활성 버튼 초기화
    logPlayEvent(src); // Firestore에 재생 이벤트 로깅
    
    // 로컬 저장소에도 백업 저장
    const PLAY_COUNT_KEY = 'choir_play_counts';
    const countsStr = localStorage.getItem(PLAY_COUNT_KEY);
    const counts = countsStr ? JSON.parse(countsStr) : {};
    counts[src] = (counts[src] || 0) + 1;
    localStorage.setItem(PLAY_COUNT_KEY, JSON.stringify(counts));
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
  
  // 관리자 모드: ?admin=true&password=YOUR_PASSWORD
  if (urlParams.has('admin') && urlParams.get('admin') === 'true') {
    const password = urlParams.get('password');
    // 간단한 비밀번호 검증 (실제 사용 시 더 강력한 인증 필요)
    if (password === 'choir2025') { // 기본 비밀번호, 사용자가 변경해야 함
      showAdminStats();
    } else {
      const statsContainer = document.getElementById('playStats');
      if (statsContainer) {
        statsContainer.innerHTML = '<h3>관리자 통계</h3><p style="color: red;">잘못된 비밀번호입니다.</p>';
        statsContainer.style.display = 'block';
      }
    }
  }
  // 일반 사용자 통계 모드: ?stats=true
  else if (urlParams.has('stats')) {
    showLocalStats();
  }
});
