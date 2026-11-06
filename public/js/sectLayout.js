// Presentation coordinates only. Never write these back to the game state.
const point=(x,y,z)=>Object.freeze({x,y,z});
export const SECT_COURTYARD_CENTER=point(-1.8,0,4.4);
export const TRIBULATION_PLATFORM_CENTER=point(4.8,6.4,-7.2);
export const SECT_CAMERA_ANCHOR=Object.freeze({position:point(8,31,47),target:point(0,2.5,0)});
export const SECT_BOUNDS=Object.freeze({
  courtyard:Object.freeze({center:SECT_COURTYARD_CENTER,radius:8.1,height:3}),
  tribulation:Object.freeze({center:TRIBULATION_PLATFORM_CENTER,radius:4.3,height:8})
});
export const SECT_SEATS=12;
export function sectSeat(index){
  const slot=((index%SECT_SEATS)+SECT_SEATS)%SECT_SEATS,angle=slot*Math.PI*2/SECT_SEATS+Math.PI/SECT_SEATS;
  return {x:SECT_COURTYARD_CENTER.x+Math.sin(angle)*5.9,z:SECT_COURTYARD_CENTER.z+Math.cos(angle)*5.9,elevation:.3,facing:angle+Math.PI,sectSlot:slot};
}
