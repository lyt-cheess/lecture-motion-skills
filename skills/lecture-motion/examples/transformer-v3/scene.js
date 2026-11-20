/* Original PNGs are preserved. All source-window selection and motion is computed
   from absolute time; no generated replacement character or accumulated state. */
(async () => {
 const config=await (await fetch('config.json')).json();
 const rigActor=await createActor();
 const cv=document.getElementById('scene'),g=cv.getContext('2d');
 const W=1080,H=1440,C=config.theme,T=window.COURSE_TIMING.cues;
 const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
 const mix=(a,b,p)=>a+(b-a)*p;
 const ease=x=>1-Math.pow(1-clamp(x),3);
 const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
 const prog=(t,a,d=.6)=>ease((t-a)/d);
 const fade=(t,a,b,d=.35)=>clamp((t-a)/d)*clamp((b-t)/d);
 const spring=(t,a,d=.65)=>{const p=clamp((t-a)/d);return p===1?1:1-Math.exp(-7*p)*Math.cos(10*p)};
 const XY=[180,420,660,900],words=['I','love','deep','learning'];
 const poses={};
 const load=async src=>{const i=new Image();i.src=src;await i.decode();return i};
 const sheets=Object.fromEntries(await Promise.all(['classroom','expression'].map(async k=>[k,await load(config.character[k])])));
 let backdrop=config.background.file?await load(config.background.file):null;
 // Largest ink-connected component isolates the cat from detached punctuation
 // and keeps the unmodified source pixels. Anchor the head at the column centre.
 const xs=[90,312,537,762,987,1212,1450],ys=[0,155,310,465,620,765,895,1024],centres=[200,426,650,875,1100,1325];
 function measureFrames(img,key){
  const tmp=document.createElement('canvas');tmp.width=1536;tmp.height=1024;
  const tc=tmp.getContext('2d',{willReadFrequently:true});tc.drawImage(img,0,0);
  const pixels=tc.getImageData(0,0,1536,1024).data;
  const out=[];
  for(let r=0;r<7;r++){
   out[r]=[];
   for(let col=0;col<6;col++){
    const x0=xs[col],y0=ys[r],ww=xs[col+1]-x0,hh=ys[r+1]-y0;
    const seen=new Uint8Array(ww*hh),queue=new Int32Array(ww*hh);let best=null;
    function ink(idx){const x=idx%ww+x0,y=Math.floor(idx/ww)+y0,p=(y*1536+x)*4;return pixels[p+3]>100&&Math.min(pixels[p],pixels[p+1],pixels[p+2])<218;}
    for(let n=0;n<ww*hh;n++){
     if(seen[n]||!ink(n))continue;
     let start=0,end=1;queue[0]=n;seen[n]=1;let minX=ww,minY=hh,maxX=0,maxY=0;
     while(start<end){const k=queue[start++],x=k%ww,y=Math.floor(k/ww);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      const ns=[];if(x>0)ns.push(k-1);if(x<ww-1)ns.push(k+1);if(y>0)ns.push(k-ww);if(y<hh-1)ns.push(k+ww);
      for(const j of ns)if(!seen[j]){seen[j]=1;if(ink(j))queue[end++]=j;}
     }
     if(!best||end>best.count)best={count:end,x:x0+minX,y:y0+minY,w:maxX-minX+1,h:maxY-minY+1};
    }
    if(!best||best.h<70)throw Error(`Cannot locate original character ${key}:${r}:${col}`);
    const pad=4,right=Math.min(x0+ww,best.x+best.w+pad),bottom=Math.min(y0+hh,best.y+best.h+pad);best.x=Math.max(x0,best.x-pad);best.y=Math.max(y0,best.y-pad);best.w=right-best.x;best.h=bottom-best.y;best.anchor=centres[col];
    out[r][col]=best;
   }
  }
  return out;
 }
 for(const k of Object.keys(sheets))poses[k]=measureFrames(sheets[k],k);
 window.SPRITE_BOUNDS=poses;
 function txt(s,x,y,size=48,weight=650,align='center'){
  g.fillStyle=C.text;g.font=`${weight} ${size}px "PingFang SC","Microsoft YaHei",sans-serif`;g.textAlign=align;g.textBaseline='middle';g.fillText(s,x,y);
 }
 function line(x1,y1,x2,y2,color=C.primary,width=5,p=1){if(p<=0)return;g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(mix(x1,x2,clamp(p)),mix(y1,y2,clamp(p)));g.stroke();}
 function curve(x1,y1,x2,y2,p=1,color=C.primary,width=5,bend=0){
  if(p<=0)return;g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();
  for(let j=0;j<=Math.ceil(40*p);j++){const u=Math.min(p,j/40),x=mix(x1,x2,u)+Math.sin(u*Math.PI)*bend,y=mix(y1,y2,u);if(j===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();
 }
 function disk(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
 function pill(x,y,w,h,label='',fill=C.primary_soft,size=44,stroke=false){
  g.fillStyle=fill;g.beginPath();g.roundRect(x-w/2,y-h/2,w,h,Math.min(22,h/3));g.fill();if(stroke){g.lineWidth=2;g.strokeStyle=C.text;g.stroke();}if(label)txt(label,x,y,size);
 }
 function pop(t,a,x,y,draw){const p=spring(t,a);if(p<=0)return;g.save();g.translate(x,y+26*(1-prog(t,a)));g.scale(.85+.15*p,.85+.15*p);g.globalAlpha=prog(t,a,.25);draw();g.restore();}
 function vector(x,y,color=C.primary,scale=1,seed=0){g.save();g.translate(x,y);g.scale(scale,scale);for(let j=0;j<5;j++){g.globalAlpha=.5+j*.1;g.fillStyle=color;g.beginPath();const h=24+((j*13+seed*11)%40);g.roundRect(-44+j*19,-h/2,12,h,5);g.fill();}g.restore();}
 function cat(t,{x=540,bottom=1140,height=330,alpha=1,tilt=0,hop=0}={}){
  if(alpha<=0)return;
  const teaching=t>=29&&t<36,src=teaching?rigActor.teacher():rigActor.original('classroom',0,3);
  g.save();g.globalAlpha=alpha;
  rigActor.deform(g,src,x,bottom-hop,height,{tilt,head:Math.sin(t*2.3)*.018,right:Math.sin(t*4)*.018,left:0,tail:t*2,breath:t*3});
  g.restore();
 }
 const subtitles=window.COURSE_TIMING.captions;
 function english(t){
  const token=prog(t,8,.8),a=1-prog(t,12,.4);
  if(a<=0)return;
  g.save();g.globalAlpha=a;
  const opening=prog(t,1.3,.6);
  for(let i=0;i<4;i++){
   const p=spring(t,1.3+i*.12);if(p<=0)continue;
   const x=mix([150,330,560,820][i],XY[i],token),y=mix(430,460,token)+25*(1-prog(t,1.3+i*.12));
   g.save();g.globalAlpha*=clamp(p);g.translate(x,y);g.scale(.94+.06*p,.94+.06*p);
   if(token>0){g.globalAlpha*=token;pill(0,0,194,94,'',i===1?C.primary_soft:C.secondary_soft);g.globalAlpha/=token;}
   txt(words[i],0,0,mix(68,43,token),i===1?750:600);g.restore();
  }
  const zh=fade(t,3.4,8.4,.5);
  if(zh>0){g.save();g.globalAlpha*=zh;txt('我爱深度学习',540,665+20*(1-prog(t,3.4)),76,700);curve(540,500,540,590,prog(t,3,.5),C.primary,6,0);disk(540,595,8,C.primary);g.restore();}
  if(token>0){for(let i=0;i<4;i++){let p=spring(t,9+i*.12);if(p<=0)continue;g.save();g.globalAlpha*=clamp(p);line(XY[i],530,XY[i],640,C.primary,4,prog(t,9+i*.12));vector(XY[i],710+35*(1-prog(t,9+i*.12)),i===1?C.primary:C.secondary,1.3,i);g.restore();}
   const p=prog(t,10.3);g.save();g.globalAlpha*=p;txt('输入表示',540,880,43);txt('分词为教学示意 · 已加入位置信息',540,1230,27,500);g.restore();}
  g.restore();
 }
 function projections(t){
  const appear=prog(t,11.7,.5),zoom=prog(t,16.1,.8),out=1-prog(t,16.4,.35);
  if(appear<=0||out<=0)return;
  g.save();g.globalAlpha=appear*out;g.translate(540,680);g.scale(1+zoom*.17,1+zoom*.17);g.translate(-540,-680);
  // Four inputs converge to a persistent source; three distinct projections.
  for(let i=0;i<4;i++){const p=prog(t,12,.8);vector(mix(XY[i],440+i*67,p),mix(710,370,p),i===1?C.primary:C.secondary,1,i);}
  txt('同一组输入表示',540,265,44);
  for(let j=0;j<3;j++){
   const x=230+j*310,p=prog(t,12.3+j*.12,.7),labels=['Q','K','V'];
   curve(540,420,x,565,p,C.primary,5,(j-1)*25);
   pop(t,12.65+j*.12,x,625,()=>pill(0,0,170,98,'W'+labels[j],j===1?C.secondary_soft:C.primary_soft,50));
   line(x,690,x,735,C.primary,5,prog(t,13.6+j*.13,.6));
   pop(t,14+j*.13,x,805,()=>{txt(labels[j],0,0,104,750);});
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){const a=prog(t,14.4+row*.08+col*.035);g.save();g.globalAlpha*=a;g.fillStyle=j===1?C.secondary:C.primary;g.globalAlpha*=j===0?(row===1?.85:.2):.25+((row+col)%4)*.16;g.beginPath();g.roundRect(x-77+col*40,920+row*40,33,33,5);g.fill();g.restore();}txt('4 × 4',x,1120,28,600);
  }
  g.restore();
 }
 function matching(t){
  let a=prog(t,16.75,.35)*(1-prog(t,24.45,.25));if(a<=0)return;
  const weight=prog(t,22.05,.75),compress=prog(t,24.5,.5);
  g.save();g.globalAlpha=a;
  const qy=mix(350,290,weight);
  pop(t,16.85,540,qy,()=>{pill(0,0,220,110,'Q love',C.primary_soft,54);});
  for(let i=0;i<4;i++){
   const link=prog(t,18+i*.3,.55),ky=mix(660,505,weight);
   curve(540,qy+90,XY[i],ky-70,link,C.primary,4,-(i-1.5)*24);
   const active=t>=18+i*.3&&t<18+i*.3+.45;
   pop(t,17.3+i*.08,XY[i],ky,()=>pill(0,0,200,100,'K '+words[i],active?C.secondary:C.secondary_soft,36));
   let sp=prog(t,18.5+i*.3);
   if(sp>0){g.save();g.globalAlpha*=sp*(1-weight);txt(['2.77','2.20','1.39','0.00'][i],XY[i],840,54,700);g.restore();}
   if(link>0&&link<1){const u=link;disk(mix(540,XY[i],u),mix(qy+90,ky-70,u),9,C.primary);}
  }
  if(weight>0){g.save();g.globalAlpha*=weight;
   pop(t,22.2,540,715,()=>pill(0,0,580,100,'α = softmax(s / √dₖ)',C.primary_soft,48));
   for(let i=0;i<4;i++){
    const p=prog(t,23.2+i*.12,.6),h=[170,128,85,43][i];
    g.fillStyle=i===1?C.primary:C.secondary;g.beginPath();g.roundRect(XY[i]-46,1025-h*p,92,Math.max(1,h*p),13);g.fill();
    txt((([.4,.3,.2,.1][i])*p).toFixed(1),XY[i],1100,46,700);
   }
   txt('教学示意 · dₖ = 4',540,1240,26,500);g.restore();
  }else if(t>20)txt('匹配分数为教学示意',540,1240,27,500);
  g.restore();
 }
 function aggregate(t){
  const a=prog(t,24.65,.35)*(1-prog(t,28.4,.45));if(a<=0)return;
  g.save();g.globalAlpha=a;
  for(let i=0;i<4;i++){
   const p=prog(t,25+i*.1,.65),y=mix(1025,470,p),w=[.4,.3,.2,.1][i];
   pop(t,24.8+i*.09,XY[i],400,()=>pill(0,0,200,96,'V '+words[i],C.secondary_soft,36));
   txt('× '+w.toFixed(1),XY[i],560,46);
   vector(XY[i],670,C.primary,1.3,i);
   const m=prog(t,26+i*.12,1.2);
   curve(XY[i],730,540,1015,m,C.primary,3+w*16,(i-1.5)*35);
   if(m>0&&m<1){const u=m;g.save();g.translate(mix(XY[i],540,u)+Math.sin(u*Math.PI)*(i-1.5)*35,mix(730,1015,u));vector(0,0,C.primary,.5+w,i);g.restore();}
  }
  pop(t,27.25,540,1090,()=>{pill(0,0,650,120,'o_love：加权后的表示',C.primary_soft,44);});

  g.restore();
 }
 function recap(t){
  const a=prog(t,29,.45)*(1-prog(t,35.6,.3));if(a<=0)return;
  g.save();g.globalAlpha=a;
  txt('同一条序列',570,350,66,750);
  const inputs=prog(t,29.2,.7);for(let i=0;i<4;i++)vector(440+i*80,450,C.primary,.6,i);
  for(let j=0;j<3;j++){
   const x=290+j*250;
   curve(570,500,x,635,prog(t,30+j*.15,.6),C.primary,6,(j-1)*20);
   pop(t,30.5+j*.15,x,720,()=>{pill(0,0,170,130,['Q','K','V'][j],j===1?C.secondary_soft:C.primary_soft,84);});
  }
  if(t>32)txt('不同的投影',650,920,46,650);
  const stamp=prog(t,34.3,.5);if(stamp>0){g.save();g.globalAlpha*=stamp;txt('自注意力',710,1080,66,750);g.restore();}
  g.restore();
 }
 function character(t){
  if(t<8.3){
   const entry=prog(t,.12,.75),exit=prog(t,7.25,.85),hop=entry<1?Math.sin(entry*Math.PI)*155:Math.max(0,Math.sin((t-2)*2.8))*5;
   const x=mix(-260,520,entry)-exit*780,bottom=1130;
   cat(t,{x,bottom,height:330,row:0,frames:t<1.1?[0,1,2]:[3,4,5,4,3,2,3,4],start:t<1.1?.12:1.1,fps:4,loop:t>=1.1,alpha:Math.min(1,entry*3),hop,tilt:Math.sin(t*4)*.015*(1-exit)});
  }
  if(t>=29&&t<36){
   const en=prog(t,29,.7),out=prog(t,35.5,.45),bottom=1180+((1-en)*320),hop=Math.sin(en*Math.PI)*90;
   const row=t<30.4?2:5,frames=t<30.4?[0,1,2,3,4,5]:[1,2,3,4,5],start=t<30.4?29:30.4;
   cat(t,{x:mix(180,250,en)-out*500,bottom,height:245,row,frames,start,fps:t<30.4?4:1.2,alpha:en,hop});
  }
  if(t>=36){
   const en=prog(t,36,.65),wave=t<38.6;
   cat(t,{x:mix(200,530,en),bottom:1170,height:mix(245,350,en),row:wave?0:6,frames:wave?[2,3,4,5,4,3,4,5]:[3,4],start:wave?36:38.6,fps:wave?4:1.2,tilt:Math.sin((t-36)*5)*.018,alpha:en});
   pop(t,36.3,540,450,()=>txt('下节课再见！',0,0,82,750));
  }
 }
 function codePanel(t,start,end,rows,y=1045){
  const a=prog(t,start,.3)*(1-prog(t,end,.25));if(a<=0)return;
  g.save();g.globalAlpha=a;g.fillStyle=C.secondary_soft;g.beginPath();g.roundRect(125,y-42,830,rows.length*52+32,18);g.fill();
  rows.forEach((r,i)=>{const p=prog(t,start+i*.15,.35);g.save();g.beginPath();g.rect(150,y-28+i*52,790,54);g.clip();g.translate(0,(1-p)*50);g.fillStyle='#000';g.font='600 34px "SFMono-Regular",Menlo,monospace';g.textAlign='left';g.textBaseline='middle';g.fillText(r,160,y+i*52);g.restore();});g.restore();
 }
 function formula(s,x,y,size=50){txt(s,x,y,size,700);}
 function math(parts,x,y,size=48){
  const widths=parts.map(([s,sub])=>{g.font=`${sub?'500':'600'} ${sub?size*.58:size}px "Times New Roman",serif`;return g.measureText(s).width;});
  let xx=x-widths.reduce((a,b)=>a+b,0)/2;g.fillStyle='#000';g.textAlign='left';g.textBaseline='middle';
  parts.forEach(([s,sub],i)=>{g.font=`${sub?'500':'600'} ${sub?size*.58:size}px "Times New Roman",serif`;g.fillText(s,xx,y+(sub?size*.28:0));xx+=widths[i];});
 }

 function rich(t){
  if(t>=13.8&&t<16.8){g.save();g.globalAlpha=prog(t,13.8,.3)*(1-prog(t,16.4,.3));
   const fs=['Q','K','V'];for(let i=0;i<3;i++){math([[fs[i]+' = XW',false],[fs[i],true]],230+i*310,1190,39);}txt('矩阵形状示意 · 暂看一个头',540,1250,26,500);
   g.restore();
  }
  if(t>=18.5&&t<22.05){
   codePanel(t,18.5,21.75,['q = Q[1]  # love','scores = q @ K.T'],1010);
   g.save();g.globalAlpha=prog(t,19.2,.3)*(1-prog(t,21.75,.3));math([['s',false],['i',true],[' = q',false],['love',true],[' · k',false],['i',true]],540,1162,51);g.restore();
  }
  if(t>=25&&t<28.85){g.save();g.globalAlpha=prog(t,25,.4)*(1-prog(t,28.4,.4));
   math([['o',false],['love',true],[' = Σ',false],['i',true],[' α',false],['i',true],[' v',false],['i',true]],540,245,66);
   g.fillStyle='#000';g.font='600 36px "SFMono-Regular",Menlo,monospace';g.textAlign='center';g.fillText('out = weights @ V',540,1200);
   g.restore();
  }
 }
 function drawBackground(){g.fillStyle=C.background;g.fillRect(0,0,W,H);if(backdrop){g.save();g.globalAlpha=config.background.opacity??1;const s=Math.max(W/backdrop.width,H/backdrop.height);g.drawImage(backdrop,(W-backdrop.width*s)/2,(H-backdrop.height*s)/2,backdrop.width*s,backdrop.height*s);g.restore();}}
 window.CAPTION_METRICS=[];
 window.DUR=T.end;
 window.render=(time)=>{
  const t=clamp(Number(time),0,T.end-.00001);g.save();drawBackground();
  english(t);projections(t);matching(t);aggregate(t);recap(t);rich(t);character(t);
  const sub=subtitles.find(s=>t>=s[0]&&t<s[1]);
  if(sub&&sub[2]){const phrase=sub[2];const size=42;g.font=`600 ${size}px "PingFang SC","Microsoft YaHei",sans-serif`;const width=g.measureText(phrase).width;
   txt(phrase,540,1335,size,600);window.LAST_CAPTION={text:phrase,width,size,single_line:true};
  }else window.LAST_CAPTION=null;
  g.restore();window.CURRENT_TIME=t;
 };
 await document.fonts.ready;window.render(0);window.READY=true;
 window.ANIMATIC_INFO={version:'v3',audio:false,character_source:'original_user_png_pointer_and_glasses',frame:[W,H],duration:T.end,captions:'single_line_42px',timing:'provisional'};
})().catch(error=>{window.SCENE_ERROR=error.message;console.error(error);});
