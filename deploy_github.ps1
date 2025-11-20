<#
 deploy_github.ps1
 자동으로 로컬 저장소 초기화하고 GitHub 원격에 푸시하는 스크립트입니다.

 동작 요약:
 - Git 설치 여부 확인(없으면 winget으로 설치 시도, 사용자의 확인 필요)
 - .git이 없으면 초기화 및 최초 커밋 생성
 - 원격(origin)으로 https://github.com/tz1012/2025-choir.git 추가
 - main 브랜치로 푸시

 사용법:
 PowerShell에서 프로젝트 루트(D:\Coding\Choir)로 이동 후 실행:
 .\deploy_github.ps1

 보안/권한:
 - 푸시 시 인증이 필요합니다. 일반적으로 Git 자격증명(사용자 비밀번호 또는 Personal Access Token)을 요청합니다.
 - 비밀번호 입력 없이 자동화하려면 환경변수 `GITHUB_TOKEN`에 Personal Access Token(PAT)을 설정한 뒤 스크립트를 실행하세요.
   스크립트는 안전하게 토큰을 묻고(또는 env를 사용) 원격 URL에 토큰을 포함하여 푸시할 수 있습니다.

주의: 토큰을 URL에 포함시키는 방식은 편리하지만, 터미널 히스토리나 프로세스 리스트에 노출될 수 있으니 주의하세요.
#>

function Confirm-Or-Exit($msg){ if(-not (Read-Host "$msg (y/n)") -match '^[Yy]') { Write-Host '사용자 취소. 종료합니다.'; exit 1 } }

Write-Host "== GitHub 자동 배포 스크립트 ==`n" -ForegroundColor Cyan

# 1) Git 설치 확인
try{ git --version > $null 2>&1; $gitOk = $true } catch { $gitOk = $false }
if(-not $gitOk){
  Write-Host "Git이 설치되어 있지 않습니다. winget으로 설치를 시도할 수 있습니다." -ForegroundColor Yellow
  if(-not (Get-Command winget -ErrorAction SilentlyContinue)){
    Write-Host "winget이 감지되지 않습니다. 수동으로 Git을 설치하세요: https://git-scm.com/download/win" -ForegroundColor Red
    Confirm-Or-Exit "계속하려면 Git을 수동으로 설치한 후 재실행하시겠습니까?"
  } else {
    Confirm-Or-Exit "winget으로 Git을 설치하겠습니다. 계속할까요? (관리자 권한을 요구할 수 있습니다)"
    Write-Host "winget을 사용해 Git 설치를 시도합니다..." -ForegroundColor Green
    winget install --id Git.Git -e --source winget
    Write-Host "설치 완료. PowerShell을 다시 여시고 스크립트를 재실행하세요." -ForegroundColor Green
    exit 0
  }
}

# 2) 리포지토리 루트 확인
$root = Get-Location
Write-Host "프로젝트 경로: $root"

# 3) .git 초기화(없으면)
if(-not (Test-Path "$root\.git")){
  Write-Host "로컬 Git 저장소가 없습니다. 초기화합니다..." -ForegroundColor Green
  git init -b main
} else { Write-Host "이미 .git이 존재합니다." }

# 4) 원격 추가
$remoteUrl = 'https://github.com/tz1012/2025-choir.git'
$existing = git remote -v 2>$null | Select-String 'origin' -SimpleMatch
if(-not $existing){
  Write-Host "원격 origin을 추가합니다: $remoteUrl"
  git remote add origin $remoteUrl
} else { Write-Host "origin 원격이 이미 설정되어 있습니다." }

# 5) 스테이지 및 커밋
$status = git status --porcelain
if(-not $status){ Write-Host "변경사항 없음. 커밋할 항목이 없습니다." }
else {
  Write-Host "변경된 파일 스테이징 및 커밋을 생성합니다..." -ForegroundColor Green
  git add .
  git commit -m "chore: initial commit — choir player site"
}

# 6) 푸시 (토큰 사용 옵션)
Write-Host "원격에 푸시합니다." -ForegroundColor Cyan
if($env:GITHUB_TOKEN){
  Write-Host "환경변수 GITHUB_TOKEN을 사용하여 비인터랙티브 푸시를 시도합니다." -ForegroundColor Green
  $token = $env:GITHUB_TOKEN.Trim()
  # remote with token (temporary)
  $secureUrl = "https://$($token)@github.com/tz1012/2025-choir.git"
  git push $secureUrl main -u
} else {
  Write-Host "GITHUB_TOKEN 환경변수가 설정되어 있지 않습니다. 자격증명을 묻는 프롬프트가 나타날 수 있습니다." -ForegroundColor Yellow
  git branch -M main
  git push -u origin main
}

Write-Host "푸시 명령 완료. GitHub 리포지토리를 확인하세요: $remoteUrl" -ForegroundColor Cyan
Write-Host "GitHub Pages를 활성화하려면 리포지토리 Settings → Pages 로 이동하여 브랜치 'main'을 선택하세요." -ForegroundColor Green
