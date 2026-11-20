# A 版动效库

从仓库根目录运行 `node skills/lecture-motion/template/scripts/serve.mjs`，打开终端输出的「核心动效库」。每张卡可循环播放、暂停和拖动进度。先看 A 版原镜头，再把可换稿镜头的 JSON 加进模板的 `shots` 数组。

- **A 版原镜头**直接调用原工程的 `render(t)`，按原来的八个时间段拆看。曦曦入场、教鞭回顾和告别保留原图、动作与字幕。
- **可换稿镜头**提取错峰入场、投影、逐项匹配、权重变形与向量汇流，并补充推近和同位交接。可换词元、数值和高亮位置。
- **基础组件**保留简单分流、汇流等，用于只需一眼说明关系的段落。

| 动效 | `effect` | 可换的参数 |
| --- | --- | --- |
| 词元错峰入场 | `tokens` | `tokens`（2–5 个）和零起点 `focus` |
| 向量三路投影 | `projection` | `tokens`、`branches`（2–4 路）和 `rows`（2–5 行） |
| 查询逐项匹配 | `match` | `query`、`keys` 和同长度 `scores` |
| 分数变成权重 | `weights` | `labels`、`scores` 和缩放除数 `divisor` |
| 向量沿线汇总 | `vector-merge` | `labels`、`weights` 和 `output` |
| 推近定位 | `focus` | `labels`、零起点 `focus` 和放大后出现的 `detail` |
| 同位交接 | `carry-cut` | 固定主对象 `carry`，以及换场前后的 `before`、`after` |
| 连续移动 | `move` | `item` 和 `stops`（2–5 个位置） |
| 分流 | `split` | `source` 和 `branches`（2–5 条） |
| 加权汇流 | `merge` | `inputs`、同长度 `weights`、`output`（2–5 路，权重非负且至少一路大于零） |
| 矩阵高亮 | `matrix` | `rows`、`columns`（各 2–5 个）、`axis`（row 或 column）、零起点 `focus` |
| 因果遮罩 | `mask` | `query`、`targets`（2–5 个）、`allowed`（允许读取前几个）、可选 `blockedLabel`，传空字符串时只显示截断 |
| 并行与串行 | `compare` | `items`（2–4 个） |

嵌入自定义 Canvas 工程时，导入 `drawEffect(ctx, id, progress, params, options)`。使用 540×720 的逻辑坐标，传入 0–1 的进度。options 可传 `theme` 和 `detail: false`。模板将逻辑坐标映射到 1080×1440，实际录音或重拍时按你的时间轴重新计算镜头进度。
