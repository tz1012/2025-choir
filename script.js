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

// 전체 통계 조회 (모두에게 공개)
async function showGlobalStats() {
  const statsContainer = document.getElementById('playStats');
  if (!statsContainer) return;

  statsContainer.innerHTML = '<h3>실시간 연습 순위 (전체)</h3><div class="loading-spinner">데이터를 불러오는 중입니다...</div>';

  try {
    // 모든 재생 이벤트 조회
    // 주의: 데이터가 많아지면 비용 문제가 발생할 수 있으므로, 추후에는 서버 측 집계나 limit() 사용 권장
    const snapshot = await db.collection('playEvents').get();

    if (snapshot.empty) {
      statsContainer.innerHTML = '<h3>우리 대원들이 열심히 연습 중인 곡</h3><p>아직 데이터가 충분하지 않습니다. 연습을 시작해보세요!</p>';
      return;
    }

    // 음원별 재생 횟수 집계
    const counts = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const src = data.src;
      if (src) {
        counts[src] = (counts[src] || 0) + 1;
      }
    });

    // 정렬 (내림차순)
    const sortedStats = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
    // .slice(0, 5); // 전체 보기 위해 제한 해제

    let html = '<div class="stats-list">';

    // 파일명 매핑 (파일명 -> 곡 제목 변환 로직이 없으므로 일단 파일명 사용하되 좀 더 깔끔하게)
    sortedStats.forEach(([src, count], index) => {
      let fileName = src.split('/').pop().replace('.m4a', '');
      // 간단한 포맷팅: 01_soprano -> 1. Soprano
      fileName = fileName.replace(/_/g, ' ').replace(/(\d+)/, '$1.');

      const rankClass = index < 3 ? `rank-${index + 1}` : '';

      html += `
        <div class="stat-item ${rankClass}">
          <span class="stat-rank">${index + 1}위</span>
          <span class="stat-name">${fileName}</span>
          <span class="stat-count">${count}회</span>
        </div>`;
    });

    html += '</div>';

    // 총 재생 횟수
    const totalPlays = Object.values(counts).reduce((sum, count) => sum + count, 0);
    html += `<div class="total-count-badge">현재까지 총 <span class="highlight">${totalPlays}</span>번 연습했습니다!</div>`;

    statsContainer.innerHTML = '<h3>실시간 연습 순위 (전체)</h3>' + html;

  } catch (error) {
    console.error('Error fetching stats:', error);
    statsContainer.innerHTML = '<h3>통계 조회 실패</h3><p>데이터를 불러오는 데 실패했습니다.<br>잠시 후 다시 시도해주세요.</p>';
  }
}

// 기존 showPlayStats 함수 (로컬 통계) 유지
function showLocalStats() {
  const PLAY_COUNT_KEY = 'choir_play_counts';
  const countsStr = localStorage.getItem(PLAY_COUNT_KEY);
  const counts = countsStr ? JSON.parse(countsStr) : {};

  const statsContainer = document.getElementById('playStats');
  if (!statsContainer) return;

  statsContainer.innerHTML = '<h3>열심히 연습하고 있는 곡과 파트</h3>';

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
  // statsContainer.style.display = 'block'; // 모달에서 제어하므로 여기서는 굳이 block 할 필요 없지만 유지해도 됨
}

function createNoteIcon() {
  const span = document.createElement('span');
  span.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="#042027"/><path d="M9 7v10l10-3V4z" fill="#042027" opacity="0.9"/></svg>';
  span.style.display = 'inline-block';
  span.style.marginRight = '8px';
  span.style.verticalAlign = 'middle';
  return span;
}

function clearOtherPlayers() {
  document.querySelectorAll('audio').forEach(a => {
    try { a.pause(); } catch (e) { }
  });
}

