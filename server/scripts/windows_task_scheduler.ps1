param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('install', 'status', 'print')]
  [string]$Operation,

  [Parameter(Mandatory = $true)]
  [string]$TaskName,

  [Parameter(Mandatory = $true)]
  [string]$NodePath,

  [Parameter(Mandatory = $false)]
  [string]$NodeArguments = '',

  [Parameter(Mandatory = $true)]
  [string]$ScriptPath,

  [Parameter(Mandatory = $true)]
  [string]$RepoRoot,

  [Parameter(Mandatory = $false)]
  [string]$LogDir = ''
)

$ErrorActionPreference = 'Stop'

function Convert-TaskDate([object]$Value) {
  if (-not $Value) {
    return $null
  }

  try {
    $date = [datetime]$Value
  } catch {
    return $null
  }

  if ($date.Year -lt 2001) {
    return $null
  }

  return $date.ToString('o')
}

function Build-ExpectedTask() {
  $quotedScript = '"' + $ScriptPath + '"'
  $quotedRepoRoot = '"' + $RepoRoot + '"'
  $arguments = "$quotedScript --repo-root $quotedRepoRoot"
  if ($NodeArguments) {
    $arguments = "$NodeArguments $arguments"
  }
  if ($LogDir) {
    $quotedLogDir = '"' + $LogDir + '"'
    $arguments = "$arguments --log-dir $quotedLogDir"
  }

  return [pscustomobject]@{
    taskName = $TaskName
    platformTarget = 'windows-task-scheduler'
    triggerMode = 'at-logon bootstrap'
    timingModel = [pscustomobject]@{
      bootstrapTrigger = 'at-logon'
      cadenceOwner = 'repo-local scheduler host'
      pipelineTickSeconds = 5
      playbackWatchdogTickSeconds = 5
      screenWatchdogTickSeconds = 5
      recoveryReconciliationTickSeconds = 15
    }
    action = [pscustomobject]@{
      execute = $NodePath
      arguments = $arguments
      workingDirectory = $RepoRoot
    }
    notes = @(
      'Task Scheduler is only used to bootstrap the scheduler host.'
      'The host process owns the 5-second timing loop because Task Scheduler repetition intervals are documented with a 1-minute minimum.'
    )
  }
}

function Get-TaskPayload([bool]$IncludeXml) {
  $expected = Build-ExpectedTask
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $task) {
    return [pscustomobject]@{
      installed = $false
      expected = $expected
    }
  }

  $info = Get-ScheduledTaskInfo -TaskName $TaskName
  $action = $task.Actions | Select-Object -First 1
  $trigger = $task.Triggers | Select-Object -First 1

  $payload = [pscustomobject]@{
    installed = $true
    taskName = $task.TaskName
    taskPath = $task.TaskPath
    state = [string]$task.State
    enabled = [bool]$task.Settings.Enabled
    lastRunTime = Convert-TaskDate $info.LastRunTime
    nextRunTime = Convert-TaskDate $info.NextRunTime
    lastTaskResult = $info.LastTaskResult
    trigger = [pscustomobject]@{
      kind = if ($trigger) { $trigger.CimClass.CimClassName } else { $null }
      userId = if ($trigger) { $trigger.UserId } else { $null }
      delay = if ($trigger) { $trigger.Delay } else { $null }
      startBoundary = if ($trigger) { $trigger.StartBoundary } else { $null }
    }
    action = [pscustomobject]@{
      execute = if ($action) { $action.Execute } else { $null }
      arguments = if ($action) { $action.Arguments } else { $null }
      workingDirectory = if ($action) { $action.WorkingDirectory } else { $null }
    }
    expected = $expected
  }

  if ($IncludeXml) {
    $payload | Add-Member -NotePropertyName exportedXml -NotePropertyValue (Export-ScheduledTask -TaskName $TaskName)
  }

  return $payload
}

try {
  Import-Module ScheduledTasks -ErrorAction Stop | Out-Null

  if ($Operation -eq 'install') {
    $expected = Build-ExpectedTask
    $action = New-ScheduledTaskAction -Execute $NodePath -Argument $expected.action.arguments -WorkingDirectory $RepoRoot
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Seconds 0)
    $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Photo frame scheduler bootstrap task for the repo-local 5-second scheduler host.'
    Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
    Get-TaskPayload $false | ConvertTo-Json -Depth 8
    exit 0
  }

  if ($Operation -eq 'status') {
    Get-TaskPayload $false | ConvertTo-Json -Depth 8
    exit 0
  }

  if ($Operation -eq 'print') {
    Get-TaskPayload $true | ConvertTo-Json -Depth 12
    exit 0
  }

  throw "Unsupported operation: $Operation"
} catch {
  [pscustomobject]@{
    error = 'windows_task_scheduler_failure'
    message = $_.Exception.Message
    operation = $Operation
    taskName = $TaskName
  } | ConvertTo-Json -Depth 6
  exit 1
}
