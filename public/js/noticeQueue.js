export class NoticeQueue{
  constructor({limit=8,now=()=>performance.now()}={}){this.limit=limit;this.now=now;this.queue=[];}
  push(text,priority=false,ttl=10000){const entry={text:String(text).slice(0,300),priority,expires:this.now()+ttl};if(priority)this.queue.unshift(entry);else this.queue.push(entry);this.queue.sort((a,b)=>Number(b.priority)-Number(a.priority));this.queue.length=Math.min(this.limit,this.queue.length);}
  next(time=this.now()){this.queue=this.queue.filter(q=>q.expires>time);return this.queue.shift()?.text??null;}
}
