<#
 rename_audio_auto.ps1
 안전한 자동 파일명 정리 (audio/ 폴더 안의 파일들을 패턴 기반으로 표준화된 이름으로 바꿉니다)

 동작
 - audio 폴더의 모든 파일을 스캔
 - 파일명에서 곡 번호(선행 숫자)와 파트 키워드(소프라노, 알토, 테너, 베이스, full 등)를 추출
 - 표준 형식: NN_role[_index].ext (예: 01_soprano.m4a, 02_soprano2.m4a)
 - 이름 충돌 시 숫자 접미사로 안전하게 처리

 사용법
 cd D:\Coding\Choir
 .\rename_audio_auto.ps1

 주의: 파일명이 바뀝니다. 실행 전 결과를 보고 싶으면 스크립트에서 $performChange를 $false로 바꾸세요.
#>

$performChange = $true  # 실제로 이름 변경하려면 True

$dir = Join-Path (Get-Location) 'audio'
if(-not (Test-Path $dir)) { Write-Error "audio 폴더가 없습니다: $dir"; exit 1 }

Write-Host "Scanning: $dir" -ForegroundColor Cyan

$files = Get-ChildItem -Path $dir -File
if($files.Count -eq 0){ Write-Host "audio 폴더에 파일이 없습니다."; exit 0 }

function NormalizeRole([string]$name){
  $n = $name.ToLower()
  if($n -match 'full' -or $n -match 's.a.t.b' -or $n -match '전체' -or $n -match '하늘의 찬송') { return 'full' }
  if($n -match '소프라노' -or $n -match '\b소\b' -or $n -match 'soprano'){
    # detect numbered soprano (소1, 소2)
    if($n -match '소\s*1' -or $n -match '소1' -or $n -match '\(소1\)') { return 'soprano1' }
    if($n -match '소\s*2' -or $n -match '소2' -or $n -match '\(소2\)') { return 'soprano2' }
    return 'soprano'
  }
  if($n -match '알토') { if($n -match '알토1') { return 'alto1' } if($n -match '알토2') { return 'alto2' } return 'alto' }
  if($n -match '테너') { if($n -match '테너1') { return 'tenor1' } if($n -match '테너2') { return 'tenor2' } return 'tenor' }
  if($n -match '베이스') { if($n -match '베이스1') { return 'bass1' } if($n -match '베이스2') { return 'bass2' } return 'bass' }
  if($n -match 'gloria') { return 'gloria' }
  if($n -match 'i was glad') { return 'iwsg' }
  return $null
}

foreach($f in $files){
  $origName = $f.Name
  # extract leading number
  $num = $null
  if($origName -match '^(\d{1,2})') { $num = $matches[1] }
  elseif($origName -match '^(\d)') { $num = $matches[1] }
  if(-not $num){
    # try to find any number in name
    if($origName -match '(\d{1,2})') { $num = $matches[1] }
  }
  if(-not $num){ Write-Host "SKIP (no number): $origName" -ForegroundColor Yellow; continue }

  $role = NormalizeRole($origName)
  if(-not $role){ Write-Host "SKIP (no role match): $origName" -ForegroundColor Yellow; continue }

  $ext = $f.Extension.ToLower()
  if($ext -ne '.m4a' -and $ext -ne '.mp3' -and $ext -ne '.wav'){ $ext = '.m4a' } # default

  $base = "{0}_{1}" -f $num.PadLeft(2,'0'), $role
  $target = "$base$ext"
  $targetPath = Join-Path $dir $target
  $i = 1
  while(Test-Path $targetPath){
    $target = "{0}_{1}_{2}{3}" -f $num.PadLeft(2,'0'), $role, $i, $ext
    $targetPath = Join-Path $dir $target
    $i++
  }

  Write-Host "Rename: $origName -> $target"
  if($performChange){
    try{ Move-Item -Path $f.FullName -Destination $targetPath -Force; }
    catch{ Write-Host "Failed to rename $origName : $($_.Exception.Message)" -ForegroundColor Red }
  }
}

Write-Host "Done. Review audio/ folder." -ForegroundColor Green
