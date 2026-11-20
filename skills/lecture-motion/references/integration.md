# 更换背景、角色与配音

浏览器工程可在载入模块前设置 `window.LECTURE_MOTION_INPUT`。渲染器对工作台公开 `window.DUR`、`window.render(t)` 和 `window.READY`。

| 接入项 | 调用与数据 | 实际检查 |
| --- | --- | --- |
| 配色与底图 | `theme: { primary, primarySoft, secondary, secondarySoft }`。 `background: { color, image, fit, opacity }`。底图为相对工程路径，fit 可取 cover 或 contain。 | 换背景后查看黑字、图形和标签是否清楚。 |
| 角色包 | `character: { render({ time, cue }) }` 返回透明 DOM 图层或 null。 `cue: { start, end, variant, from?, to? }` 选用角色包里的版本名。可选脚底坐标为归一化的 `[x,y]`。传入 `character: null` 可关闭。 | 展开移动路线后，核对到位、遮挡和停步。需要逐帧查看时验证角色能在同一时刻重现同一姿态。 |
| 配音和字幕 | `timing: { duration, anchors?, captions?, characterCues?, audio? }`。有口播稿时字幕默认开启。必要时传入 `showCaptions: false`。单条结构是 `{ start, end, text }`。`audio` 可以为空，或是一条已混合的参考录音路径。 | 按真实录音重校字幕、画面事件和角色段落。跳转时同时检查音频和画面时刻。 |

角色版的走路、教鞭、提示和告别由角色模块实现。更换配音使用声音模块的混音和时间标注，画面模块按绝对时刻取样。播放有音轨时以音频播放位置为准，无音轨时用本地预览时钟。

时间单位为秒，时段左闭右开，结尾取最后一个可见状态。定稿配音时给 `anchors` 传入对应工程的命名锚点，首尾对应 0 与 duration，锚点严格递增。同步替换字幕和角色段落。以 Transformer 分镜为例，可用 `start, input, project, match, normalize, merge, recap, outro, end`。

```js
window.LECTURE_MOTION_INPUT = {
  theme: { primary: '#5934bc', primarySoft: '#eee6fd' },
  background: { color: '#fff', image: './paper.png', fit: 'cover', opacity: 0.18 },
  character: null,
};
```

暂未绑定录音的预览采用临时时间。导出端等待 `READY` 后调用 `render(t)`，只截取出片画布。
