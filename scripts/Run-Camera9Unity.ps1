param([ValidateSet('Setup','Test','WarningTest','Capture')][string]$Mode='Setup')
$ErrorActionPreference='Stop'
$bwRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bwOut=Join-Path $bwRoot 'test-results/camera9'
$bwArgs=@('-batchmode','-projectPath',('"'+(Join-Path $bwRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $bwOut ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$bwArgs+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.Camera9Setup.Setup')}
if($Mode -eq 'Capture'){$bwArgs+=@('-executeMethod','TuTienLive.Editor.Camera9Setup.Capture')}
if($Mode -eq 'WarningTest'){$bwArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter','TuTienLive.Tests.Camera9Tests','-testResults',('"'+(Join-Path $bwOut 'warning-tests.xml')+'"'))}
if($Mode -eq 'Test'){
 if(Test-Path (Join-Path $bwOut 'tests.xml')){Move-Item -LiteralPath (Join-Path $bwOut 'tests.xml') -Destination (Join-Path $bwOut 'tests-previous.xml') -Force}
 [xml]$bwPrevious=Get-Content (Join-Path $bwRoot 'test-results/boss-warning/tests.xml') -Raw
 $bwNames=@($bwPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -notin @('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.Qua78Tests') -and $_.fullname -notmatch 'SavedSceneHasEditableClips'}|ForEach-Object {$_.fullname})
 $bwExtra=@('TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.Camera9Tests','TuTienLive.Tests.Qua78Tests.WholeSectDisplaysAllVisibleMembersAtOnceWithoutCameraOrRosterFocusAndDeduplicates','TuTienLive.Tests.Qua78Tests.IdleWaitsFifteenSecondsPansZoomsThenReturnsExactlyToAuthoredCamera','TuTienLive.Tests.Qua78Tests.PersonalReceiptInterruptsIdleDirectlyThenZoomsWithNameRealmCardsAndRestoresScale','TuTienLive.Tests.Qua78Tests.WholeSectFreezesAmbientShotWhileIconsAreVisibleAndPoolRemainsBounded','TuTienLive.Tests.Qua78Tests.RitualFlightIsFollowedAndBattleDisconnectOrSessionChangeRestoresOverview','TuTienLive.Tests.Qua78Tests.PlayProtocolGlobalReceiptsNeverEnterPersonalZoomQueueAndDisableCleansUp','TuTienLive.Tests.BlessingReceiptTests.SavedArtAndTwoSecondPopCountShakeAndCleanup','TuTienLive.Tests.BlessingReceiptTests.BurstAddsCountDeduplicatesAndDoesNotExtendPulse','TuTienLive.Tests.BlessingReceiptTests.SnapshotReconnectInvalidCountsAndItemGrantNeverReplayActivation','TuTienLive.Tests.BlessingReceiptTests.LowQualityDisablesShakeAndPopExpiresWhilePausedOrBattling','TuTienLive.Tests.BlessingReceiptTests.ShakePreservesAndRestoresConcurrentItemCameraFocus','TuTienLive.Tests.BlessingReceiptTests.PlayProtocolPopsAndPlaysExistingSfxExactlyOnce')
 $bwFilter=($bwNames+$bwExtra)-join ';'
 $bwArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$bwFilter+'"'),'-testResults',('"'+(Join-Path $bwOut 'tests.xml')+'"'))
}
$bwProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $bwArgs -WindowStyle Hidden -PassThru
$bwProcess.Id | Set-Content (Join-Path $bwOut 'helper-pid.txt')
$bwStart=Get-Date
while(-not $bwProcess.WaitForExit(1000)){if(((Get-Date)-$bwStart).TotalMinutes -gt 12){$bwProcess.Kill();throw 'Isolated camera9 helper exceeded 12 minutes.'}}
Write-Output ('Camera9 '+$Mode+' exit '+$bwProcess.ExitCode);exit $bwProcess.ExitCode
