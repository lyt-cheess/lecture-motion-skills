export const DEFAULT_THEME = Object.freeze({
  background: '#ffffff', primary: '#6943c8', primarySoft: '#eee5fa',
  secondary: '#267d55', secondarySoft: '#dff3e7',
});

export const recipes = {
  tokens: { name: '词元错峰入场', purpose: '整句文字落成等距词元，再逐词变成向量', params: { tokens: ['I','love','deep','learning'], focus: 1 } },
  projection: { name: '向量三路投影', purpose: '同一组表示收成源节点，分经投影展开矩阵', params: { tokens: ['I','love','deep','learning'], branches: ['Q','K','V'], rows: 4 } },
  match: { name: '查询逐项匹配', purpose: '带着查询沿线移动光点，依次点亮键与分数', params: { query: 'Q love', keys: ['K I','K love','K deep','K learning'], scores: [0.32,2.12,1.39,0.04] } },
  weights: { name: '分数变成权重', purpose: '在同一列把带符号的分数换成可比较的权重柱', params: { labels: ['I','love','deep','learning'], scores: [0,2.77,1.39,0], divisor: 2 } },
  'vector-merge': { name: '向量沿线汇总', purpose: '把每路带权向量运到汇合点，再落成输出', params: { labels: ['V₁','V₂','V₃','V₄'], weights: [.125,.5,.25,.125], output: 'O love' } },
  focus: { name: '推近定位', purpose: '先交代全景，再推近参与计算的目标', params: { labels: ['Q','K','V'], focus: 1, detail: 'Kᵀ' } },
  'carry-cut': { name: '同位交接', purpose: '保住对象位置和颜色，用前景运动遮住换场接点', params: { carry: 'X', before: ['A','B','C'], after: ['Q','K','V'] } },
  move: { name: '连续移动', purpose: '追踪同一对象经过两个处理位置', params: { item: 'X', stops: ['A', 'B', 'C'] } },
  split: { name: '分流', purpose: '一个来源产生多个结果', params: { source: 'X', branches: ['Q', 'K', 'V'] } },
  merge: { name: '加权汇流', purpose: '各路贡献沿各自路径汇成一个输出', params: { inputs: ['V₁', 'V₂', 'V₃'], weights: [.1, .3, .6], output: 'O' } },
  matrix: { name: '矩阵高亮', purpose: '逐行展开矩阵并定位一行或一列', params: { rows: ['Q₁','Q₂','Q₃'], columns: ['K₁','K₂','K₃'], focus: 1, axis: 'row' } },
  mask: { name: '因果遮罩', purpose: '截断未来路径并保留当前可用路径', params: { query: 'Q', targets: ['K₁','K₂','K₃','K₄'], allowed: 2, blockedLabel: 'α = 0' } },
  compare: { name: '并行与串行', purpose: '用相同的时间刻度对比同时和逐步完成', params: { items: ['A', 'B', 'C'] } },
};

const W = 540;
const clamp = x => Math.max(0, Math.min(1, x));
const lerp = (a, b, p) => a + (b - a) * p;
function ease(t, start, end) {
  const p = clamp((t - start) / (end - start));
  return p * p * (3 - 2 * p);
}
function spread(count, start = 80, end = 460) {
  return Array.from({ length: count }, (_, i) => lerp(start, end, count === 1 ? .5 : i / (count - 1)));
}
function rect(ctx, x, y, w, h, color, outline) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 13);
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }
}
function label(ctx, text, x, y, size = 29, color = '#000', width = 100) {
  if (!text) return;
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y, width);
}
function badge(ctx, text, x, y, fill, { width = 88, height = 54, outline, solid = false } = {}) {
  rect(ctx, x - width / 2, y - height / 2, width, height, fill, outline);
  label(ctx, text, x, y, height > 48 ? 26 : 20, solid ? '#fff' : '#000', width - 12);
}
function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
// The moving particle and the drawn line share a curve, including at the cutoff.
function route(ctx, ax, ay, bx, by, length, color, { weight = 3, cutoff = 1 } = {}) {
  if (length <= 0) return;
  const p = Math.min(length, cutoff);
  const xy = t => [lerp(ax, bx, t * t * (3 - 2 * t)), lerp(ay, by, t)];
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  for (let i = 1; i <= 24; i++) ctx.lineTo(...xy(i * p / 24));
  ctx.lineWidth = weight;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
  const tip = xy(p);
  if (p < .995 && length <= cutoff) dot(ctx, ...tip, Math.max(4, weight * .68), color);
  return tip;
}
function fade(ctx, alpha, draw) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  draw();
  ctx.restore();
}

