$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$installRoot = Join-Path $projectRoot 'tools/tts/piper'
$runtimeRoot = Join-Path $installRoot 'runtime'
$downloadRoot = Join-Path $installRoot 'downloads'
$modelRoot = Join-Path $installRoot 'models'
$packageRoot = Join-Path $runtimeRoot 'Lib/site-packages'
foreach ($dir in @($runtimeRoot, $downloadRoot, $modelRoot, $packageRoot, (Join-Path $installRoot 'output'))) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
$pythonVersion = '3.13.17'
$piperVersion = '1.8.0'
$pythonZip = Join-Path $downloadRoot "python-$pythonVersion-embed-amd64.zip"
$pythonUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-embed-amd64.zip"
$pythonRuntime = Join-Path $runtimeRoot 'python.exe'
if (-not (Test-Path -LiteralPath $pythonRuntime)) {
    Write-Output "Downloading portable Python $pythonVersion into $runtimeRoot"
    Invoke-WebRequest -UseBasicParsing -Uri $pythonUrl -OutFile "$pythonZip.download"
    Move-Item -LiteralPath "$pythonZip.download" -Destination $pythonZip -Force
    Expand-Archive -LiteralPath $pythonZip -DestinationPath $runtimeRoot -Force
}
$runtimeVersion = & $pythonRuntime -I -c 'import platform; print(platform.python_version())'
if ($LASTEXITCODE -ne 0 -or $runtimeVersion -ne $pythonVersion) { throw "Unexpected portable Python version: $runtimeVersion" }
# The embedded interpreter deliberately isolates imports from system Python/PYTHONPATH.
@('python313.zip', '.', 'Lib/site-packages', 'import site') | Set-Content -Encoding ASCII -LiteralPath (Join-Path $runtimeRoot 'python313._pth')
$installedPiper = ''
if (Test-Path -LiteralPath (Join-Path $packageRoot 'piper')) {
    $installedPiper = & $pythonRuntime -I -c "import importlib.metadata; print(importlib.metadata.version('piper-tts'))"
}
# Use the existing pip only as a cross-version installer. No global packages or PATH changes.
if ($installedPiper -ne $piperVersion) {
    Write-Output "Installing Piper $piperVersion and binary dependencies into $packageRoot"
    & python -m pip --isolated install --disable-pip-version-check --no-warn-script-location --only-binary=:all: --python-version 3.13 --platform win_amd64 --implementation cp --abi cp313 --target $packageRoot "piper-tts==$piperVersion"
    if ($LASTEXITCODE -ne 0) { throw 'Piper package installation failed.' }
}
$voiceSpecs = @(
    @{name='vi_VN-vais1000-medium'; directory=$modelRoot; url='https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium'},
    @{name='vi_VN-tramvang-medium'; directory=(Join-Path $modelRoot 'vi_VN-tramvang-medium'); url='https://huggingface.co/vnhellboy/vietnamese-piper-voices/resolve/df2a53e0b5c8039d17e642cc8d80fa03d59374b7/vits-piper-vi_VN-tramvang-medium'; cardFile='MODEL_CARD.md'; cardUrl='https://huggingface.co/vnhellboy/vietnamese-piper-voices/resolve/df2a53e0b5c8039d17e642cc8d80fa03d59374b7/README.md'}
)
foreach ($spec in $voiceSpecs) {
    New-Item -ItemType Directory -Force -Path $spec.directory | Out-Null
    $cardFile = 'MODEL_CARD'
    $cardUrl = $spec.url + '/MODEL_CARD'
    if ($spec.cardFile) { $cardFile = $spec.cardFile; $cardUrl = $spec.cardUrl }
    $downloadSpecs = @(
        @{file=($spec.name + '.onnx'); url=($spec.url + '/' + $spec.name + '.onnx')},
        @{file=($spec.name + '.onnx.json'); url=($spec.url + '/' + $spec.name + '.onnx.json')},
        @{file=$cardFile; url=$cardUrl}
    )
    foreach ($download in $downloadSpecs) {
        $target = Join-Path $spec.directory $download.file
        if (-not (Test-Path -LiteralPath $target)) {
            Write-Output ('Downloading ' + $download.file)
            Invoke-WebRequest -UseBasicParsing -Uri $download.url -OutFile "$target.download"
            Move-Item -LiteralPath "$target.download" -Destination $target -Force
        }
    }
}
& $pythonRuntime -I -c "import importlib.metadata; import piper, onnxruntime; print('Piper', importlib.metadata.version('piper-tts')); print('ONNX Runtime', onnxruntime.__version__)"
if ($LASTEXITCODE -ne 0) { throw 'Portable speech runtime import failed.' }
$packages = & $pythonRuntime -I -c "import importlib.metadata,json; print(json.dumps({d.metadata['Name']:d.version for d in importlib.metadata.distributions()},sort_keys=True))"
$manifest = [ordered]@{
    installedAt = [DateTimeOffset]::UtcNow.ToString('o')
    installRoot = $installRoot
    python = $pythonVersion
    piper = $piperVersion
    voices = @($voiceSpecs | ForEach-Object { $_.name })
    voiceSettings = 'voice-settings.json'
    sources = @($pythonUrl, 'https://pypi.org/project/piper-tts/1.8.0/') + @($voiceSpecs | ForEach-Object { $_.url })
    packages = ($packages | ConvertFrom-Json)
    files = @(Get-ChildItem -LiteralPath $modelRoot -Recurse -File | ForEach-Object { @{name=$_.FullName.Substring($modelRoot.Length + 1); bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash} })
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $installRoot 'installation.json')
Write-Output "Installed offline TTS at $installRoot"

