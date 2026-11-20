# Lecture Motion Skills

把口播做成可编辑的教学图解。先跑通主体运动，再加公式、矩阵和必要代码，最后检查字幕与成片。

| Skill | 使用时机 |
| --- | --- |
| [Lecture Motion](skills/lecture-motion/SKILL.md) | 从口播拆拍、分镜到动效与审片 |
| [曦曦动作](skills/xixi-motion/SKILL.md) | 制作或调整讲解、记忆、灵感、强调、警告及出入场 |
| [配音匹配](skills/voice-sync/SKILL.md) | 准备角色与旁白输入，按实际录音对齐字幕和画面 |

## 下载与安装

从 [Releases](https://github.com/lyt-cheess/lecture-motion-skills/releases) 下载 `lecture-motion-skills.zip`。三个 Skill 保持同级时，A 版可以找到曦曦素材和字幕时间轴。

在 Codex 项目中，把需要的 Skill 目录完整复制到项目的 `.agents/skills/`，再调用 `$lecture-motion`、`$xixi-motion` 或 `$voice-sync`。保留三个目录的名称和相对层级，即可同时使用 A 版示例及其角色和时间轴。

## 看效果

首发样片使用 [A 版 Transformer v3](skills/lecture-motion/examples/transformer-v3/README.md)。这是 1080×1440、30 fps 的 40 秒无声动效，带纯黑底部字幕。配音 Skill 提供字幕时间轴和空音色配置，正式配音由使用者提供。曦曦独立 [动作预演](skills/xixi-motion/index.html) 有五种动作可检查。

## 快速预览

从解压后的仓库根目录运行下列命令，需要 Node.js 22+：

```sh
node skills/lecture-motion/template/scripts/serve.mjs
```

打开终端打印的地址，即可切换 A 版原镜头、查看动效库或使用换稿模板。

## 用自己的稿试做

- [核心动效库](skills/lecture-motion/motion/README.md) 有 A 版原镜头、七种可换稿镜头和六个基础组件。
- [课程模板](skills/lecture-motion/template/README.md) 可替换镜头、字幕、色板和底图。默认载入 40 秒 A 版动效模板，并提供基础注意力和请求流水线示例。

## 接入工作台

使用 [工作台入口](integrations/xixi-workbench/README.md)。独立工作台安装包文件名为 `xixi-workbench.zip`。A 版视频文件名为 `lecture-motion-transformer-v3.mp4`，二者可作为发布附件分发。
