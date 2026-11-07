import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';
import {fromTikTok,validateEvent} from '../normalizeEvent.js';
import {parseCommand} from '../commandRouter.js';
import {giftRulesFor,matchGift,liveRulesFor} from '../liveConfig.js';
let sequence=0;
function input(loai,extra={}){return {eventId:`event-${++sequence}`,source:'demo',userId:'guest',ten:'Đạo Hữu',loai,rawMeta:{streamId:'room1'},...extra};}
function gift(extra={}){return input('qua',{giftId:'5655',qua:'Hồng',soKimCuong:1,soLuong:1,rawMeta:{streamId:'room1',giftType:0},...extra});}
function make(config={}){const e=new GameEngine([],config);e.liveEvents.words=['bậy'];e.liveEvents.commands.words=['bậy'];e.setPhase('cultivation');return e;}
function join(e,id='guest',text='nhập môn'){return e.liveEvents.accept(input('binhluan',{userId:id,noiDung:text}));}
function advance(e,ms){for(let left=ms;left>0;left-=250)e.tick(Math.min(250,left));}
test('Native 2.5.0/v3 normalization: stable user.id, gift.type/name, count/total; no avatars/raw leak',()=>{
  const raw={user:{id:'123456',nickname:'Đạo Hữu',avatarThumb:{urlList:['https://example.invalid/a']}},common:{msgId:'1001',roomId:'999'},comment:'NHẬP MÔN'};
  const chat=fromTikTok('chat',raw,'999');assert.equal(chat.userId,'tt:123456');assert.equal(chat.noiDung,'NHẬP MÔN');assert.equal(chat.avatar,null);assert.equal(JSON.stringify(chat).includes('example.invalid'),false);
  const g=fromTikTok('gift',{...raw,giftId:'5655',gift:{type:1,name:'Hồng',diamondCount:1},repeatCount:5,repeatEnd:1,groupId:'777'},'999');assert.equal(g.rawMeta.repeatEnd,true);assert.equal(g.soLuong,5);assert.equal(g.soKimCuong,1);assert.equal(g.rawMeta.comboId,'777');
  const like=fromTikTok('like',{...raw,count:10,total:'1100'},'999');assert.equal(like.soLuong,10);assert.equal(like.rawMeta.likeTotal,1100);
  assert.throws(()=>fromTikTok('chat',{...raw,user:{nickname:'Trùng tên'}},'999'),/user ID/);assert.throws(()=>fromTikTok('gift',{...raw,giftId:'1',repeatCount:1,gift:{type:1,diamondCount:1},repeatEnd:1},'999'),/group ID/);
  assert.throws(()=>fromTikTok('gift',{...raw,giftId:'1',repeatCount:1,giftDetails:{giftType:1,diamondCount:1}},'999'),/đơn giá/);
  const longGift='Hoa hồng của tông môn trên thiên giới';assert.equal(fromTikTok('gift',{...raw,giftId:'1',repeatCount:1,gift:{type:0,diamondCount:1,name:longGift}},'999').qua,longGift);
});
test('04-05/15 exact commands, stable identity, same name distinct IDs, XSS/word filter/length',()=>{
  const e=make();assert.equal(join(e).accepted,true);const p=e.getPlayer('guest');p.cultivation=42;
  assert.equal(join(e,'guest','NHAP MON').accepted,true);assert.equal(p.cultivation,42);assert.equal(e.players.size,1);
  join(e,'other');assert.equal(e.players.size,2);
  assert.equal(parseCommand('Tôi muốn nhập môn nhé'),null);assert.equal(parseCommand('  ĐIỂM   DANH '),'diem danh');assert.equal(parseCommand('<img src=x>'),null);
  const event=input('binhluan',{userId:'xss',ten:'<b>BẬY</b> abcdefghijklmnopqrstuvwxyz',noiDung:'nhập môn'});e.liveEvents.accept(event);const name=e.getPlayer('xss').name;assert.equal(name.includes('<'),false);assert.equal(name.toLowerCase().includes('bậy'),false);assert.ok([...name].length<=20);
  assert.equal(e.liveEvents.accept(input('binhluan',{noiDung:'x'.repeat(201)})).accepted,false);assert.equal(e.players.size,3);
  const decomposed=validateEvent(input('vao',{ten:'bậy'.normalize('NFD')}),['bậy']);assert.equal(decomposed.ten,'***');
});
test('04-06/07 comments invoke existing combat only in battle, no implicit join or arbitrary chat damage',()=>{
  const e=make();join(e);assert.equal(e.liveEvents.accept(input('binhluan',{noiDung:'1'})).accepted,false);e.setPhase('battle');const f=e.battle.current.fields[0],p=f.participants.guest;
  assert.equal(e.liveEvents.accept(input('binhluan',{userId:'not-joined',noiDung:'1'})).accepted,false);assert.equal(e.players.size,1);
  e.liveEvents.accept(input('binhluan',{noiDung:'đánh 1 nhé'}));assert.equal(p.damage,0);
  e.liveEvents.accept(input('binhluan',{noiDung:'1'}));assert.equal(p.damage,20);assert.equal(p.cooldowns['1'],10000);
  e.liveEvents.accept(input('binhluan',{noiDung:'2'}));assert.equal(p.damage,50);assert.equal(p.cooldowns['2'],25000);
  e.liveEvents.accept(input('binhluan',{noiDung:'1'}));assert.equal(p.damage,50);
});
test('04-08/11 all five mapped items use cultivation services; battle gifts keep EXP/buffs/realm frozen',()=>{
  const e=make();join(e);const p=e.getPlayer('guest');e.setPhase('battle');const before={exp:p.cultivation,realm:p.realmIndex,buffs:p.buffs.length};
  for(const [i,item]of ['tea','pill','blessing','root','camera'].entries()){
    e.config.giftRules=giftRulesFor([{id:'exact',giftId:'5655',giftName:'',minDiamonds:1,maxDiamonds:100,item,quantity:1,effect:'item',enabled:true}]);
    assert.equal(e.liveEvents.accept(gift()).accepted,true);assert.equal(p.inventory[item],1);
  }
  advance(e,60000);assert.equal(p.cultivation,before.exp);assert.equal(p.realmIndex,before.realm);assert.equal(p.buffs.length,before.buffs);assert.equal(p.spiritualRootMultiplier,1);
  e.setPhase('cultivation');e.tick(0);assert.equal(p.buffs.length,1);assert.equal(e.globalBuffs.length,1);assert.equal(p.spiritualRootMultiplier,2);assert.equal(p.breakthrough.pillCount,1);assert.equal(p.focusCooldownMs,10000);assert.equal(p.cultivation,before.exp);
});
test('04-09/10 combo 1→3→5 only grants final total; duplicate finals/reconnect/restart never grant twice',()=>{
  const e=make();join(e);e.setPhase('battle');const rawMeta={streamId:'room1',giftType:1,repeatEnd:false,comboId:'combo-a'};
  for(const n of [1,3,5])e.liveEvents.accept(gift({soLuong:n,rawMeta}));assert.equal(e.getPlayer('guest').inventory.tea,0);
  const final=gift({soLuong:5,rawMeta:{...rawMeta,repeatEnd:true}});e.liveEvents.accept(final);assert.equal(e.getPlayer('guest').inventory.tea,5);
  e.liveEvents.accept(final);e.liveEvents.accept({...final,eventId:'different-final-message'});assert.equal(e.getPlayer('guest').inventory.tea,5);
  const saved=JSON.parse(JSON.stringify(e.exportState())),restored=new GameEngine(saved.players,e.config,{saved});restored.setPhase('resume');restored.liveEvents.accept({...final,eventId:'after-restart'});assert.equal(restored.getPlayer('guest').inventory.tea,5);
  restored.liveEvents.accept({...final,eventId:'separate-combo',rawMeta:{...final.rawMeta,comboId:'combo-b'}});assert.equal(restored.getPlayer('guest').inventory.tea,10);
});
test('Malformed gift/unfinished/inconsistent combos never guess value or settle early',()=>{
  const e=make();join(e);e.setPhase('battle');let now=1000;e.liveEvents.now=()=>now;
  for(const extra of [{soLuong:-1},{soLuong:NaN},{soKimCuong:Infinity},{soKimCuong:0},{soLuong:10001},{rawMeta:{streamId:'room1',giftType:1,repeatEnd:true}}])assert.equal(e.liveEvents.accept(gift(extra)).accepted,false);
  const meta={streamId:'room1',giftType:1,comboId:'missing-end',repeatEnd:false};e.liveEvents.accept(gift({soLuong:5,rawMeta:meta}));
  assert.equal(e.liveEvents.accept(gift({soLuong:3,rawMeta:{...meta,repeatEnd:true}})).accepted,false);assert.equal(e.getPlayer('guest').inventory.tea,0);
  now+=120001;e.liveEvents.tick();assert.equal(e.liveEvents.combos.size,0);assert.ok(e.liveEvents.log.some(e=>e.message.includes('hết hạn')));assert.equal(e.getPlayer('guest').inventory.tea,0);
});
test('Gift before join survives restart and is received once; inventory full retains overflow; root/camera limits',()=>{
  const e=make();e.setPhase('battle');e.liveEvents.accept(gift({soLuong:3}));assert.equal(e.players.size,0);assert.equal(e.liveEvents.inbox.get('guest').items.tea,3);
  const saved=JSON.parse(JSON.stringify(e.exportState())),restored=new GameEngine(saved.players,e.config,{saved});restored.setPhase('resume');join(restored);const p=restored.getPlayer('guest');assert.equal(p.inventory.tea,3);assert.equal(restored.liveEvents.inbox.size,0);
  p.inventory.tea=100000;restored.liveEvents.accept(gift({soLuong:2}));assert.equal(restored.liveEvents.inbox.get('guest').items.tea,2);
  restored.setPhase('cultivation');restored.tick(250);assert.ok(p.buffs.length>0);assert.ok(p.inventory.tea<=100000);
  const rootRule=[{id:'root',giftId:'',giftName:'',minDiamonds:1,maxDiamonds:100,item:'root',quantity:1,effect:'item',enabled:true}];restored.config.giftRules=giftRulesFor(rootRule);restored.liveEvents.accept(gift({soLuong:3}));assert.equal(p.spiritualRootMultiplier,2);assert.equal(p.inventory.root,2);
});
test('Mapping precedence, overlap/duplicates/bounds rejected and all item/effect choices available',()=>{
  const base=giftRulesFor(),exact={...base[0],id:'exact',giftId:'5655',item:'root'},named={...base[0],id:'named',giftName:'Hồng',item:'camera'};
  const rules=giftRulesFor([...base,exact,named]);assert.equal(matchGift(rules,gift()).item,'root');assert.equal(matchGift(rules,gift({giftId:'999'})).item,'camera');assert.equal(matchGift(rules,gift({giftId:'999',qua:'Khác',soKimCuong:100})).item,'blessing');
  assert.throws(()=>giftRulesFor([...base,{...base[0],id:'overlap'}]),/chồng/);assert.throws(()=>giftRulesFor([exact,{...exact,id:'duplicate'}]),/Trùng/);assert.throws(()=>giftRulesFor([{...exact,item:'unknown'}]));
  assert.throws(()=>liveRulesFor({signApiKey:'secret'}));assert.throws(()=>liveRulesFor({wishThreshold:0}));
});
test('04-13 likes reconcile and settle each configured level once; battle items wait and old repeating wish is retired',()=>{
  const e=make({sectLevels:[{level:1,likes:10,reward:{item:'tea',quantity:1},scope:'all'},{level:2,likes:1000,reward:null,scope:'all'}]});join(e);e.setPhase('battle');const p=e.getPlayer('guest'),initial=p.questState.points;
  const first=input('tim',{soLuong:5,rawMeta:{streamId:'room1',likeTotal:105}});e.liveEvents.accept(first);e.liveEvents.accept(first);assert.equal(e.liveEvents.sectEnergy.power,5);
  e.liveEvents.accept(input('tim',{soLuong:5,rawMeta:{streamId:'room1',likeTotal:105}}));assert.equal(e.liveEvents.sectEnergy.power,5);
  e.liveEvents.accept(input('tim',{soLuong:5,rawMeta:{streamId:'room1',likeTotal:110}}));assert.equal(e.liveEvents.sectEnergy.completed.size,1);assert.equal(p.inventory.tea,1);
  e.liveEvents.accept(input('tim',{soLuong:1000}));assert.equal(e.liveEvents.sectEnergy.snapshot().full,true);
  e.liveEvents.accept(input('tim',{soLuong:1}));assert.equal(e.liveEvents.sectEnergy.completed.size,2);assert.equal(p.inventory.tea,1);assert.equal(p.questState.points,initial);assert.equal(e.liveEvents.wish.awards,0);
  e.setPhase('cultivation');e.tick(0);assert.equal(p.inventory.tea,0);assert.equal(p.buffs.length,1);
});
test('04-14 per-user/global flooding, one follow/join notice per cooldown, no auto accounts',()=>{
  const e=make();for(let i=0;i<20;i++)e.liveEvents.accept(input('vao'));
  assert.equal(e.players.size,0);assert.equal(e.events.filter(e=>e.kind==='live:join').length,1);assert.ok(e.liveEvents.log.some(e=>e.message.includes('giới hạn')));
  let now=Date.now()+11000;e.liveEvents.now=()=>now;e.liveEvents.accept(input('vao'));assert.equal(e.events.filter(e=>e.kind==='live:join').length,2);
  for(let i=0;i<300;i++)e.liveEvents.accept(input('theodoi',{userId:`viewer-${i}`}));assert.ok(e.events.length<=100);assert.ok(e.liveEvents.limits.get('global').count<=200);assert.ok(e.liveEvents.log.length<=50);
});
test('Mixed delta-only and cumulative likes reconcile after restart instead of counting twice',()=>{
  const e=make({live:{wishThreshold:1000}});const bus=e.liveEvents;
  bus.accept(input('tim',{soLuong:5,rawMeta:{streamId:'room1',likeTotal:105}}));bus.accept(input('tim',{soLuong:5}));assert.equal(bus.sectEnergy.power,10);
  const saved=JSON.parse(JSON.stringify(e.exportState())),restored=new GameEngine(saved.players,e.config,{saved});restored.liveEvents.accept(input('tim',{soLuong:5,rawMeta:{streamId:'room1',likeTotal:110}}));assert.equal(restored.liveEvents.sectEnergy.power,10);
  restored.liveEvents.accept(input('tim',{soLuong:3,rawMeta:{streamId:'room1',likeTotal:113}}));assert.equal(restored.liveEvents.sectEnergy.power,13);
});
test('Public interaction snapshot has minimal fields and no receipt/inbox/raw/comment history',()=>{
  const e=make();join(e);e.liveEvents.accept(gift());const publicState=e.snapshot().payload.interactions;assert.deepEqual(Object.keys(publicState).sort(),['blessing','giftBanner','sectEnergy','wish']);const json=JSON.stringify(publicState);for(const key of ['rawMeta','noiDung','inbox','activations','seen'])assert.equal(json.includes(key),false);
});
test('Deferred battle pill is applied before a newly queued breakthrough roll on returning to sect',()=>{
  const e=make();join(e);const p=e.getPlayer('guest');p.stageIndex=3;e.setPhase('battle');
  e.liveEvents.accept(gift({soKimCuong:10}));assert.equal(p.inventory.pill,1);assert.equal(p.breakthrough.pillCount,0);
  e.setPhase('cultivation');assert.equal(p.inventory.pill,0);assert.equal(p.breakthrough.pillCount,1);advance(e,250);assert.equal(e.breakthrough.active.probability,100);assert.equal(p.breakthrough.pillCount,0);
});
