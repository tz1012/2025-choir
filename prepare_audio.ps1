<#
 prepare_audio.ps1
 일괄 이름 변경 스크립트
 - 사용자가 제공한 원래 파일명을 `audio/` 폴더의 안전한 파일명으로 옮깁니다.
 - 스크립트는 현재 디렉토리(또는 지정된 소스 디렉토리)에서 파일을 찾습니다.
 - 찾은 파일을 그대로 `audio/<target>` 으로 이동(이동 혹은 복사 옵션 선택 가능)합니다.

사용법:
 1) 원본 파일들이 있는 폴더(예: Downloads)에 이 스크립트를 복사하거나
    스크립트를 프로젝트 루트에서 실행하면서 `-Source` 파라미터로 경로를 지정하세요.
 2) 스크립트가 찾은 파일과 매핑을 출력합니다. 확인 후 자동으로 이동하고(기본) 필요시 Git에 추가합니다.

예:
 cd D:\Coding\Choir
 .\prepare_audio.ps1 -Source "D:\Downloads\choir_files" -Move -GitCommit

#>

param(
  [string]$Source = "./",
  [switch]$Move,
  [switch]$GitCommit
)

Set-StrictMode -Version Latest

$map = @{
  # song 1
  '1. 장 라신의의 찬가(베이스).m4a' = '01_bass.m4a'
  '1. 장 라신의의 찬가(소).m4a' = '01_soprano.m4a'
  '1. 장 라신의의 찬가(알토).m4a' = '01_alto.m4a'
  '1. 장 라신의의 찬가(테너).m4a' = '01_tenor.m4a'

  # song 2
  '2. 성탄의 기적(베이스1).m4a' = '02_bass1.m4a'
  '2. 성탄의 기적(베이스2).m4a' = '02_bass2.m4a'
  '2. 성탄의 기적(소1).m4a' = '02_soprano1.m4a'
  '2. 성탄의 기적(소2).m4a' = '02_soprano2.m4a'
  '2. 성탄의 기적(알토1).m4a' = '02_alto1.m4a'
  '2. 성탄의 기적(알토2).m4a' = '02_alto2.m4a'
  '2. 성탄의 기적(테너).m4a' = '02_tenor.m4a'

  # song 3
  '3. 하늘의 찬송(S.A.T.B).m4a' = '03_full.m4a'

  # song 5
  '5. 천사 찬송하기를(베이스).m4a' = '05_bass.m4a'
  '5. 천사 찬송하기를(소1).m4a' = '05_soprano1.m4a'
  '5. 천사 찬송하기를(소2).m4a' = '05_soprano2.m4a'
  '5. 천사 찬송하기를(알토).m4a' = '05_alto.m4a'
  '5. 천사 찬송하기를(테너).m4a' = '05_tenor.m4a'

  # song 6
  '6. Laudate Dominum 여호와를 찬양할지어다(베이스).m4a' = '06_bass.m4a'
  '6. Laudate Dominum 여호와를 찬양할지어다(소).m4a' = '06_soprano.m4a'
  '6. Laudate Dominum 여호와를 찬양할지어다(알토).m4a' = '06_alto.m4a'
  '6. Laudate Dominum 여호와를 찬양할지어다(테너).m4a' = '06_tenor.m4a'

  # song 7
  '7. Gloria(베이스1).m4a' = '07_bass1.m4a'
  '7. Gloria(베이스2).m4a' = '07_bass2.m4a'
  '7. Gloria(소1).m4a' = '07_soprano1.m4a'
  '7. Gloria(소2).m4a' = '07_soprano2.m4a'
  '7. Gloria(알토1).m4a' = '07_alto1.m4a'
  '7. Gloria(알토2).m4a' = '07_alto2.m4a'
  '7. Gloria(테너1).m4a' = '07_tenor1.m4a'
  '7. Gloria(테너2).m4a' = '07_tenor2.m4a'

  # song 8
  '8. 우리는 주의 영광을 보았네.m4a' = '08_full.m4a'
  '8. 우리는 주의 영광을 보았네(베이스1).m4a' = '08_bass1.m4a'
  '8. 우리는 주의 영광을 보았네(베이스2).m4a' = '08_bass2.m4a'
  '8. 우리는 주의 영광을 보았네(소1).m4a' = '08_soprano1.m4a'
  '8. 우리는 주의 영광을 보았네(소2).m4a' = '08_soprano2.m4a'
  '8. 우리는 주의 영광을 보았네(알토).m4a' = '08_alto.m4a'

  # song 9
  '9. 주의 기도(베이스).m4a' = '09_bass.m4a'
  '9. 주의 기도(소).m4a' = '09_soprano.m4a'
  '9. 주의 기도(알토).m4a' = '09_alto.m4a'
  '9. 주의 기도(테너).m4a' = '09_tenor.m4a'

  # song 10
  '10. I was glad(베이스1) 시편122편.m4a' = '10_bass1.m4a'
  '10. I was glad(베이스2) 시편122편.m4a' = '10_bass2.m4a'
  '10. I was glad(소1) 시편122편.m4a' = '10_soprano1.m4a'
  '10. I was glad(소2) 시편122편.m4a' = '10_soprano2.m4a'
  '10. I was glad(알토1) 시편122편.m4a' = '10_alto1.m4a'
  '10. I was glad(알토2) 시편122편.m4a' = '10_alto2.m4a'
  '10. I was glad(테너1) 시편122편.m4a' = '10_tenor1.m4a'
  '10. I was glad(테너2) 시편122편.m4a' = '10_tenor2.m4a'
}

if(-not (Test-Path $Source)){
  Write-Error "Source 경로를 찾을 수 없습니다: $Source"; exit 1
}

$outDir = Join-Path -Path (Get-Location) -ChildPath 'audio'
if(-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

Write-Host "Source: $Source" -ForegroundColor Cyan
Write-Host "Target audio dir: $outDir" -ForegroundColor Cyan

$results = @()
foreach($orig in $map.Keys){
  $target = $map[$orig]
  # Search for file (exact name) in Source (non-recursive) and subfolders
  $found = Get-ChildItem -Path $Source -Filter $orig -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if(-not $found){
    # try without exact case
    $found = Get-ChildItem -Path $Source -Recurse -File | Where-Object { $_.Name -ieq $orig } | Select-Object -First 1
  }
  if($found){
    $dst = Join-Path $outDir $target
    if($Move){ Move-Item -Path $found.FullName -Destination $dst -Force; $action='moved' }
    else { Copy-Item -Path $found.FullName -Destination $dst -Force; $action='copied' }
    $results += [PSCustomObject]@{ Orig = $found.FullName; Target = $dst; Action = $action }
    Write-Host "$action: $($found.Name) -> $target" -ForegroundColor Green
  } else {
    Write-Host "NOT FOUND: $orig" -ForegroundColor Yellow
    $results += [PSCustomObject]@{ Orig = $orig; Target = $target; Action = 'missing' }
  }
}

if($GitCommit){
  Write-Host "Git add & commit 변경을 진행합니다..." -ForegroundColor Cyan
  & 'C:\Program Files\Git\cmd\git.exe' add audio
  & 'C:\Program Files\Git\cmd\git.exe' commit -m "feat: add audio files" --allow-empty
  & 'C:\Program Files\Git\cmd\git.exe' push
}

Write-Host "완료. 요약:" -ForegroundColor Cyan
$results | Format-Table -AutoSize
