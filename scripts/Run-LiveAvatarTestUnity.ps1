param([ValidateSet('Setup','Focused','Test','Capture')][string]$Mode='Setup')
$ErrorActionPreference='Stop'
$avatarRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$avatarOut=Join-Path $avatarRoot 'test-results/live-avatar-test'
$avatarArgs=@('-batchmode','-projectPath',('"'+(Join-Path $avatarRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $avatarOut ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$avatarArgs+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.LiveAvatarTestSetup.Setup')}
if($Mode -eq 'Capture'){$avatarArgs+=@('-quit','-executeMethod','TuTienLive.Editor.LiveAvatarTestSetup.Capture')}
if($Mode -eq 'Focused' -or $Mode -eq 'Test'){
 $avatarFilter='TuTienLive.Tests.LiveAvatarTestTests'
 if($Mode -eq 'Test'){
  [xml]$avatarPrevious=Get-Content (Join-Path $avatarRoot 'test-results/camera9/tests.xml') -Raw
  $avatarClasses=@('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.Camera9Tests','TuTienLive.Tests.Concept02StormTests','TuTienLive.Tests.BlessingReceiptTests')
  $avatarNames=@($avatarPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -notin $avatarClasses -and $_.fullname -notmatch 'SavedSceneHasEditableClips'}|ForEach-Object {$_.fullname})
  $avatarFilter=($avatarNames+$avatarClasses+@('TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.LiveAvatarTestTests')) -join ';'
 }
 $avatarXml=if($Mode -eq 'Test'){'tests.xml'}else{'focused-tests.xml'}
 $avatarArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$avatarFilter+'"'),'-testResults',('"'+(Join-Path $avatarOut $avatarXml)+'"'))
}
$avatarProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $avatarArgs -WindowStyle Hidden -PassThru
$avatarProcess.Id | Set-Content (Join-Path $avatarOut 'helper-pid.txt')
$avatarStart=Get-Date
while(-not $avatarProcess.WaitForExit(1000)){if(((Get-Date)-$avatarStart).TotalMinutes -gt 12){$avatarProcess.Kill();throw 'Isolated LIVE avatar helper exceeded 12 minutes.'}}
Write-Output ('LIVE avatar '+$Mode+' exit '+$avatarProcess.ExitCode);exit $avatarProcess.ExitCode
