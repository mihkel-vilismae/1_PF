<#
Runs the regular_stage_worker entrypoint for Windows CronEmulator.
It calls only runtime stages B3.1-B3.5 and leaves playback selection to playback_worker.
#>
$ErrorActionPreference = 'Stop'

<#
Resolves the local backend URL from PF_BACKEND_URL or the repo default.
#>
function Get-BackendBaseUrl {
  if ($env:PF_BACKEND_URL) {
    return $env:PF_BACKEND_URL.TrimEnd('/')
  }
  return 'http://127.0.0.1:4301'
}

<#
Posts one JSON request to the backend and returns the decoded response.
#>
function Invoke-WorkerPost {
  param(
    [Parameter(Mandatory = $true)][string]$BaseUrl,
    [Parameter(Mandatory = $true)][string]$Path
  )
  return Invoke-RestMethod -Method Post -Uri "$BaseUrl$Path" -ContentType 'application/json' -Body '{}'
}

<#
Runs the regular stage pipeline endpoints in their existing order.
#>
function Invoke-RegularStageWorker {
  $baseUrl = Get-BackendBaseUrl
  $stages = @(
    '/api/runtime/download/run',
    '/api/runtime/index/run',
    '/api/runtime/gps/run',
    '/api/runtime/geocode/run',
    '/api/runtime/queue/prepare'
  )
  $results = @()
  foreach ($stage in $stages) {
    $results += [PSCustomObject]@{
      endpoint = $stage
      response = Invoke-WorkerPost -BaseUrl $baseUrl -Path $stage
    }
  }
  [PSCustomObject]@{
    worker = 'regular_stage_worker'
    status = 'completed'
    backendBaseUrl = $baseUrl
    stages = $results
    finishedAt = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json -Depth 20
}

Invoke-RegularStageWorker
