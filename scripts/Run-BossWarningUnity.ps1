param([ValidateSet('Setup','Test','WarningTest','Capture')][string]$Mode='Setup')
$ErrorActionPreference='Stop'
$bwRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bwOut=Join-Path $bwRoot 'test-results/boss-warning'
$bwArgs=@('-batchmode','-projectPath',('"'+(Join-Path $bwRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $bwOut ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$bwArgs+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.BossWarningSetup.Setup')}
if($Mode -eq 'Capture'){$bwArgs+=@('-quit','-executeMethod','TuTienLive.Editor.BossWarningSetup.Capture')}
if($Mode -eq 'WarningTest'){$bwArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter','TuTienLive.Tests.BossWarningTests','-testResults',('"'+(Join-Path $bwOut 'warning-tests.xml')+'"'))}
if($Mode -eq 'Test'){
 if(Test-Path (Join-Path $bwOut 'tests.xml')){Move-Item -LiteralPath (Join-Path $bwOut 'tests.xml') -Destination (Join-Path $bwOut 'tests-previous.xml') -Force}
 [xml]$bwPrevious=Get-Content (Join-Path $bwRoot 'test-results/guide-storm/tests.xml') -Raw
 $bwNames=@($bwPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -ne 'TuTienLive.Tests.NetworkProtocolTests'}|ForEach-Object {$_.fullname})
 $bwExtra=@('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.BossWarningTests','TuTienLive.Tests.BossBattleTests.SavedSuppliedFramesHeaderAndAllVisibleDisciplesAttackOnTheirOwnSeats','TuTienLive.Tests.BossBattleTests.SixFrameLoopAndHPFillFollowServerWithoutChangingSnapshotOrAuthoredCamera','TuTienLive.Tests.BossBattleTests.BossTwoThreeUseTheirOwnFramesAndHPAndPauseFreezesFrameAndProjectiles','TuTienLive.Tests.BossBattleTests.ProjectilesAreProceduralPooledAndBoundedAndClearOnReturnOrDisconnect','TuTienLive.Tests.BossBattleTests.SharedBossProtocolRejectsBadHPOrIndexButKeepsLegacySnapshotsCompatible','TuTienLive.Tests.BossBattleTests.PlayProtocolKeepsBossAttackRosterAndClearsOnDisconnect','TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.GameAudioTests.SuppliedAudioDecodesToNonSilentSamples','TuTienLive.Tests.GameAudioTests.RealServerEventsAndRitualMotionPlayOnceAndReconnectDoesNotReplay','TuTienLive.Tests.GameAudioTests.VolumeChannelsMissingClipsMalformedSettingsAndVoiceBudgetAreSafe')
 $bwFilter=($bwNames+$bwExtra)-join ';'
 $bwArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$bwFilter+'"'),'-testResults',('"'+(Join-Path $bwOut 'tests.xml')+'"'))
}
$bwProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $bwArgs -WindowStyle Hidden -PassThru
$bwProcess.Id | Set-Content (Join-Path $bwOut 'helper-pid.txt')
$bwStart=Get-Date
while(-not $bwProcess.WaitForExit(1000)){if(((Get-Date)-$bwStart).TotalMinutes -gt 12){$bwProcess.Kill();throw 'Isolated boss warning helper exceeded 12 minutes.'}}
Write-Output ('Boss warning '+$Mode+' exit '+$bwProcess.ExitCode);exit $bwProcess.ExitCode
