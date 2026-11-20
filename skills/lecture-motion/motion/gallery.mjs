import { DEFAULT_THEME, drawEffect, recipes } from './effects.mjs';
import { DUR, SHOTS } from '../examples/transformer-v3/timeline.js';

const $ = id => document.getElementById(id);
const ctx = $('canvas').getContext('2d');
const ids = {
  course: ['tokens', 'projection', 'match', 'weights', 'vector-merge', 'focus', 'carry-cut'],
  basics: ['move', 'split', 'merge', 'matrix', 'mask', 'compare'],
};
const purposes = [
  '原始曦曦入场，英文词错峰进入，随后揭开翻译目标。',
  '同一排英文词就位，词元与输入向量逐列连接。',
  '四个向量聚到源节点，再经三条投影通路长成矩阵。',
  '查询 Q 沿曲线找各位置的 K，分数和实现逐步显现。',
  '维持同列位置，将原分数转成可比较的权重柱。',
  '向量随各自的权重沿路汇成一个输出。',
  '曦曦戴眼镜持教鞭，图解回到同一序列的三路投影。',
  '曦曦回到画面中央，停留方便看清告别动作。',
];

let mode = 'original';
let active = 0;
let progress = 0;
let start;
let playing = true;
let iframeErrorShown = false;
const shot = () => mode === 'original' ? SHOTS[active] : null;
const span = () => shot() ? shot().t1 - shot().t0 : 5.6;
function render() {
  if (mode === 'original') {
    const source = $('original').contentWindow;
    if (source.READY) {
      source.render(Math.min(DUR - .001, shot().t1 - .001, shot().t0 + progress * span()));
    } else if (source.SCENE_ERROR && !iframeErrorShown) {
      iframeErrorShown = true;
      $('error').textContent = 'A 版原镜头载入失败。请让曦曦和配音模块与 Lecture Motion 保持同一级。';
    }
  } else {
    const id = ids[mode][active];
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = DEFAULT_THEME.background;
    ctx.fillRect(0, 0, 540, 720);
    drawEffect(ctx, id, progress, recipes[id].params, { detail: $('detail').checked });
  }
  $('seek').value = progress;
  $('time').value = (progress * span()).toFixed(1) + ' 秒';
}
function tick(now) {
  if (playing) {
    start ??= now;
    if (mode !== 'original' || $('original').contentWindow.READY) {
      progress = ((now - start) % ((span() + .6) * 1000)) / (span() * 1000);
      progress = Math.min(1, progress);
    } else start = now;
    render();
  }
  requestAnimationFrame(tick);
}
function select(index) {
  active = index;
  progress = 0;
  start = performance.now();
  const id = ids[mode]?.[index];
  const original = shot();
  $('selected').textContent = original?.id ?? recipes[id].name;
  $('purpose').textContent = original ? purposes[index] : recipes[id].purpose;
  $('recipe').textContent = id ? JSON.stringify({ effect: id, seconds: 5.6, params: recipes[id].params }, null, 2) : '';
  for (const [i, button] of Array.from($('recipes').children).entries()) button.setAttribute('aria-pressed', i === index);
  render();
}
function show(nextMode) {
  mode = nextMode;
  $('original').hidden = mode !== 'original';
  $('canvas').hidden = mode === 'original';
  $('component').hidden = mode === 'original';
  $('error').textContent = '';
  iframeErrorShown = false;
  for (const button of $('modes').children) button.setAttribute('aria-pressed', button.dataset.mode === mode);
  const names = mode === 'original' ? SHOTS.map(x => x.id) : ids[mode].map(id => recipes[id].name);
  $('recipes').replaceChildren(...names.map((name, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.onclick = () => select(i);
    return button;
  }));
  select(0);
}
for (const button of $('modes').children) button.onclick = () => show(button.dataset.mode);
$('play').onclick = () => {
  playing = !playing;
  if (playing) start = performance.now() - progress * span() * 1000;
  $('play').textContent = playing ? '暂停' : '播放';
};
$('seek').oninput = () => {
  progress = Number($('seek').value);
  start = performance.now() - progress * span() * 1000;
  render();
};
$('detail').onchange = render;
show('original');
requestAnimationFrame(tick);
