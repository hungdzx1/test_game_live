param([ValidateSet('Focused','Regression')][string]$Mode='Focused')
$ErrorActionPreference='Stop'
$adaptiveRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$adaptiveOut=Join-Path $adaptiveRoot 'test-results/adaptive-boss'
$adaptiveProject=Join-Path $adaptiveRoot 'test-results/unity-concept02/project'
foreach($adaptiveRelative in @('Scripts/Models/GameModels.cs','Scripts/Network/StateMapper.cs','Scripts/Effects/BossBattlePresenter.cs','Scripts/UI/Concept02Hud.cs','Tests/Editor/AdaptiveBossTests.cs','Tests/Editor/AdaptiveBossTests.cs.meta')){
 Copy-Item -LiteralPath (Join-Path $adaptiveRoot ('unity-client/Assets/'+$adaptiveRelative)) -Destination (Join-Path $adaptiveProject ('Assets/'+$adaptiveRelative))
}
Copy-Item -LiteralPath (Join-Path $adaptiveRoot 'unity-client/Assets/Tests/Fixtures/AdaptiveBoss') -Destination (Join-Path $adaptiveProject 'Assets/Tests/Fixtures') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $adaptiveRoot 'unity-client/Assets/Tests/Fixtures/AdaptiveBoss.meta') -Destination (Join-Path $adaptiveProject 'Assets/Tests/Fixtures/AdaptiveBoss.meta') -Force
$adaptiveFilter='TuTienLive.Tests.AdaptiveBossTests'
if($Mode -eq 'Regression'){
 foreach($adaptivePair in @(@('TUTIEN_AVATAR_TEST_URL','avatar-format-fix'),@('TUTIEN_RECEIPT_TEST_URL','avatar-format-fix'),@('TUTIEN_VOICE_TEST_URL','ai-voice'))){
  $adaptiveServer=Get-Content -Encoding UTF8 (Join-Path $adaptiveRoot ('test-results/'+$adaptivePair[1]+'/server.json')) -Raw|ConvertFrom-Json
  $adaptiveUri=[uri]$adaptiveServer.base
  if(-not $adaptiveUri.IsLoopback -or $adaptiveUri.Scheme -ne 'http'){throw 'Only disposable loopback test helpers are allowed.'}
  [Environment]::SetEnvironmentVariable($adaptivePair[0],$adaptiveServer.base,'Process')
 }
 [xml]$adaptivePrevious=Get-Content -Encoding UTF8 (Join-Path $adaptiveRoot 'docs/Tailieu_output/ai-voice/unity-regression.xml') -Raw
 $adaptiveFilter=(@($adaptivePrevious.SelectNodes('//test-case')|ForEach-Object {$_.fullname})+@('TuTienLive.Tests.AdaptiveBossTests')) -join ';'
}
$adaptiveArgs=@('-batchmode','-nographics','-projectPath',('"'+$adaptiveProject+'"'),'-logFile',('"'+(Join-Path $adaptiveOut ('unity-'+$Mode.ToLower()+'.log'))+'"'),'-runTests','-testPlatform','EditMode','-testFilter',('"'+$adaptiveFilter+'"'),'-testResults',('"'+(Join-Path $adaptiveOut ('unity-'+$Mode.ToLower()+'.xml'))+'"'))
$adaptiveProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $adaptiveArgs -WindowStyle Hidden -PassThru
$adaptiveStart=Get-Date
while(-not $adaptiveProcess.WaitForExit(1000)){if(((Get-Date)-$adaptiveStart).TotalMinutes -gt 15){$adaptiveProcess.Kill();throw 'Disposable Unity adaptive-boss test exceeded15 minutes.'}}
Write-Output ('Unity adaptive boss '+$Mode+' exit '+$adaptiveProcess.ExitCode)
exit $adaptiveProcess.ExitCode
