param(
    [ValidateSet('Setup','Verify','EditMode','Build')][string]$Mode = 'EditMode',
    [string]$EditorPath
)
$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$repositoryRoot = Split-Path -Parent $projectPath
$editorVersion = ((Get-Content -LiteralPath (Join-Path $projectPath 'ProjectSettings/ProjectVersion.txt') | Where-Object { $_ -match '^m_EditorVersion: ' }) -replace '^m_EditorVersion: ', '').Trim()
if (-not $EditorPath) { $EditorPath = Join-Path $env:ProgramFiles "Unity/Hub/Editor/$editorVersion/Editor/Unity.exe" }
if (-not (Test-Path -LiteralPath $EditorPath)) { throw "Unity ${editorVersion} not found; specify -EditorPath." }
$outputPath = Join-Path $repositoryRoot 'test-results/unity-stage02'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$logPath = Join-Path $outputPath "runner-$Mode.log"
$xmlPath = Join-Path $outputPath 'runner-editmode.xml'
$unityArguments = @('-batchmode','-nographics','-projectPath',"`"$projectPath`"",'-logFile',"`"$logPath`"")
if ($Mode -eq 'EditMode') {
    $unityArguments += @('-runTests','-testPlatform','EditMode','-testResults',"`"$xmlPath`"")
} else {
    $methods = @{ Setup = 'Create'; Verify = 'Verify'; Build = 'BuildWindows' }
    $unityArguments += @('-executeMethod',"TuTienLive.Editor.NetworkTestSetup.$($methods[$Mode])",'-quit')
}
$startTime = [DateTime]::UtcNow
$job = Start-Process -FilePath $EditorPath -ArgumentList $unityArguments -WindowStyle Hidden -PassThru
$job.WaitForExit()
$job.Refresh()
if ($job.ExitCode -ne 0) { throw "Unity exit $($job.ExitCode): $logPath" }
if ($Mode -eq 'EditMode') {
    if (-not (Test-Path -LiteralPath $xmlPath) -or (Get-Item -LiteralPath $xmlPath).LastWriteTimeUtc -lt $startTime) { throw 'Fresh test result missing.' }
    [xml]$result = Get-Content -LiteralPath $xmlPath
    if ($result.'test-run'.result -ne 'Passed' -or [int]$result.'test-run'.total -eq 0) { throw "Unity tests failed: $xmlPath" }
    Write-Output "PASS $($result.'test-run'.passed) Unity tests: $xmlPath"
} else {
    $marker = if ($Mode -eq 'Build') { 'TU_TIEN_STAGE02_WINDOWS_BUILD_PASS' } else { 'TU_TIEN_STAGE02_EDITOR_VERIFIED' }
    if (-not (Select-String -LiteralPath $logPath -Pattern $marker -Quiet)) { throw "Verification marker missing: $logPath" }
    Write-Output "PASS ${Mode}: $logPath"
}
