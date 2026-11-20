(async()=>{
 const actor=await createActor(),canvas=document.getElementById('scene'),g=canvas.getContext('2d');let selected='explain',t=0,playing=true,last=0;
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
 function text(s,x,y,size=26){g.fillStyle='#000';g.textAlign='center';g.textBaseline='middle';g.font=`650 ${size}px "PingFang SC",sans-serif`;g.fillText(s,x,y);}
 function path(points,p,color='#8054e8',width=3){g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();for(let i=0;i<points.length*p;i++){let q=points[i];if(!q)break;if(i)g.lineTo(...q);else g.moveTo(...q);}g.stroke();}
 function circle(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
 window.ACTION_DRAW=function(id,time){
  g.clearRect(0,0,640,500);g.fillStyle='white';g.fillRect(0,0,640,500);
  const p=ease((time-1)/.6)*(1-ease((time-5.2)/.8));g.save();g.globalAlpha=p;
  if(id==='explain'){
   ['Q','K','V'].forEach((s,i)=>{const en=ease((time-1.25-i*.2)/.5);g.save();g.globalAlpha*=en;g.fillStyle=i===1?'#e8f8ed':'#eee6ff';g.beginPath();g.roundRect(355+i*75,190+(1-en)*16,58,68,10);g.fill();text(s,384+i*75,224+(1-en)*16,30);g.restore();});
   if(time>2.4){path([[384,280],[459,280],[534,280]],ease((time-2.4)/.5),'#86dfa3');text('同一组输入，不同投影',455,325,21);}
  }
  if(id==='remember'){
   ['谁发起查询？','读取谁的信息？','允许看哪些位置？'].forEach((s,i)=>{const en=ease((time-1.1-i*.7)/.5);g.save();g.globalAlpha*=en;circle(393,168+i*66,13,'#86dfa3');text('✓',393,168+i*66,18);text(s,505,168+i*66,21);g.restore();});
  }
  if(id==='inspire'){
   const en=ease((time-1.8)/.5);g.save();g.globalAlpha*=en;text('原来如此！',465,170-(1-en)*20,34);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;const r=30+en*28;path([[450+Math.cos(a)*r,250+Math.sin(a)*r],[450+Math.cos(a)*(r+12),250+Math.sin(a)*(r+12)]],1,'#8054e8',4);}circle(450,250,21,'#86dfa3');g.restore();
  }
  if(id==='emphasize'){
   text('同一条序列',463,215,34);const en=ease((time-1.65)/.6);path([[360,252],[570,252]],en,'#8054e8',7);if(time>2.5)text('这是自注意力的关键',465,312,21);
  }
  if(id==='warn'){
   const en=ease((time-1)/.45);g.save();g.translate(195,200);g.scale(.8+.2*en,.8+.2*en);g.fillStyle='#e8f8ed';g.strokeStyle='#000';g.lineWidth=3;g.beginPath();g.moveTo(0,-40);g.lineTo(43,36);g.lineTo(-43,36);g.closePath();g.fill();g.stroke();text('!',0,9,38);g.restore();text('别把“匹配”',195,297,26);text('当成直接拼接单词',195,337,23);
  }
  g.restore();actor.draw(g,id,time);window.ACTION_STATE={id,time,continuous_pose:true};
 };
 function choose(id){selected=id;t=0;const o=actor.options[id];document.getElementById('name').textContent=o.title;document.getElementById('description').textContent=o.description;document.getElementById('use').textContent=o.use;for(const b of document.querySelectorAll('nav button'))b.setAttribute('aria-pressed',b.dataset.id===id);window.render(0);}
 for(const [id,o]of Object.entries(actor.options)){const b=document.createElement('button');b.textContent=o.title;b.dataset.id=id;b.onclick=()=>choose(id);document.getElementById('choices').append(b);}
 window.render=time=>{t=time;ACTION_DRAW(selected,t);document.getElementById('seek').value=t;document.getElementById('time').value=t.toFixed(1)+'秒';};window.ACTION_SELECT=choose;window.DUR=6;
 const btn=document.getElementById('play');btn.onclick=()=>{playing=!playing;btn.textContent=playing?'暂停':'播放';last=performance.now();};document.getElementById('seek').oninput=e=>{playing=false;btn.textContent='播放';window.render(Number(e.target.value));};document.getElementById('again').onclick=()=>{t=0;playing=true;btn.textContent='暂停';last=performance.now();};
 const renderOnly=new URLSearchParams(location.search).has('render');choose(selected);window.READY=true;
 function tick(now){if(playing){if(last)t=(t+(now-last)/1000)%6;window.render(t);}last=now;requestAnimationFrame(tick);}if(!renderOnly)requestAnimationFrame(tick);
})().catch(e=>{window.SCENE_ERROR=e.message;console.error(e);});
