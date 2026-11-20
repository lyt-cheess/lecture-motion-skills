// Continuous texture deformation of an original pose; no pose cycling or redrawn cat.
const XIXI_ACTOR_BASE = new URL('.', document.currentScript.src);
window.createActor=async function(){
 const atlas=await(await fetch(new URL('atlas.json', XIXI_ACTOR_BASE))).json();const imgs={};
 await Promise.all(['classroom','expression','teacher'].map(async k=>{let im=new Image();im.src=new URL('assets/xixi-'+k+'.png', XIXI_ACTOR_BASE).href;await im.decode();imgs[k]=im;}));
 const cache={};
 function original(sheet,row,col){
  const key=[sheet,row,col].join('/');if(cache[key])return cache[key];
  const xs=[90,312,537,762,987,1212,1450],ys=[0,153,306,458,610,748,894,1024],anchor=[200,426,650,875,1100,1325][col];
  const x0=xs[col],y0=ys[row],w=xs[col+1]-x0,h=ys[row+1]-y0;
  const cell=document.createElement('canvas');cell.width=w;cell.height=h;const cg=cell.getContext('2d',{willReadFrequently:true});cg.drawImage(imgs[sheet],x0,y0,w,h,0,0,w,h);
  const data=cg.getImageData(0,0,w,h),pix=data.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=[];
  const neighbours=k=>{const x=k%w,y=Math.floor(k/w),ns=[];if(x)ns.push(k-1);if(x<w-1)ns.push(k+1);if(y)ns.push(k-w);if(y<h-1)ns.push(k+w);return ns;};
  const ink=k=>pix[k*4+3]>100&&Math.min(pix[k*4],pix[k*4+1],pix[k*4+2])<218;
  for(let k=0;k<w*h;k++){if(seen[k]||!ink(k))continue;let st=0,en=1;queue[0]=k;seen[k]=1;while(st<en){const j=queue[st++];for(const q of neighbours(j))if(!seen[q]){seen[q]=1;if(ink(q))queue[en++]=q;}}if(en>best.length)best=Array.from(queue.slice(0,en));}
  // Mask only the original silhouette; fill enclosed white face areas. Detached
  // illustration punctuation is excluded instead of clipping half a light bulb.
  const mask=new Uint8Array(w*h),outside=new Uint8Array(w*h);let minX=w,minY=h,maxX=0,maxY=0;
  for(const k of best){mask[k]=1;const x=k%w,y=Math.floor(k/w);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  let st=0,en=0;function edge(k){if(!mask[k]&&!outside[k]){outside[k]=1;queue[en++]=k;}}
  for(let x=0;x<w;x++){edge(x);edge((h-1)*w+x);}for(let y=0;y<h;y++){edge(y*w);edge(y*w+w-1);}while(st<en){for(const k of neighbours(queue[st++]))if(!mask[k]&&!outside[k]){outside[k]=1;queue[en++]=k;}}
  for(let k=0;k<w*h;k++)if(outside[k])pix[k*4+3]=0;cg.putImageData(data,0,0);
  minX=Math.max(0,minX-3);minY=Math.max(0,minY-3);maxX=Math.min(w-1,maxX+3);maxY=Math.min(h-1,maxY+3);
  const c=document.createElement('canvas');c.width=maxX-minX+1;c.height=maxY-minY+1;c.getContext('2d').drawImage(cell,minX,minY,c.width,c.height,0,0,c.width,c.height);
  return cache[key]={image:c,anchor:(anchor-x0-minX)/c.width};
 }
 const clamp=x=>Math.min(1,Math.max(0,x));const ease=x=>1-(1-clamp(x))**3;
 const smooth=(a,b,x)=>{let p=clamp((x-a)/(b-a));return p*p*(3-2*p)};
 function tri(g,img,s,d){
  const [a,b,c]=s,[A,B,C]=d,den=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);if(Math.abs(den)<1e-7)return;
  const solve=values=>[(values[0]*(b.y-c.y)+values[1]*(c.y-a.y)+values[2]*(a.y-b.y))/den,(values[0]*(c.x-b.x)+values[1]*(a.x-c.x)+values[2]*(b.x-a.x))/den,(values[0]*(b.x*c.y-c.x*b.y)+values[1]*(c.x*a.y-a.x*c.y)+values[2]*(a.x*b.y-b.x*a.y))/den];
  const [aa,cc,ee]=solve([A.x,B.x,C.x]),[bb,dd,ff]=solve([A.y,B.y,C.y]);
  const centre={x:(A.x+B.x+C.x)/3,y:(A.y+B.y+C.y)/3};const expand=P=>{const dx=P.x-centre.x,dy=P.y-centre.y,l=Math.hypot(dx,dy)||1;return{x:P.x+dx/l*.65,y:P.y+dy/l*.65}};const a1=expand(A),b1=expand(B),c1=expand(C);g.save();g.beginPath();g.moveTo(a1.x,a1.y);g.lineTo(b1.x,b1.y);g.lineTo(c1.x,c1.y);g.closePath();g.clip();g.transform(aa,bb,cc,dd,ee,ff);g.drawImage(img,0,0);g.restore();
 }
 function deform(g,src,x,bottom,height,params){
  const im=src.image,w=im.width,h=im.height,scale=height/h;
  g.save();g.translate(x,bottom);g.rotate(params.tilt||0);g.scale(scale*(params.scaleX||1),scale*(params.scaleY||1));g.translate(-src.anchor*w,-h);
  const nx=10,ny=14,verts=[];
  for(let r=0;r<=ny;r++){verts[r]=[];for(let c=0;c<=nx;c++){
   let u=c/nx,v=r/ny,xx=u*w,yy=v*h;
   const head=1-smooth(.43,.58,v),angle=params.head||0;
   const hx=src.anchor*w,hy=.52*h,dx=xx-hx,dy=yy-hy;
   xx+=(dx*Math.cos(angle)-dy*Math.sin(angle)-dx)*head;yy+=(dx*Math.sin(angle)+dy*Math.cos(angle)-dy)*head;
   const left=(1-smooth(.25,.43,u))*smooth(.44,.56,v)*(1-smooth(.72,.83,v));
   const right=smooth(.58,.78,u)*smooth(.42,.54,v)*(1-smooth(.74,.86,v));
   yy+=left*(params.left||0)*h+right*(params.right||0)*h;
   xx+=left*(params.leftX||0)*w+right*(params.rightX||0)*w;
   const tail=smooth(.74,.95,u)*smooth(.62,.75,v)*(1-smooth(.92,1,v));xx+=tail*Math.sin(params.tail||0)*w*.025;
   const breathe=Math.sin(params.breath||0)*.004;yy+=(v-.85)*h*breathe*smooth(.42,.55,v);
   verts[r][c]={x:xx,y:yy};
  }}
  g.imageSmoothingEnabled=true;
  for(let r=0;r<ny;r++)for(let c=0;c<nx;c++){
   const a={x:c/nx*w,y:r/ny*h},b={x:(c+1)/nx*w,y:r/ny*h},d={x:c/nx*w,y:(r+1)/ny*h},cc={x:(c+1)/nx*w,y:(r+1)/ny*h};
   tri(g,im,[a,b,cc],[verts[r][c],verts[r][c+1],verts[r+1][c+1]]);tri(g,im,[a,cc,d],[verts[r][c],verts[r+1][c+1],verts[r+1][c]]);
  }
  g.restore();
 }
 const options={
 explain:{sheet:'teacher',row:6,col:1,title:'讲解',description:'戴圆眼镜、拿教鞭；从侧边走近图解，先转头再指向，不使用摊手动作。',use:'概念引入、图解旁的解释'},
 remember:{sheet:'expression',row:5,col:1,title:'帮助记忆',description:'从侧下方跳到要点旁，抬爪提醒、点头，依次标出三个记忆点。',use:'知识点recap、记忆提示'},
 inspire:{sheet:'expression',row:2,col:3,title:'发现灵感',description:'先微微歪头，身体收一点；发现答案时轻跳，星点向外展开后收住。',use:'提出新思路、找到解决方法'},
 emphasize:{sheet:'expression',row:5,col:5,title:'强调重点',description:'靠近重点，身体前倾一次，指向关键词；重点落定后留出阅读时间。',use:'关键定义、重要区别'},
 warn:{sheet:'expression',row:3,col:2,title:'警告提醒',description:'从右侧进入，停步、抬掌，轻轻后撤；警示图形只出现一次。',use:'易错点、边界条件'}
 };
 let teacherCache=null;
 function teacher(){
  if(teacherCache)return teacherCache;
  // Keep the original pointer pose, including its one original head. Glasses
  // are a separate accessory; never place another full head on top of it.
  const body=original('teacher',6,1),im=document.createElement('canvas');im.width=body.image.width;im.height=body.image.height;
  const cg=im.getContext('2d',{willReadFrequently:true});cg.drawImage(body.image,0,0);
  const pix=cg.getImageData(0,0,im.width,im.height).data;
  const eyes=[{x:0,y:0,n:0},{x:0,y:0,n:0}],split=body.anchor*im.width;
  for(let y=0;y<im.height*.55;y++)for(let x=0;x<im.width;x++){
   const k=(y*im.width+x)*4,r=pix[k],g=pix[k+1],b=pix[k+2];
   if(pix[k+3]>150&&g>r+15&&g>b+10&&g>55){const eye=eyes[x<split?0:1];eye.x+=x;eye.y+=y;eye.n++;}
  }
  const left=eyes[0].n?{x:eyes[0].x/eyes[0].n,y:eyes[0].y/eyes[0].n}:{x:im.width*.34,y:im.height*.33};
  const right=eyes[1].n?{x:eyes[1].x/eyes[1].n,y:eyes[1].y/eyes[1].n}:{x:im.width*.64,y:im.height*.33};
  const radius=Math.max(9,Math.abs(right.x-left.x)*.43),stroke=1.65;
  cg.strokeStyle='#111';cg.lineWidth=stroke;cg.lineCap='round';
  for(const eye of [left,right]){cg.beginPath();cg.ellipse(eye.x,eye.y,radius,radius*1.03,0,0,Math.PI*2);cg.stroke();}
  cg.beginPath();cg.moveTo(left.x+radius*.91,left.y-1);cg.quadraticCurveTo((left.x+right.x)/2,Math.min(left.y,right.y)-4,right.x-radius*.91,right.y-1);cg.stroke();
  cg.beginPath();cg.moveTo(left.x-radius,left.y-1);cg.lineTo(left.x-radius-4,left.y-3);cg.moveTo(right.x+radius,right.y-1);cg.lineTo(right.x+radius+4,right.y-3);cg.stroke();
  return teacherCache={image:im,anchor:body.anchor};
 }

 return {teacher,options,draw(g,id,t){const o=options[id],src=id==='explain'?teacher():original(o.sheet,o.row,o.col),en=ease(t/.85),active=smooth(.8,1.4,t),end=1-smooth(4.7,5.7,t),beat=Math.sin(Math.min(1,Math.max(0,(t-1)/2.8))*Math.PI),p={breath:t*3,tail:t*2};
  let x=200,bottom=420,height=245;
  if(id==='explain'){x=-170+en*375;bottom=420-Math.sin(en*Math.PI)*60;p.tilt=.015*Math.sin(t*2);p.head=.04*beat;p.left=-.02*Math.sin(t*3)*active*end;p.right=-.024*Math.sin(t*3+.9)*active*end;p.rightX=.01*beat;}
  if(id==='remember'){x=420-en*135;bottom=650-en*230-Math.sin(en*Math.PI)*70;p.head=.05*Math.sin((t-1)*4)*active*end;p.right=-.025*beat;p.tilt=-.01*beat;}
  if(id==='inspire'){x=225;bottom=420-Math.sin(smooth(1.6,2.4,t)*Math.PI)*38;p.head=-.06*(1-smooth(1.4,2,t))+.025*beat;p.scaleY=1-.025*Math.sin(smooth(1.4,2,t)*Math.PI);p.right=-.03*smooth(1.7,2.6,t)*end;p.tilt=.025*beat;}
  if(id==='emphasize'){x=-120+en*330;bottom=420;p.tilt=.035*beat;p.head=.03*beat;p.right=-.04*beat;p.rightX=.025*beat;p.scaleX=1+.015*beat;}
  if(id==='warn'){x=760-en*345;bottom=420;p.tilt=-.025*beat;p.right=-.035*beat;p.rightX=.02*beat;p.head=-.015*beat;}
  const exit=ease((t-5.2)/.8);if(id==='remember')bottom+=exit*310;else x+=(id==='warn'?1:-1)*exit*460;deform(g,src,x,bottom,height,p);return {x,bottom,height};},original,deform};
};
