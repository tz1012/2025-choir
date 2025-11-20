<#
  test_cors.ps1
  - index.html에서 data-src를 추출하여 각 URL의 응답 헤더(특히 Access-Control-Allow-Origin)를 검사합니다.
  사용법: PowerShell에서 이 스크립트를 저장한 폴더로 이동 후 `.	est_cors.ps1` 실행
#>

$index = Join-Path -Path (Get-Location) -ChildPath 'index.html'
if(-not (Test-Path $index)){
  Write-Error "index.html을 찾을 수 없습니다. 스크립트를 사이트 루트에서 실행하세요."
  exit 1
}

$html = Get-Content -Raw -Path $index
$matches = [regex]::Matches($html, 'data-src="([^\"]+)"')
$urls = $matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

if($urls.Count -eq 0){ Write-Host "index.html에서 data-src URL을 찾지 못했습니다."; exit 0 }

function Test-Url {
  param([string]$url)
  Write-Host "---" -ForegroundColor DarkCyan
  Write-Host "URL: $url" -ForegroundColor Cyan

  # 먼저 HEAD로 시도
  try{
    $resp = Invoke-WebRequest -Uri $url -Method Head -MaximumRedirection 10 -UseBasicParsing -ErrorAction Stop
    $final = $resp.BaseResponse.ResponseUri.AbsoluteUri
    $status = $resp.StatusCode.Value__
    $headers = $resp.Headers
  } catch {
    # 일부 서버는 HEAD를 지원하지 않음 -> Range로 소량 GET
    try{
      $resp = Invoke-WebRequest -Uri $url -Method Get -Headers @{Range='bytes=0-0'} -MaximumRedirection 10 -UseBasicParsing -ErrorAction Stop
      $final = $resp.BaseResponse.ResponseUri.AbsoluteUri
      $status = $resp.StatusCode.Value__
      $headers = $resp.Headers
    } catch {
      Write-Host "요청 실패: $($_.Exception.Message)" -ForegroundColor Red
      return
    }
  }

  Write-Host "최종 URI: $final"
  Write-Host "상태 코드: $status"
  if($headers -and $headers['Access-Control-Allow-Origin']){
    Write-Host "Access-Control-Allow-Origin: $($headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
  } else {
    Write-Host "Access-Control-Allow-Origin 헤더 없음 (CORS 문제 가능성)" -ForegroundColor Yellow
  }

  # 추가적으로 다른 CORS 관련 헤더 체크
  foreach($h in @('Access-Control-Allow-Methods','Access-Control-Allow-Headers','Access-Control-Allow-Credentials')){
    if($headers -and $headers[$h]){ Write-Host "$h: $($headers[$h])" }
  }
}

Write-Host "총 URL 수: $($urls.Count)" -ForegroundColor Magenta
foreach($u in $urls){ Test-Url -url $u }

Write-Host "--- 검사 완료 ---" -ForegroundColor Magenta