function vector(ctx, x, y, color, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  [17, 34, 23, 40, 28].forEach((_, j, heights) => {
    const h = heights[(j + seed) % heights.length];
    rect(ctx, j * 10 - 23, -h / 2, 6, h, color);
  });
  ctx.restore();
}
function stagger(t, i, start, span) {
  const p = ease(t, start + i * .06, start + i * .06 + span);
  const breath = Math.sin(Math.PI * p) * 8;
  return { p, offset: 31 * (1 - p) - breath };
}

const effects = {
  tokens(ctx, t, params, colors) {
    const xs = spread(params.tokens.length, 68, 472);
    const settle = ease(t, .36, .67);
    xs.forEach((x, i) => {
      const { p, offset } = stagger(t, i, .02, .23);
      const focus = i === params.focus;
      const xNow = lerp(270 + (x - 270) * .88, x, settle);
      const yNow = lerp(298, 233, settle) + offset;
      fade(ctx, p, () => {
        fade(ctx, settle, () => rect(ctx, xNow - 45.5, yNow - 27, 91, 54, focus ? colors.primarySoft : colors.secondarySoft));
        label(ctx, params.tokens[i], xNow, yNow, lerp(33, 26, settle), '#000', 79);
      });
      const v = ease(t, .56 + i * .054, .77 + i * .054);
      const color = focus ? colors.primary : colors.secondary;
      route(ctx, x, 274, x, 406, v, color, { weight: 2.6 });
      fade(ctx, v, () => vector(ctx, x, 459 + 27 * (1 - v), color, i, 1.35));
    });
  },
  projection(ctx, t, params, colors, detail) {
    const lanes = spread(params.branches.length, 104, 436);
    const gather = ease(t, .05, .32);
    const zoom = ease(t, .74, 1);
    ctx.translate(270, 322);
    ctx.scale(1 + .10 * zoom, 1 + .10 * zoom);
    ctx.translate(-270, -322);
    spread(params.tokens.length).forEach((x, i) => {
      vector(ctx, lerp(x, 270 + (i - (params.tokens.length - 1) / 2) * 39, gather),
        lerp(375, 184, gather), i === 1 ? colors.primary : colors.secondary, i, lerp(1.3, .67, gather));
    });
    lanes.forEach((x, i) => {
      const color = i === 1 ? colors.secondary : colors.primary;
      const p = ease(t, .24 + i * .05, .53 + i * .05);
      route(ctx, 270, 216, x, 301, p, color, { weight: 3.2 });
      const enter = stagger(t, i, .37, .24);
      fade(ctx, enter.p, () => {
        badge(ctx, detail ? 'W' + params.branches[i] : params.branches[i], x, 340 + enter.offset,
          i === 1 ? colors.secondarySoft : colors.primarySoft, { width: 90 });
        route(ctx, x, 373, x, 424, enter.p, color, { weight: 2.5 });
        for (let row = 0; row < params.rows; row++) for (let col = 0; col < 4; col++) {
          const a = ease(t, .51 + row * .045 + col * .015 + i * .035, .64 + row * .045 + col * .015 + i * .035);
          fade(ctx, a * (row === 1 && i === 0 ? 1 : .25 + (row + col) % 3 * .17), () =>
            rect(ctx, x + (col - 1.5) * 18 - 7, 431 + row * 17, 14, 14, color));
        }
        if (detail) label(ctx, params.branches[i], x, 544, 29);
      });
    });
  },
  match(ctx, t, params, colors, detail) {
    badge(ctx, params.query, 270, 199, colors.primarySoft, { width: 141, outline: colors.primary });
    spread(params.keys.length).forEach((x, i) => {
      const { p, offset } = stagger(t, i, .12, .27);
      const line = ease(t, .19 + i * .12, .45 + i * .12);
      route(ctx, 270, 232, x, 369, line, colors.primary, { weight: 3.2 });
      fade(ctx, p, () => badge(ctx, params.keys[i], x, 407 + offset,
        line > .30 && line < .97 ? '#8cdbab' : colors.secondarySoft, { width: 91 }));
      const score = ease(t, .41 + i * .12, .52 + i * .12);
      if (detail) fade(ctx, score, () => label(ctx, String(params.scores[i]), x, 484 + 21 * (1 - score), 29));
    });
    if (detail) fade(ctx, ease(t, .65, .79), () => label(ctx, 's = Q · Kᵀ', 270, 567, 31, '#000', 310));
  },
  weights(ctx, t, params, colors, detail) {
    const scale = ease(t, .32, .67);
    const max = Math.max(...params.scores);
    const exp = params.scores.map(s => Math.exp((s - max) / params.divisor));
    const expSum = exp.reduce((a,b) => a + b, 0);
    const distribution = exp.map(v => v / expSum);
    const peak = Math.max(...distribution);
    spread(params.labels.length).forEach((x, i) => {
      badge(ctx, params.labels[i], x, 223, colors.secondarySoft);
      const p = ease(t, .35 + i * .055, .66 + i * .055);
      if (detail) fade(ctx, 1 - scale, () => label(ctx, String(params.scores[i]), x, 324 + 36 * scale, 29));
      const height = 202 * p * distribution[i] / peak;
      if (height > .01) rect(ctx, x - 24, 492 - height, 48, height, distribution[i] === peak ? colors.primary : colors.secondary);
      if (detail) fade(ctx, scale, () => label(ctx, distribution[i].toFixed(3), x, 535, 25));
    });
    if (detail) fade(ctx, ease(t, .34, .63), () => label(ctx, 'α = softmax(s / ' + params.divisor + ')', 270, 596, 25, '#000', 390));
  },
  'vector-merge'(ctx, t, params, colors, detail) {
    const sum = params.weights.reduce((a,b) => a + b, 0);
    spread(params.labels.length).forEach((x, i) => {
      const fraction = params.weights[i] / sum;
      const {p, offset} = stagger(t, i, .015, .25);
      const travel = ease(t, .30 + i * .07, .70 + i * .07);
      fade(ctx, p, () => badge(ctx, params.labels[i], x, 211 + offset, colors.secondarySoft));
      if (detail) fade(ctx, p, () => label(ctx, '× ' + params.weights[i], x, 278, 22));
      if (fraction === 0) return;
      fade(ctx, p * (1 - travel), () => vector(ctx, x, 339, colors.secondary, i, 1.1));
      const tip = route(ctx, x, 367, 270, 505, travel, colors.primary, { weight: 2 + 15 * fraction });
      if (tip) fade(ctx, Math.sin(Math.PI * travel), () => vector(ctx, ...tip, colors.primary, i, .55 + fraction));
    });
    const arrive = stagger(t, 0, .70, .25);
    fade(ctx, arrive.p, () => badge(ctx, params.output, 270, 553 + arrive.offset, colors.primary, { width: 184, solid: true }));
  },
  focus(ctx, t, params, colors, detail) {
    const xs = spread(params.labels.length, 95, 445);
    const push = ease(t, .32, .65);
    const zoom = 1 + .62 * push + Math.sin(Math.PI * push) * .09;
    ctx.translate(270, 346);
    ctx.scale(zoom, zoom);
    ctx.translate(-lerp(270, xs[params.focus], push), -346);
    xs.forEach((x, i) => {
      fade(ctx, i === params.focus ? 1 : 1 - push * .78, () => badge(ctx, params.labels[i], x, 346, i === params.focus ? colors.primarySoft : colors.secondarySoft, { width: 108, outline: i === params.focus ? colors.primary : undefined }));
    });
    if (detail) fade(ctx, ease(t, .63, .80), () => label(ctx, params.detail, xs[params.focus], 411, 27, '#000', 150));
  },
  'carry-cut'(ctx, t, params, colors) {
    const transfer = ease(t, .32, .69);
    const items = t < .505 ? params.before : params.after;
    spread(items.length).forEach((x,i) => badge(ctx, items[i], x, 433, t < .505 ? colors.secondarySoft : colors.primarySoft));
    const swipe = lerp(-650, 590, transfer);
    if (transfer > 0 && transfer < 1) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 373, 540, 121); ctx.clip();
      rect(ctx, swipe, 395, 640, 76, colors.primarySoft);
      rect(ctx, swipe + 55, 422, 520, 20, colors.primary);
      ctx.restore();
    }
    badge(ctx, params.carry, 270, 259, colors.primary, { width: 132, solid: true });
  },
  move(ctx, t, { item, stops }, colors) {
    const xs = spread(stops.length);
    const travel = clamp((t - .11) / .74) * (stops.length - 1);
    const segment = Math.min(stops.length - 2, Math.floor(travel));
    const p = ease(travel, segment, segment + 1);
    const x = lerp(xs[segment], xs[segment + 1], p);
    xs.slice(1).forEach((next, i) => route(ctx, xs[i], 405, next, 405, clamp(travel - i), colors.secondary));
    xs.forEach((pos, i) => {
      const arrived = travel >= i;
      badge(ctx, stops[i], pos, 405, arrived ? colors.secondarySoft : colors.primarySoft, { width: 77, height: 48 });
      dot(ctx, pos, 368, 3.5, arrived ? colors.secondary : colors.primary);
    });
    const y = 286 - 25 * Math.sin(Math.PI * p);
    route(ctx, x, y + 34, x, 365, 1, colors.primary);
    badge(ctx, item, x, y, colors.primary, { width: 115, solid: true });
  },
  split(ctx, t, { source, branches }, colors) {
    const xs = spread(branches.length);
    badge(ctx, source, 270, 213, colors.primary, { solid: true, width: 112 });
    xs.forEach((x, i) => {
      const start = .14 + i * .052;
      const p = ease(t, start, start + .44);
      route(ctx, 270, 245, x, 442, p, i % 2 ? colors.secondary : colors.primary);
      fade(ctx, ease(t, start + .29, start + .49), () => badge(ctx, branches[i], x, 477, i % 2 ? colors.secondarySoft : colors.primarySoft));
    });
  },
  merge(ctx, t, { inputs, weights, output }, colors, detail) {
    const xs = spread(inputs.length);
    const sum = weights.reduce((a, b) => a + b, 0);
    xs.forEach((x, i) => {
      badge(ctx, inputs[i], x, 216, colors.secondarySoft);
      const start = .16 + i * .06;
      const p = ease(t, start, start + .39);
      route(ctx, x, 326, 270, 493, p, colors.secondary, { weight: 1.8 + 12 * weights[i] / sum });
      if (detail) fade(ctx, ease(t, .1, .28), () => label(ctx, '× ' + weights[i], x, 289, 22));
    });
    fade(ctx, ease(t, .64, .84), () => badge(ctx, output, 270, 547, colors.primary, { width: 145, solid: true }));
  },
  matrix(ctx, t, { rows, columns, axis, focus }, colors, detail) {
    const xs = spread(columns.length, 159, 465);
    const ys = spread(rows.length, 288, 540);
    const selected = ease(t, .50, .73);
    columns.forEach((col, i) => label(ctx, col, xs[i], 205, 24, '#000', 64));
    rows.forEach((row, r) => {
      const p = ease(t, .11 + r * .065, .37 + r * .065);
      fade(ctx, p, () => {
        label(ctx, row, 75, ys[r], 24, '#000', 69);
        xs.forEach((x, c) => {
          const selectedCell = axis === 'column' ? c === focus : r === focus;
          const w = 56 * lerp(.76, 1, p);
          const y = ys[r] + 25 * (1 - p);
          rect(ctx, x - w / 2, y - 19, w, 38, colors.secondarySoft);
          if (selectedCell) fade(ctx, selected, () =>
            rect(ctx, x - w / 2, y - 19, w, 38, colors.primarySoft, colors.primary));
          if (detail && selectedCell) fade(ctx, selected, () => dot(ctx, x, y, 4, colors.primary));
        });
      });
    });
  },
  mask(ctx, t, { query, targets, allowed, blockedLabel }, colors, detail) {
    const xs = spread(targets.length);
    const gate = ease(t, .43, .62);
    const cutoff = .55;
    const boundary = lerp(xs[allowed - 1], xs[allowed], .5);
    fade(ctx, gate, () => rect(ctx, boundary, 207, W - boundary - 29, 229, colors.primarySoft));
    badge(ctx, query, 270, 522, colors.primary, { solid: true });
    xs.forEach((x, i) => {
      const p = ease(t, .10 + i * .045, .4 + i * .045);
      const blocked = i >= allowed;
      const end = blocked ? lerp(1, cutoff, gate) : 1;
      const tip = route(ctx, 270, 489, x, 294, p, blocked ? colors.primary : colors.secondary, { cutoff: end });
      badge(ctx, targets[i], x, 262, blocked ? '#fff' : colors.secondarySoft, { outline: blocked ? colors.primary : undefined });
      if (blocked) fade(ctx, gate, () => {
        if (tip) label(ctx, '×', tip[0], tip[1], 20, colors.primary);
        if (detail) label(ctx, blockedLabel, x, 222, 17);
      });
    });
  },
  compare(ctx, t, { items }, colors) {
    const lanes = [spread(items.length, 55, 220), spread(items.length, 320, 485)];
    lanes.forEach((xs, side) => {
      const color = side ? colors.primary : colors.secondary;
      const soft = side ? colors.primarySoft : colors.secondarySoft;
      xs.forEach((x, i) => {
        const start = side ? .32 + .16 * i : .15;
        const p = ease(t, start, start + .17);
        const bottom = 443 + (side ? 43 * i : 0);
        badge(ctx, items[i], x, 232, soft, { width: 45, height: 42 });
        route(ctx, x, 258, x, bottom - 25, p, color);
        fade(ctx, ease(t, start + .12, start + .19), () =>
          badge(ctx, items[i], x, bottom, color, { width: 45, height: 42, solid: true }));
        if (side && i < xs.length - 1) {
          route(ctx, x + 23, bottom, xs[i + 1] - 23, bottom + 43, ease(t, start + .136, start + .16), color, { weight: 2 });
        }
      });
    });
  },
};

export function drawEffect(ctx, id, progress, params, { theme = {}, detail = true } = {}) {
  if (!Object.hasOwn(effects, id)) throw Error('未知动效 ' + id);
  ctx.save();
  try {
    effects[id](ctx, clamp(progress), { ...recipes[id].params, ...params }, { ...DEFAULT_THEME, ...theme }, detail);
  } finally {
    ctx.restore();
  }
}
