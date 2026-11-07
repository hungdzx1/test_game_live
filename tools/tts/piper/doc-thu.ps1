param([string]$TextFile = '', [ValidateSet('male','female')][string]$Voice, [switch]$Play)
$ErrorActionPreference = 'Stop'
$pythonRuntime = Join-Path $PSScriptRoot 'runtime/python.exe'
if (-not (Test-Path -LiteralPath $pythonRuntime)) { throw 'Run scripts/setup-offline-tts.ps1 first.' }
$arguments = @('-I', '-X', 'utf8', (Join-Path $PSScriptRoot 'synthesize.py'), '--verify-offline')
if ($TextFile) { $arguments += @('--input', $TextFile) }
if ($Voice) { $arguments += @('--voice', $Voice) }
& $pythonRuntime @arguments
if ($LASTEXITCODE -ne 0) { throw 'Speech generation failed.' }
$wavFile = Join-Path $PSScriptRoot 'output/thien-dao-doc-thu.wav'
Write-Output "WAV: $wavFile"
if ($Play) {
    $soundPlayer = New-Object System.Media.SoundPlayer $wavFile
    try { $soundPlayer.PlaySync() } finally { $soundPlayer.Dispose() }
}
