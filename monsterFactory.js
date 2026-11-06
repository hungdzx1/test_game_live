export const MONSTER_NAMES=['Ma Binh','Ám Linh','Thạch Ma'];
export const BOSS_NAMES=['Ma Binh Thống Lĩnh','Huyết Ma Tướng Quân','Vạn Kiếp Ma Tôn'];
export function createMonster(field,index,realm,time,forcedType=null){
  const type=forcedType??index%3,angle=index*2.39996;
  const hp=Math.max(1,Math.round(realm.hp*[.22,.16,.35][type]));
  return {id:`${field.id}:mob:${index}`,kind:'mob',type,name:MONSTER_NAMES[type],hp,maxHp:hp,atk:realm.atk*.32,def:realm.def*.15,moveSpeed:[1.8,2.5,1.2][type],attackInterval:2200,targetId:null,spawnTime:time,status:'alive',x:Math.cos(angle)*9,z:Math.sin(angle)*9,attackAt:time+1500,animation:'walk',animationUntil:0};
}
export function createBoss(field,index,realm,rules,time){
  const count=field.participantIds.length,dps=realm.atk*1000/rules.combat.attackIntervalMs;
  const hp=Math.max(1,Math.round(count*dps*90*rules.boss.difficultyK[index]*(count===1?rules.boss.soloFactor:1)));
  return {id:`${field.id}:boss:${index}`,kind:'boss',type:index,name:BOSS_NAMES[index],hp,maxHp:hp,atk:realm.atk*(.9+index*.35),def:0,moveSpeed:1.1,attackInterval:2000,targetId:null,spawnTime:time,status:'alive',x:0,z:-3,attackAt:time+2000,specialAt:time+10000,animation:'idle',animationUntil:0,enraged:false,spawnParticipants:count,standardDps:dps,lastHit:null};
}
