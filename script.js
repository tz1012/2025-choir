// Choir player script — Korean UI
// Creates an inline HTML5 player under each part when clicked.
let activeButton = null;

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

  // when audio ends, remove active state
  audioEl.addEventListener('ended', ()=>{
    btn.classList.remove('active');
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
