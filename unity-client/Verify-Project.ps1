param(
    [string]$EditorPath,
    [switch]$Initialize
)
$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$repositoryRoot = Split-Path -Parent $projectPath
$versionFile = Join-Path $projectPath 'ProjectSettings/ProjectVersion.txt'
$versionLine = Get-Content -LiteralPath $versionFile | Where-Object { $_ -match '^m_EditorVersion: ' }
$editorVersion = ($versionLine -replace '^m_EditorVersion: ', '').Trim()
if (-not $EditorPath) {
    $EditorPath = Join-Path $env:ProgramFiles "Unity/Hub/Editor/$editorVersion/Editor/Unity.exe"
}
if (-not (Test-Path -LiteralPath $EditorPath -PathType Leaf)) {
    throw "Khong tim thay Unity $editorVersion. Mo bang Hub hoac truyen -EditorPath."
}
$outputPath = Join-Path $repositoryRoot 'test-results/unity-stage01'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$methodName = if ($Initialize) { 'Initialize' } else { 'Verify' }
$logPath = Join-Path $outputPath "editor-$($methodName.ToLowerInvariant()).log"
$unityArguments = @('-batchmode', '-nographics', '-projectPath', "`"$projectPath`"",
    '-executeMethod', "TuTienLive.Editor.MigrationProjectSetup.$methodName", '-quit', '-logFile', "`"$logPath`"")
Write-Output "Unity ${editorVersion}: $methodName (chi kiem tra Editor, khong Play Mode/build/LIVE)."
$unityJob = Start-Process -FilePath $EditorPath -ArgumentList $unityArguments -WindowStyle Hidden -PassThru
$unityJob.WaitForExit()
$unityJob.Refresh()
if ($unityJob.ExitCode -ne 0) { throw "Unity exit $($unityJob.ExitCode). Xem $logPath" }
if (-not (Select-String -LiteralPath $logPath -Pattern 'TU_TIEN_STAGE01_VERIFIED' -Quiet)) {
    throw "Unity da thoat nhung chua co bang chung Verify. Xem $logPath"
}
Write-Output "PASS Editor configuration. Log: $logPath"
