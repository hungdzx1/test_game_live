// Recorded snapshots from the actual Node engine; never touch player save files.
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{GameEngine}from'../gameEngine.js';
const root='unity-client/Assets/Tests/Fixtures/SectHud';await mkdir(root,{recursive:true});
const source=JSON.parse(await readFile('unity-client/Assets/Tests/Fixtures/Characters/players-10.json')).payload.players;
for(const[name,likes]of [['level1',650],['level2',2500],['level3-max',9000]]){
  const players=structuredClone(source);
  for(const[index,realmIndex,ten]of [[9,10,'Tử Yên'],[7,9,'Bạch Liên'],[5,8,'Minh Nguyệt']])Object.assign(players[index],{name:ten,realmIndex,stageIndex:0,cultivation:0});
  const e=new GameEngine(players);e.phase='paused';e.previousPhase='cultivation';
  e.liveEvents.accept({source:'demo',loai:'tim',eventId:'sect-hud-'+name,userId:'demo:likes',ten:'Đạo hữu',soLuong:likes,rawMeta:{streamId:'sect-hud-fixture'}});
  await writeFile(root+'/'+name+'.json',JSON.stringify(e.snapshot(),null,2));
}
console.log('Recorded three real-engine sect energy/rank snapshots.');
