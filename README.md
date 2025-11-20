# Choir Player (합창 음원 플레이어)

간단한 정적 사이트로, 각 곡별로 파트 버튼을 눌러 해당 음원을 재생합니다. HTML/CSS/JS만 사용하므로 GitHub Pages에 바로 배포할 수 있습니다.

사용법
- 저장소 루트에 있는 파일들을 커밋하고 push 하세요.
- GitHub에서 Repository > Settings > Pages에서 `main` 브랜치와 `/` (root) 또는 `docs/`를 선택해 활성화하세요.

권장 파일 구조
- `index.html` — 메인 페이지
- `styles.css` — 스타일
- `script.js` — 플레이어 로직

주의
- Google Drive 직접 다운로드 링크를 사용했습니다. 일부 링크는 CORS나 접근 제약으로 인해 브라우저에서 바로 재생되지 않을 수 있습니다. 그럴 경우 파일을 GitHub 저장소에 넣거나 공개 호스팅(예: Netlify, AWS S3)으로 옮겨주세요.

추가 작업 제안
- 각 곡에 커버 이미지 추가
- 재생목록/연속 재생 기능
- 모바일에서 더 큰 터치 타깃 추가

CORS 테스트 (PowerShell)
--------------------------------
프로젝트 루트에서 제공한 `test_cors.ps1` 스크립트를 실행하면 `index.html`에 선언된 모든 `data-src` URL을 찾아 각 URL의 응답 헤더를 검사합니다. 특히 `Access-Control-Allow-Origin` 헤더가 있는지 확인하세요.

실행 방법 (PowerShell):
```powershell
cd path\to\Choir
.\test_cors.ps1
```

해석 가이드:
- `Access-Control-Allow-Origin` 헤더가 `*` 또는 사이트의 오리진(예: `https://yourusername.github.io`)을 포함하면 브라우저에서 직접 재생될 가능성이 높습니다.
- 해당 헤더가 없으면 브라우저가 CORS 정책으로 오디오 요청을 차단할 수 있습니다. 이 경우 해결 방법:
	- 음원 파일을 리포지토리에 추가하여 GitHub Pages로 함께 호스팅(권장)
	- Cloud storage/S3/Netlify 같은 공용 호스팅으로 이동
	- 서버 측에서 CORS 헤더를 설정하도록 구성

문제 발생 시 출력 결과(또는 스크린샷)를 붙여 올려주시면, 제가 다음 단계(파일 이동 스크립트, 커밋/푸시 명령, 또는 업로드 가이드)를 도와드리겠습니다.
