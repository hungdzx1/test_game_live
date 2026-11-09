param([ValidateSet('Focused','Regression','Build')][string]$Mode='Focused')
$ErrorActionPreference='Stop'
$voiceRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$voiceOut=Join-Path $voiceRoot 'test-results/ai-voice'
$voiceProject=Join-Path $voiceRoot 'test-results/unity-concept02/project'
if(-not (Test-Path -LiteralPath (Join-Path $voiceProject 'Assets'))){throw 'Prepare the isolated Unity project under test-results/unity-concept02/project first.'}
$voiceEditor='C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe'
foreach($voiceRelative in @('Scripts/Audio/ThienDaoVoicePlayer.cs','Scripts/Audio/ThienDaoVoicePlayer.cs.meta','Scripts/Audio/GameAudioManager.cs','Tests/Editor/ThienDaoVoiceTests.cs','Tests/Editor/ThienDaoVoiceTests.cs.meta','Editor/AiVoiceVerification.cs','Editor/AiVoiceVerification.cs.meta')){
 Copy-Item -LiteralPath (Join-Path $voiceRoot ('unity-client/Assets/'+$voiceRelative)) -Destination (Join-Path $voiceProject ('Assets/'+$voiceRelative))
}
$voiceArgs=@('-batchmode','-nographics','-projectPath',('"'+$voiceProject+'"'),'-logFile',('"'+(Join-Path $voiceOut ('unity-'+$Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Build'){
 Copy-Item -LiteralPath (Join-Path $voiceRoot 'unity-client/Assets/Scenes/SectScene_Concept02.unity') -Destination (Join-Path $voiceProject 'Assets/Scenes/SectScene_Concept02.unity')
 $voiceArgs+=@('-quit','-executeMethod','TuTienLive.Editor.AiVoiceVerification.BuildWindows')
}
else{
 $voiceServer=Get-Content -Encoding UTF8 (Join-Path $voiceOut 'server.json') -Raw | ConvertFrom-Json
 $voiceUri=[uri]$voiceServer.base
 if(-not $voiceUri.IsLoopback -or $voiceUri.Scheme -ne 'http'){throw 'Only the disposable local voice server is permitted.'}
 $env:TUTIEN_VOICE_TEST_URL=$voiceServer.base
 $voiceFilter='TuTienLive.Tests.ThienDaoVoiceTests'
 if($Mode -eq 'Regression'){
  $avatarServer=Get-Content -Encoding UTF8 (Join-Path $voiceRoot 'test-results/avatar-format-fix/server.json') -Raw | ConvertFrom-Json
  $avatarUri=[uri]$avatarServer.base
  if(-not $avatarUri.IsLoopback -or $avatarUri.Scheme -ne 'http'){throw 'Only the disposable local avatar server is permitted.'}
  $env:TUTIEN_AVATAR_TEST_URL=$avatarServer.base
  $env:TUTIEN_RECEIPT_TEST_URL=$avatarServer.base
  [xml]$voicePrevious=Get-Content -Encoding UTF8 (Join-Path $voiceRoot 'docs/Tailieu_output/avatar-format-fix/unity-initial-regression.xml') -Raw
  $voiceNames=@($voicePrevious.SelectNodes('//test-case')|Where-Object {$_.classname -ne 'TuTienLive.Tests.NetworkProtocolTests' -and $_.fullname -notmatch 'SavedSceneHasEditableClips'}|ForEach-Object {$_.fullname})
  $voiceFilter=($voiceNames+@('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.GameAudioTests.SavedSceneHasEditableClipsAndOneListenerWithoutChangingExistingObjects','TuTienLive.Tests.ThienDaoVoiceTests')) -join ';'
 }
 $voiceArgs+=@('-runTests','-testPlatform','EditMode','-testFilter',('"'+$voiceFilter+'"'),'-testResults',('"'+(Join-Path $voiceOut ('unity-'+$Mode.ToLower()+'.xml'))+'"'))
}
$voiceProcess=Start-Process -FilePath $voiceEditor -ArgumentList $voiceArgs -WindowStyle Hidden -PassThru
$voiceProcess.Id | Set-Content (Join-Path $voiceOut 'unity-helper-pid.txt')
$voiceStart=Get-Date
while(-not $voiceProcess.WaitForExit(1000)){if(((Get-Date)-$voiceStart).TotalMinutes -gt 15){$voiceProcess.Kill();throw 'Isolated Unity voice helper exceeded 15 minutes.'}}
Write-Output ('Unity voice '+$Mode+' exit '+$voiceProcess.ExitCode)
exit $voiceProcess.ExitCode
