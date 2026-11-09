param([ValidateSet('Focused','Test','BlessingHttp')][string]$Mode='Focused')
$ErrorActionPreference='Stop'
$avatarRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$avatarOut=Join-Path $avatarRoot 'test-results/avatar-format-fix'
$avatarServer=Get-Content (Join-Path $avatarOut 'server.json') -Raw | ConvertFrom-Json
$avatarUri=[uri]$avatarServer.base
if(-not $avatarUri.IsLoopback -or $avatarUri.Scheme -ne 'http'){throw 'Only disposable local avatar server is allowed.'}
$env:TUTIEN_AVATAR_TEST_URL=$avatarServer.base
$env:TUTIEN_RECEIPT_TEST_URL=$avatarServer.base
$avatarFilter='TuTienLive.Tests.LiveAvatarTestTests'
if($Mode -eq 'BlessingHttp'){$avatarFilter='TuTienLive.Tests.BlessingReceiptTests.ActualHttpBlessingActivationUsesServerEventAndAudio'}
if($Mode -eq 'Test'){
 [xml]$avatarPrevious=Get-Content (Join-Path $avatarRoot 'test-results/camera9/tests.xml') -Raw
 $avatarClasses=@('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.Camera9Tests','TuTienLive.Tests.Concept02StormTests','TuTienLive.Tests.BlessingReceiptTests')
 $avatarNames=@($avatarPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -notin $avatarClasses -and $_.fullname -notmatch 'SavedSceneHasEditableClips'}|ForEach-Object {$_.fullname})
 $avatarFilter=($avatarNames+$avatarClasses+@('TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.LiveAvatarTestTests')) -join ';'
}
$avatarArgs=@('-batchmode','-nographics','-projectPath',('"'+(Join-Path $avatarRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $avatarOut ($Mode.ToLower()+'.log'))+'"'),'-runTests','-testPlatform','EditMode','-testFilter',('"'+$avatarFilter+'"'),'-testResults',('"'+(Join-Path $avatarOut ($Mode.ToLower()+'-tests.xml'))+'"'))
$avatarProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $avatarArgs -WindowStyle Hidden -PassThru
$avatarProcess.Id | Set-Content (Join-Path $avatarOut 'helper-pid.txt')
$avatarStart=Get-Date
while(-not $avatarProcess.WaitForExit(1000)){if(((Get-Date)-$avatarStart).TotalMinutes -gt 12){$avatarProcess.Kill();throw 'Isolated avatar format helper exceeded 12 minutes.'}}
Write-Output ('Avatar format '+$Mode+' exit '+$avatarProcess.ExitCode);exit $avatarProcess.ExitCode
