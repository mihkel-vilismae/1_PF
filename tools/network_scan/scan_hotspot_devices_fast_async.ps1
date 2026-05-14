clear

$OutputDir = "I:\_____11111\1234_PF\tools\network_scan"
$LatestTxt = Join-Path $OutputDir "found_devices_latest.txt"
$LatestCsv = Join-Path $OutputDir "found_devices_latest.csv"
$HistoryCsv = Join-Path $OutputDir "found_devices_history.csv"

Write-Host "Fast async network hotspot device scanner"
Write-Host "========================================="
Write-Host ""

function Get-ArpMacForIp {
    param([string]$Ip)

    $line = arp -a | Select-String "^\s*$([regex]::Escape($Ip))\s+"
    if ($line) {
        $parts = ($line.ToString().Trim() -split "\s+")
        if ($parts.Count -ge 2) {
            return $parts[1]
        }
    }

    return "unknown"
}

function Get-HostGuessForIp {
    param([string]$Ip)

    try {
        $name = [System.Net.Dns]::GetHostEntry($Ip).HostName
        if ($name) {
            return $name
        }
    } catch {
    }

    return "unknown"
}

function Test-PortQuick {
    param(
        [string]$Ip,
        [int]$Port
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($Ip, $Port, $null, $null)
        $success = $async.AsyncWaitHandle.WaitOne(120, $false)

        if ($success -and $client.Connected) {
            $client.EndConnect($async)
            $client.Close()
            return $true
        }

        $client.Close()
    } catch {
    }

    return $false
}

