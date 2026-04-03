$ErrorActionPreference = "Stop"

function Add-Result {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Details
  )

  [PSCustomObject]@{
    test = $Name
    passed = $Passed
    details = $Details
  }
}

$results = @()
$startedByScript = $false
$serverProcess = $null

function Wait-ForServer {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 25
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Method Get -Uri $Url | Out-Null
      return $true
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  return $false
}

function Is-ServerRunning {
  try {
    Invoke-RestMethod -Method Get -Uri "http://localhost:5000/" | Out-Null
    return $true
  } catch {
    return $false
  }
}

try {
  if (-not (Is-ServerRunning)) {
    $serverProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start" -PassThru
    $startedByScript = $true

    if (-not (Wait-ForServer -Url "http://localhost:5000/")) {
      throw "Server did not start on http://localhost:5000 within timeout"
    }
  }

  $adminHeaders = @{ "x-user-role" = "admin" }
  $analystHeaders = @{ "x-user-role" = "analyst" }
  $viewerHeaders = @{ "x-user-role" = "viewer" }

  $suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $email = "smoke.$suffix@example.com"

  $createdUser = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/users" -Headers $adminHeaders -ContentType "application/json" -Body (@{
      name = "Smoke User"
      email = $email
      role = "viewer"
    } | ConvertTo-Json)
  $results += Add-Result -Name "admin can create user" -Passed $true -Details "userId=$($createdUser._id)"

  try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/users" -ContentType "application/json" -Body (@{
        name = "Blocked User"
        email = "blocked.$suffix@example.com"
        role = "viewer"
      } | ConvertTo-Json) | Out-Null
    $results += Add-Result -Name "viewer cannot create user" -Passed $false -Details "Expected 403"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $results += Add-Result -Name "viewer cannot create user" -Passed ($status -eq 403) -Details "status=$status"
  }

  $record = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/records" -Headers $adminHeaders -ContentType "application/json" -Body (@{
      amount = 1500
      type = "income"
      category = "Salary"
      date = "2026-04-03"
      note = "Smoke salary"
      userId = $createdUser._id
    } | ConvertTo-Json)
  $results += Add-Result -Name "admin can create record" -Passed $true -Details "recordId=$($record._id)"

  $recordsByUser = Invoke-RestMethod -Method Get -Uri ("http://localhost:5000/api/records?userId=" + $createdUser._id) -Headers $viewerHeaders
  $count = if ($recordsByUser.data) { $recordsByUser.data.Count } else { 0 }
  $results += Add-Result -Name "records userId filter works" -Passed ($count -ge 1) -Details "count=$count"

  $dash = Invoke-RestMethod -Method Get -Uri ("http://localhost:5000/api/dashboard/summary?userId=" + $createdUser._id) -Headers $analystHeaders
  $results += Add-Result -Name "analyst can access dashboard" -Passed $true -Details "net=$($dash.netBalance)"

  try {
    Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/dashboard/summary" -Headers $viewerHeaders | Out-Null
    $results += Add-Result -Name "viewer blocked from dashboard" -Passed $false -Details "Expected 403"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $results += Add-Result -Name "viewer blocked from dashboard" -Passed ($status -eq 403) -Details "status=$status"
  }
} catch {
  $results += Add-Result -Name "smoke script fatal" -Passed $false -Details $_.Exception.Message
} finally {
  if ($startedByScript -and $serverProcess) {
    try {
      Stop-Process -Id $serverProcess.Id -Force
    } catch {
      # Ignore cleanup errors to avoid masking test output.
    }
  }
}

$results | ConvertTo-Json -Depth 4
