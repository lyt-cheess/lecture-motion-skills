import { drawEffect } from '../../motion/effects.mjs';
import { buildCourse, toSrt } from './course.mjs';

const $ = id => document.getElementById(id);
const ctx = $('canvas').getContext('2d');
const controls = { details: $('detail'), subtitles: $('subtitles') };
const input = window.LECTURE_MOTION_INPUT ?? {};
const query = new URLSearchParams(location.search);
document.body.classList.toggle('capture', query.has('render'));
controls.details.checked = query.get('detail') !== '0';
controls.subtitles.checked = query.get('captions') !== '0';
let course, background, configBase, applied, actor;
let actorReady;
let time = 0;
let start = 0;
let animation = 0;
let loadId = 0;

function captionAt(t) {
  return course.cues.find(cue => t >= cue.start && t < cue.end);
}
function render(seconds) {
  const duration = course.duration;
  const t = Math.max(0, Math.min(duration, Math.floor(seconds * 1000 + .00001)));
  const sample = Math.min(t, duration - .001);
  const shot = course.shots.find(shot => sample < shot.end);
  const progress = (sample - shot.start) / (shot.end - shot.start);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = course.theme.background;
  ctx.fillRect(0, 0, 540, 720);
  if (background) {
    const scale = Math.max(540 / background.width, 720 / background.height);
    ctx.globalAlpha = course.backdrop.opacity ?? .22;
    ctx.drawImage(background, (540 - background.width * scale) / 2, (720 - background.height * scale) / 2, background.width * scale, background.height * scale);
    ctx.globalAlpha = 1;
  }
  drawEffect(ctx, shot.effect, progress, shot.params, { theme: course.theme, detail: controls.details.checked });
  if (actor && shot.character) {
    ctx.save();
    ctx.translate(340, 437);
    ctx.scale(.33, .33);
    actor.draw(ctx, shot.character, Math.min(6, (sample - shot.start) / 1000));
    ctx.restore();
  }
  const caption = controls.subtitles.checked && captionAt(sample);
  if (caption) {
    ctx.font = '650 21px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffffee';
    ctx.fillRect(15, 641, 510, 39);
    ctx.fillStyle = '#000000';
    ctx.fillText(caption.text, 270, 662);
  }
}
function pause() {
  cancelAnimationFrame(animation);
  animation = 0;
  $('play').textContent = '播放';
}
function update(seconds) {
  time = Math.min(seconds, window.DUR);
  window.render(time);
  $('seek').value = time;
  $('time').value = time.toFixed(1) + ' 秒';
}
function tick(now) {
  update((now - start) / 1000);
  if (time >= window.DUR) pause();
  else animation = requestAnimationFrame(tick);
}

function loadActor() {
  actorReady ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../../../xixi-motion/actor.js', import.meta.url).href;
    script.onload = () => window.createActor().then(resolve, reject);
    script.onerror = reject;
    document.head.append(script);
  });
  return actorReady;
}

async function apply(raw, base, id) {
  const next = buildCourse(raw);
  await document.fonts.ready;
  ctx.font = '650 21px system-ui, sans-serif';
  const tooWide = next.cues.find(({text}) => ctx.measureText(text).width > 485);
  if (tooWide) throw Error('字幕超出单行安全区，请拆句。' + tooWide.text);
  let image;
  if (next.backdrop.image) {
    image = new Image();
    image.src = new URL(next.backdrop.image, base).href;
    await image.decode().catch(() => { throw Error('无法读取背景图片。'); });
  }
  const needsActor = next.shots.some(shot => shot.character);
  const renderer = needsActor ? await loadActor().catch(() => null) : null;
  if (id !== loadId) return;
  pause();
  actor = renderer;
  $('error').textContent = needsActor && !actor ? '未找到曦曦动作组件，预览继续播放画面与字幕。' : '';
  $('config').value = JSON.stringify(raw, null, 2);
  $('course').textContent = next.title;
  configBase = base;
  applied = raw;
  course = next;
  background = image;
  window.DUR = course.duration / 1000;
  window.render = render;
  $('seek').max = window.DUR;
  update(0);
  window.READY = true;
}
async function loadPreset(name, id) {
  const url = new URL('../examples/' + name + '.json', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw Error('无法加载示例配置。');
  await apply(await response.json(), url, id);
}
async function attempt(action) {
  const id = ++loadId;
  try { await action(id); }
  catch (error) { if (id === loadId) $('error').textContent = error.message; }
}

$('play').onclick = () => {
  if (!course) return;
  if (animation) return pause();
  if (time >= window.DUR) update(0);
  start = performance.now() - time * 1000;
  $('play').textContent = '暂停';
  animation = requestAnimationFrame(tick);
};
$('seek').oninput = () => {
  if (!course) return;
  update(Number($('seek').value));
  if (animation) start = performance.now() - time * 1000;
};
for (const input of Object.values(controls)) input.onchange = () => { if (course) render(time); };
$('preset').onchange = () => attempt(id => loadPreset($('preset').value, id));
$('apply').onclick = () => attempt(id => apply(JSON.parse($('config').value), configBase ?? document.baseURI, id));
function download(contents, type, name) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('srt').onclick = () => {
  if (course) download(toSrt(course.cues), 'text/plain;charset=utf-8', 'course.srt');
};
$('save').onclick = () => {
  if (applied) download(JSON.stringify(applied, null, 2) + '\n', 'application/json', 'course.json');
};
const requested = query.get('sample');
const preset = ['attention','pipeline'].includes(requested) ? requested : 'v3-style';
$('preset').value = preset;
await attempt(id => input.course ? apply(input.course, document.baseURI, id) : loadPreset(preset, id));