function Invoke-AsyncPingBatch {
    param(
        [string[]]$Ips,
        [int]$TimeoutMs
    )

    $tasks = @()

    foreach ($ip in $Ips) {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $task = $ping.SendPingAsync($ip, $TimeoutMs)

        $tasks += [PSCustomObject]@{
            Ip = $ip
            Ping = $ping
            Task = $task
        }
    }

    $total = $tasks.Count
    $done = 0

    while ($true) {
        $done = @($tasks | Where-Object { $_.Task.IsCompleted }).Count
        $percent = if ($total -gt 0) { [int](($done / $total) * 100) } else { 100 }

        Write-Progress `
            -Activity "Async ping scan" `
            -Status "$done of $total completed" `
            -PercentComplete $percent

        if ($done -ge $total) {
            break
        }

        Start-Sleep -Milliseconds 80
    }

    Write-Progress -Activity "Async ping scan" -Completed

    $found = @()

    foreach ($item in $tasks) {
        try {
            $reply = $item.Task.Result
            if ($reply.Status -eq [System.Net.NetworkInformation.IPStatus]::Success) {
                $found += $item.Ip
            }
        } catch {
        } finally {
            $item.Ping.Dispose()
        }
    }

    return $found
}

function Get-DeviceInfo {
    param(
        [string]$Ip,
        [string]$Source,
        [string]$LocalIp
    )

    $isSelf = $Ip -eq $LocalIp
    $mac = Get-ArpMacForIp -Ip $Ip
    $hostGuess = Get-HostGuessForIp -Ip $Ip

    $commonPorts = @(22, 80, 443, 445, 5000, 8000, 8080, 8787)
    $openPorts = @()

    if (-not $isSelf) {
        foreach ($port in $commonPorts) {
            if (Test-PortQuick -Ip $Ip -Port $port) {
                $openPorts += $port
            }
        }
    }

    return [PSCustomObject]@{
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        IP        = $Ip
        MAC       = $mac
        Host      = $hostGuess
        Source    = $Source
        OpenPorts = ($openPorts -join ";")
        IsThisPC  = $isSelf
    }
}

function Show-DeviceInfo {
    param([object]$Device)

    if ($Device.IsThisPC) {
        Write-Host "FOUND SELF: $($Device.IP) - this is this PC, skipped from quick-use device list"
        return
    }

    Write-Host ""
    Write-Host "DEVICE FOUND"
    Write-Host "------------"
    Write-Host "IP:         $($Device.IP)"
    Write-Host "MAC:        $($Device.MAC)"
    Write-Host "Host guess: $($Device.Host)"
    Write-Host "Source:     $($Device.Source)"

    if ($Device.OpenPorts) {
        Write-Host "Open ports: $($Device.OpenPorts.Replace(';', ', '))"
    } else {
        Write-Host "Open ports: none found from quick common-port scan"
    }

    Write-Host "------------"
    Write-Host ""
}

Write-Host "[1/7] Detecting active network adapters..."
Write-Host ""

$adapters = Get-NetIPConfiguration |
    Where-Object {
        $_.IPv4Address -and
        $_.NetAdapter.Status -eq "Up" -and
        $_.IPv4Address.IPAddress -notlike "127.*" -and
        $_.IPv4Address.IPAddress -notlike "169.254.*" -and
        $_.IPv4Address.IPAddress -notlike "192.168.56.*"
    }

if (-not $adapters) {
    Write-Host "No usable network adapter found."
    pause
    exit
}

$adapter = $adapters | Select-Object -First 1
$localIp = $adapter.IPv4Address.IPAddress
$parts = $localIp.Split(".")
$subnet = "$($parts[0]).$($parts[1]).$($parts[2])"

Write-Host "Adapter: $($adapter.InterfaceAlias)"
Write-Host "PC IP:   $localIp"
Write-Host "Subnet:  $subnet.0/24"
Write-Host ""

$knownLastOctets = @(
    1, 2, 3, 4, 5,
    10, 20, 50,
    90, 91, 92,
    100, 101, 102, 110, 120, 150,
    180, 184, 200, 254
)

$knownIps = $knownLastOctets | ForEach-Object { "$subnet.$_" }
$fullRangeIps = 1..254 | ForEach-Object { "$subnet.$_" }
$remainingIps = $fullRangeIps | Where-Object { $knownIps -notcontains $_ }

$foundIps = @()
$devices = @()

Write-Host "[2/7] Fast async scan of common/known IPs first..."
$knownFound = Invoke-AsyncPingBatch -Ips $knownIps -TimeoutMs 250

foreach ($ip in $knownFound) {
    Write-Host "FOUND: $ip"
    if ($foundIps -notcontains $ip) {
        $foundIps += $ip
        $device = Get-DeviceInfo -Ip $ip -Source "Async common IP scan" -LocalIp $localIp
        $devices += $device
        Show-DeviceInfo -Device $device
    }
}

Write-Host ""
Write-Host "[3/7] Fast async scan of full subnet..."
$fullFound = Invoke-AsyncPingBatch -Ips $remainingIps -TimeoutMs 250

foreach ($ip in $fullFound) {
    Write-Host "FOUND: $ip"
    if ($foundIps -notcontains $ip) {
        $foundIps += $ip
        $device = Get-DeviceInfo -Ip $ip -Source "Async full subnet scan" -LocalIp $localIp
        $devices += $device
        Show-DeviceInfo -Device $device
    }
}

Write-Host ""
Write-Host "[4/7] Reading ARP table..."
Write-Host ""

$arpIps = @()
$arpLines = arp -a | Select-String "$subnet\."

if ($arpLines) {
    foreach ($line in $arpLines) {
        $text = $line.ToString().Trim()
        Write-Host $text

        $maybeIp = ($text -split "\s+")[0]
        if ($maybeIp -match "^$([regex]::Escape($subnet))\.\d+$") {
            if ($arpIps -notcontains $maybeIp) {
                $arpIps += $maybeIp
            }
        }
    }
} else {
    Write-Host "No ARP entries found for $subnet.x"
}

Write-Host ""
Write-Host "[5/7] Adding ARP-only possible devices..."
foreach ($ip in $arpIps) {
    if (($foundIps -notcontains $ip) -and ($ip -ne $localIp) -and ($ip -notlike "*.255")) {
        $foundIps += $ip
        $device = Get-DeviceInfo -Ip $ip -Source "ARP table only" -LocalIp $localIp
        $devices += $device
        Show-DeviceInfo -Device $device
    }
}

Write-Host ""
Write-Host "[6/7] Saving found IPs..."
Write-Host ""

$quickDevices = @(
    $devices |
        Where-Object { -not $_.IsThisPC -and $_.IP -notlike "*.255" } |
        Sort-Object { [int](($_.IP -split '\.')[3]) }
)

$latestTextLines = @()
$latestTextLines += "Network scan saved at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$latestTextLines += "PC IP: $localIp"
$latestTextLines += "Subnet: $subnet.0/24"
$latestTextLines += ""
$latestTextLines += "Quick-use device IPs:"

if ($quickDevices.Count -eq 0) {
    $latestTextLines += "NONE"
} else {
    foreach ($device in $quickDevices) {
        $ports = if ($device.OpenPorts) { $device.OpenPorts } else { "none" }
        $latestTextLines += "$($device.IP) | MAC=$($device.MAC) | HOST=$($device.Host) | PORTS=$ports | SOURCE=$($device.Source)"
    }
}

$latestTextLines | Set-Content -Path $LatestTxt -Encoding UTF8
$quickDevices | Export-Csv -Path $LatestCsv -NoTypeInformation -Encoding UTF8

if ($quickDevices.Count -gt 0) {
    if (-not (Test-Path $HistoryCsv)) {
        $quickDevices | Export-Csv -Path $HistoryCsv -NoTypeInformation -Encoding UTF8
    } else {
        $quickDevices | Export-Csv -Path $HistoryCsv -NoTypeInformation -Encoding UTF8 -Append
    }
}

Write-Host "Saved:"
Write-Host " - $LatestTxt"
Write-Host " - $LatestCsv"
Write-Host " - $HistoryCsv"

Write-Host ""
Write-Host "[7/7] Summary"
Write-Host "=============="
Write-Host ""

Write-Host "This PC:"
Write-Host " - $localIp"

Write-Host ""
Write-Host "Quick-use device IPs saved:"
if ($quickDevices.Count -eq 0) {
    Write-Host " - None"
} else {
    $quickDevices | ForEach-Object {
        Write-Host " - $($_.IP) | MAC: $($_.MAC) | Host: $($_.Host)"
    }
}

Write-Host ""
Write-Host "Best guess:"
if ($quickDevices.Count -eq 1) {
    Write-Host " - Your other device is probably $($quickDevices[0].IP)"
} elseif ($quickDevices.Count -gt 1) {
    Write-Host " - Multiple devices found. Check:"
    Write-Host "   $LatestTxt"
} else {
    Write-Host " - No other devices found."
}

Write-Host ""
pause
