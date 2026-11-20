import { DEFAULT_THEME, recipes } from '../../motion/effects.mjs';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const short = value => typeof value === 'string' && value.trim().length > 0 && [...value].length <= 18;
const labels = (value, min, max) => Array.isArray(value) && value.length >= min && value.length <= max && value.every(short);
const color = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const numbers = (values, count, min, max) => Array.isArray(values) && values.length === count
  && values.every(n => Number.isFinite(n) && n >= min && n <= max);
const indexOf = (idx, options) => Number.isInteger(idx) && idx >= 0 && idx < options.length;
function paramsFit(effect, p) {
  switch (effect) {
    case 'tokens': return labels(p.tokens, 2, 5) && indexOf(p.focus, p.tokens);
    case 'projection': return labels(p.tokens, 2, 5) && labels(p.branches, 2, 4)
      && Number.isInteger(p.rows) && p.rows >= 2 && p.rows <= 5;
    case 'match': return short(p.query) && labels(p.keys, 2, 5) && numbers(p.scores, p.keys.length, -10000, 10000);
    case 'weights': return labels(p.labels, 2, 5) && numbers(p.scores, p.labels.length, -10000, 10000)
      && Number.isFinite(p.divisor) && p.divisor >= .01 && p.divisor <= 10000;
    case 'vector-merge': return short(p.output) && labels(p.labels, 2, 5) && numbers(p.weights, p.labels.length, 0, 100)
      && p.weights.some(x => x > 0);
    case 'focus': return labels(p.labels, 2, 4) && indexOf(p.focus, p.labels) && short(p.detail);
    case 'carry-cut': return short(p.carry) && labels(p.before, 2, 5) && labels(p.after, 2, 5);
    case 'move': return short(p.item) && labels(p.stops, 2, 5);
    case 'split': return short(p.source) && labels(p.branches, 2, 5);
    case 'merge': return short(p.output) && labels(p.inputs, 2, 5) && Array.isArray(p.weights)
      && p.weights.length === p.inputs.length && p.weights.every(x => Number.isFinite(x) && x >= 0 && x <= 100)
      && p.weights.some(x => x > 0);
    case 'matrix': return labels(p.rows, 2, 5) && labels(p.columns, 2, 5)
      && ['row','column'].includes(p.axis) && Number.isInteger(p.focus) && p.focus >= 0
      && p.focus < (p.axis === 'row' ? p.rows : p.columns).length;
    case 'mask': return short(p.query) && labels(p.targets, 2, 5)
      && Number.isInteger(p.allowed) && p.allowed >= 1 && p.allowed < p.targets.length
      && (p.blockedLabel === '' || short(p.blockedLabel));
    case 'compare': return labels(p.items, 2, 4);
    default: return false;
  }
}
const millis = seconds => Math.round(seconds * 1000);
export function buildCourse(config) {
  if (!isRecord(config) || typeof config.title !== 'string' || !config.title.trim()) {
    throw Error('课程配置需要一个标题 title。');
  }
  if (!Array.isArray(config.shots) || !config.shots.length) throw Error('shots 至少需要一个镜头。');
  if (config.theme !== undefined && !isRecord(config.theme)) throw Error('theme 必须是对象。');
  const theme = { ...DEFAULT_THEME };
  for (const name of Object.keys(theme)) {
    if (config.theme?.[name] === undefined) continue;
    if (!color(config.theme[name])) throw Error('theme.' + name + ' 需要六位十六进制颜色。');
    theme[name] = config.theme[name];
  }
  const backdrop = config.background ?? {};
  if (!isRecord(backdrop) || (backdrop.image !== undefined && typeof backdrop.image !== 'string')
      || (backdrop.opacity !== undefined && !(Number.isFinite(backdrop.opacity) && backdrop.opacity >= 0 && backdrop.opacity <= 1))) {
    throw Error('background 需要图片路径 image 或 0 至 1 的 opacity。');
  }
  const cues = [];
  let duration = 0;
  const shots = config.shots.map((shot, i) => {
    const number = i + 1;
    if (!isRecord(shot) || !Object.hasOwn(recipes, shot.effect)) throw Error('镜头 ' + number + ' 的 effect 无效。');
    if (!Number.isFinite(shot.seconds) || shot.seconds < .5 || shot.seconds > 90) {
      throw Error('镜头 ' + number + ' 的 seconds 需在 0.5–90 秒之间。');
    }
    if (shot.params !== undefined && !isRecord(shot.params)) throw Error('镜头 ' + number + ' 的 params 必须是对象。');
    const params = { ...recipes[shot.effect].params, ...shot.params };
    if (!paramsFit(shot.effect, params)) throw Error('镜头 ' + number + ' 的动效参数不符合镜头卡。');
    const start = duration;
    const span = millis(shot.seconds);
    duration += span;

    const captions = shot.captions ?? [];
    if (!Array.isArray(captions)) throw Error('镜头 ' + number + ' 的 captions 必须是数组。');
    let previous = -1;
    captions.forEach((cue, j) => {
      if (!isRecord(cue) || !Number.isFinite(cue.at) || typeof cue.text !== 'string' || /[\r\n]/.test(cue.text) || !cue.text.trim()) {
        throw Error('镜头 ' + number + ' 的第 ' + (j + 1) + ' 条字幕需要单行 text 和时间 at。');
      }
      const at = millis(cue.at);
      if (at <= previous || at < 0 || at >= span) throw Error('镜头 ' + number + ' 的字幕时间须递增且位于本镜头内。');
      if (j > 0) cues.at(-1).end = start + at;
      previous = at;
      cues.push({ start: start + at, end: duration, text: cue.text });
    });
    if (shot.character !== undefined && !['explain','remember','inspire','emphasize','warn'].includes(shot.character)) {
      throw Error('镜头 ' + number + ' 的 character 需为角色库中的动作名。');
    }
    return { start, end: duration, effect: shot.effect, params, character: shot.character };
  });
  return { title: config.title, theme, backdrop, shots, cues, duration };
}

function stamp(ms) {
  const parts = [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60];
  return parts.map(x => String(x).padStart(2, '0')).join(':') + ',' + String(ms % 1000).padStart(3, '0');
}
export function toSrt(cues) {
  return cues.map(({start, end, text}, i) => `${i + 1}\n${stamp(start)} --> ${stamp(end)}\n${text}\n`).join('\n');
}
