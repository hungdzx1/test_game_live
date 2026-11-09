param([ValidateSet('Setup','Test','Capture')][string]$Mode='Setup')
$ErrorActionPreference='Stop'
$k01Root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$k01Project=Join-Path $k01Root 'test-results/unity-concept02/project'
$k01Output=Join-Path $k01Root 'test-results/k01'
$k01Args=@('-batchmode','-projectPath',('"'+$k01Project+'"'),'-logFile',('"'+(Join-Path $k01Output ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$k01Args+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.K01GuideSetup.UpgradeValidation')}
if($Mode -eq 'Capture'){$k01Args+=@('-quit','-executeMethod','TuTienLive.Editor.K01GuideSetup.Capture')}
if($Mode -eq 'Test'){
    if(Test-Path (Join-Path $k01Output 'tests.xml')){Move-Item -LiteralPath (Join-Path $k01Output 'tests.xml') -Destination (Join-Path $k01Output 'tests-previous.xml') -Force}
    [xml]$k01Previous=Get-Content (Join-Path $k01Root 'test-results/qua78/unity-final.xml') -Raw
    $k01Names=@($k01Previous.SelectNodes('//test-case') | Where-Object {$_.classname -in @('TuTienLive.Tests.ItemReceiptTests','TuTienLive.Tests.Qua78Tests') -and $_.name -notmatch 'ActualHttp|RealHttp'} | ForEach-Object {$_.fullname})
    $k01Filter=(@('TuTienLive.Tests.K01GuideTests','TuTienLive.Tests.Concept02Tests','TuTienLive.Tests.CharacterVariantTests','TuTienLive.Tests.NetworkProtocolTests')+$k01Names)-join ';'
    $k01Args+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$k01Filter+'"'),'-testResults',('"'+(Join-Path $k01Output 'tests.xml')+'"'))
}
$k01Process=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $k01Args -WindowStyle Hidden -PassThru
$k01Process.Id | Set-Content (Join-Path $k01Output 'helper-pid.txt')
$k01Start=Get-Date
while(-not $k01Process.WaitForExit(1000)){
    if(((Get-Date)-$k01Start).TotalMinutes -gt 12){$k01Process.Kill();throw 'K01 isolated Unity helper exceeded 12 minutes.'}
}
Write-Output ('K01 '+$Mode+' exit '+$k01Process.ExitCode)
exit $k01Process.ExitCode
