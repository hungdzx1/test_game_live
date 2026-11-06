export class QualityGovernor{
  constructor(){this.level='medium';this.configured=null;this.frames=0;this.elapsed=0;this.lowWindows=0;this.fps=null;}
  configure(level,auto=true){if(level!==this.configured||!auto){this.configured=level;this.level=level;this.lowWindows=0;}this.auto=auto;}
  sample(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>1000)return false;this.frames++;this.elapsed+=deltaMs;if(this.elapsed<5000)return false;this.fps=this.frames*1000/this.elapsed;this.frames=0;this.elapsed=0;this.lowWindows=this.fps<24?this.lowWindows+1:0;if(this.auto&&this.lowWindows>=2&&this.level!=='low'){this.level=this.level==='high'?'medium':'low';this.lowWindows=0;return true;}return false;}
}
