param([ValidateSet('Setup','Test','Focused','Protocol','Capture')][string]$Mode='Setup',
 [ValidatePattern('^[a-z0-9-]+$')][string]$OutputName='storm-camera-timing',
 [string]$FocusedFilter='TuTienLive.Tests.Concept02StormTests;TuTienLive.Tests.Camera9Tests')
$ErrorActionPreference='Stop'
$timingRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$timingOut=Join-Path $timingRoot ('test-results/'+$OutputName)
$timingArgs=@('-batchmode','-projectPath',('"'+(Join-Path $timingRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $timingOut ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$timingArgs+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.StormCameraTimingSetup.Setup')}
if($Mode -eq 'Capture'){$timingArgs+=@('-executeMethod','TuTienLive.Editor.StormCameraTimingSetup.Capture')}
if($Mode -eq 'Protocol'){$timingArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter','TuTienLive.Tests.NetworkProtocolTests','-testResults',('"'+(Join-Path $timingOut 'protocol-tests.xml')+'"'))}
if($Mode -eq 'Test' -or $Mode -eq 'Focused'){
 [xml]$timingPrevious=Get-Content (Join-Path $timingRoot 'test-results/camera9/tests.xml') -Raw
 $timingNames=@($timingPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -notin @('TuTienLive.Tests.Concept02StormTests','TuTienLive.Tests.Camera9Tests','TuTienLive.Tests.NetworkProtocolTests') -and $_.fullname -notmatch 'SavedSceneHasEditableClips'}|ForEach-Object {$_.fullname})
 $timingNames+=@('TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.NetworkProtocolTests')
 if($Mode -eq 'Focused'){$timingNames=@()}
 $timingFilter=($timingNames+@('TuTienLive.Tests.Concept02StormTests','TuTienLive.Tests.Camera9Tests')) -join ';'
 if($Mode -eq 'Focused'){$timingFilter=$FocusedFilter}
 $timingXml=if($Mode -eq 'Test'){'tests.xml'}else{'focused-tests.xml'}
 $timingArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$timingFilter+'"'),'-testResults',('"'+(Join-Path $timingOut $timingXml)+'"'))
}
$timingProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $timingArgs -WindowStyle Hidden -PassThru
$timingProcess.Id | Set-Content (Join-Path $timingOut 'helper-pid.txt')
$timingStart=Get-Date
while(-not $timingProcess.WaitForExit(1000)){if(((Get-Date)-$timingStart).TotalMinutes -gt 12){$timingProcess.Kill();throw 'Isolated timing helper exceeded 12 minutes.'}}
Write-Output ('Storm/camera timing '+$Mode+' exit '+$timingProcess.ExitCode);exit $timingProcess.ExitCode
