<#
Runs the screen_on_off_worker entrypoint for Windows CronEmulator.
Current behavior updates backend-owned screen simulation only; it does not control hardware.
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
Posts the existing screen simulation configuration to the backend.
#>
function Invoke-ScreenOnOffWorker {
  $baseUrl = Get-BackendBaseUrl
  $body = @{
    simulation = @{
      pirEnabled = $true
      mouseEnabled = $true
      keyboardEnabled = $true
      simulateAllEnabled = $true
      inactivityTimeoutSeconds = 5
    }
  } | ConvertTo-Json -Depth 10

  $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/runtime/screen-simulation/configure" -ContentType 'application/json' -Body $body
  [PSCustomObject]@{
    worker = 'screen_on_off_worker'
    status = 'completed'
    backendBaseUrl = $baseUrl
    response = $response
    finishedAt = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json -Depth 20
}

Invoke-ScreenOnOffWorker
