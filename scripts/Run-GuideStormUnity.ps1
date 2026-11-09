param([ValidateSet('Setup','Test','Capture')][string]$Mode='Setup')
$ErrorActionPreference='Stop'
$gsRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$gsOut=Join-Path $gsRoot 'test-results/guide-storm'
$gsArgs=@('-batchmode','-projectPath',('"'+(Join-Path $gsRoot 'test-results/unity-concept02/project')+'"'),'-logFile',('"'+(Join-Path $gsOut ($Mode.ToLower()+'.log'))+'"'))
if($Mode -eq 'Setup'){$gsArgs+=@('-nographics','-quit','-executeMethod','TuTienLive.Editor.GuideStormAdjustment.Setup')}
if($Mode -eq 'Capture'){$gsArgs+=@('-quit','-executeMethod','TuTienLive.Editor.GuideStormAdjustment.Capture')}
if($Mode -eq 'Test'){
 if(Test-Path (Join-Path $gsOut 'tests.xml')){Move-Item -LiteralPath (Join-Path $gsOut 'tests.xml') -Destination (Join-Path $gsOut 'tests-previous.xml') -Force}
 [xml]$gsPrevious=Get-Content (Join-Path $gsRoot 'test-results/k01/tests.xml') -Raw
 $gsFilter=(@($gsPrevious.SelectNodes('//test-case')|Where-Object {$_.classname -ne 'TuTienLive.Tests.NetworkProtocolTests'}|ForEach-Object {$_.fullname})+@('TuTienLive.Tests.NetworkProtocolTests','TuTienLive.Tests.Concept02StormTests')) -join ';'
 $gsArgs+=@('-nographics','-runTests','-testPlatform','EditMode','-testFilter',('"'+$gsFilter+'"'),'-testResults',('"'+(Join-Path $gsOut 'tests.xml')+'"'))
}
$gsProcess=Start-Process -FilePath 'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe' -ArgumentList $gsArgs -WindowStyle Hidden -PassThru
$gsProcess.Id | Set-Content (Join-Path $gsOut 'helper-pid.txt')
$gsStart=Get-Date
while(-not $gsProcess.WaitForExit(1000)){if(((Get-Date)-$gsStart).TotalMinutes -gt 12){$gsProcess.Kill();throw 'Isolated guide/storm helper exceeded 12 minutes.'}}
Write-Output ('Guide/storm '+$Mode+' exit '+$gsProcess.ExitCode);exit $gsProcess.ExitCode