function createOrTogglePlayer(btn) {
  const src = btn.dataset.src;
  if (!src) return;

  // find or create local player container inside the same .song
  const song = btn.closest('.song');
  let container = song.querySelector('.local-player');
  if (!container) {
    container = document.createElement('div');
    container.className = 'local-player';
    song.appendChild(container);
  }

  // If same src already loaded and playing -> toggle pause/play
  const existingAudio = container.querySelector('audio');
  if (existingAudio && existingAudio.src === src) {
    if (existingAudio.paused) existingAudio.play().catch(err => showError(container, err));
    else existingAudio.pause();
    return;
  }

  // remove other players and highlight current button
  clearOtherPlayers();
  document.querySelectorAll('.part').forEach(b => b.classList.remove('active'));
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
  const errEl = container.querySelector('.error'); if (errEl) errEl.remove();

  // 중복 로깅 방지 플래그
  let hasLogged = false;
  const LOG_THRESHOLD_SECONDS = 60; // 60초 이상 재생 시 카운트

  // try to play, catch CORS / permission errors
  audioEl.play().catch(err => {
    showError(container, err);
    console.warn('재생 실패:', err);
  });

  // 재생 시간 모니터링 (60초 이상 재생 시 카운트)
  audioEl.addEventListener('timeupdate', () => {
    if (!hasLogged && audioEl.currentTime >= LOG_THRESHOLD_SECONDS) {
      logPlayEvent(src);
      saveLocalCount(src);
      hasLogged = true;
      console.log(`Played over ${LOG_THRESHOLD_SECONDS}s, logged event.`);
    }
  });

  // when audio ends, remove active state and log play event (if not logged yet)
  audioEl.addEventListener('ended', () => {
    btn.classList.remove('active');
    activeButton = null; // 활성 버튼 초기화

    // 60초 미만이라도 끝까지 들었으면 카운트 (짧은 곡일 경우)
    // 단, 너무 짧은(예: 5초 미만) 건 실수로 눌렀을 수 있으니 제외하고 싶다면 조건 추가 가능
    // 여기서는 "끝까지 들음"을 존중하여 카운트하되 중복만 방지
    if (!hasLogged && audioEl.duration > 5) {
      logPlayEvent(src);
      saveLocalCount(src);
      hasLogged = true;
      console.log('Played to end, logged event.');
    }
  });

  // when audio pauses, remove active state
  audioEl.addEventListener('pause', () => {
    if (audioEl.currentTime > 0 && !audioEl.ended) { // 재생 중이거나 끝난 것이 아니면 (수동 일시 정지)
      btn.classList.remove('active');
      activeButton = null; // 활성 버튼 초기화
    }
  });
}

// 로컬 저장소 카운트 업데이트 헬퍼 함수
function saveLocalCount(src) {
  const PLAY_COUNT_KEY = 'choir_play_counts';
  const countsStr = localStorage.getItem(PLAY_COUNT_KEY);
  const counts = countsStr ? JSON.parse(countsStr) : {};
  counts[src] = (counts[src] || 0) + 1;
  localStorage.setItem(PLAY_COUNT_KEY, JSON.stringify(counts));
}

function showError(container, err) {
  let el = container.querySelector('.error');
  if (!el) { el = document.createElement('div'); el.className = 'error'; container.appendChild(el); }
  el.textContent = '재생 실패: CORS 또는 접근 권한 문제일 수 있습니다. 콘솔의 오류를 확인하세요.';
}

// Attach to buttons
document.querySelectorAll('.part').forEach(btn => {
  btn.prepend(createNoteIcon());
  btn.tabIndex = 0;
  btn.addEventListener('click', () => createOrTogglePlayer(btn));
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
});

// 페이지 로드 시 URL 쿼리 파라미터 확인 및 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);

  // Stats Toggle & Modal Logic
  const statsToggle = document.getElementById('statsToggle');
  const statsModal = document.getElementById('statsModal');
  const closeButton = document.querySelector('.close-button');

  if (statsToggle && statsModal) {
    // 토글 버튼 클릭 시 통계 표시
    statsToggle.addEventListener('click', function () {
      // 로컬 통계 대신 Firebase 전체 통계 조회
      // showLocalStats(); 
      showGlobalStats();
      statsModal.style.display = 'block';
    });

    // 닫기 버튼 클릭 시 모달 닫기
    if (closeButton) {
      closeButton.addEventListener('click', function () {
        statsModal.style.display = 'none';
      });
    }

    // 모달 배경 클릭 시 닫기
    window.addEventListener('click', function (event) {
      if (event.target == statsModal) {
        statsModal.style.display = 'none';
      }
    });
  }

  // 관리자 모드: ?admin=true&password=YOUR_PASSWORD
  if (urlParams.has('admin') && urlParams.get('admin') === 'true') {
    const password = urlParams.get('password');
    // 간단한 비밀번호 검증 (실제 사용 시 더 강력한 인증 필요)
    if (password === 'choir2025') { // 기본 비밀번호, 사용자가 변경해야 함
      const statsContainer = document.getElementById('playStats');
      if (statsContainer) statsContainer.style.display = 'block'; // 컨테이너 표시
      showAdminStats();
      if (statsModal) statsModal.style.display = 'block'; // 관리자 모드일 경우 바로 모달 띄우기
    } else {
      const statsContainer = document.getElementById('playStats');
      if (statsContainer) {
        statsContainer.innerHTML = '<h3>관리자 통계</h3><p style="color: red;">잘못된 비밀번호입니다.</p>';
        statsContainer.style.display = 'block';
        if (statsModal) statsModal.style.display = 'block';
      }
    }
  }
  // 일반 사용자 통계 모드: ?stats=true
  else if (urlParams.has('stats')) {
    if (statsModal) statsModal.style.display = 'block';
    showLocalStats();
  }
});
