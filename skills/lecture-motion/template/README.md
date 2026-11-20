# 可换稿的课程模板

需要 Node.js，从仓库根目录执行：

```sh
node skills/lecture-motion/template/scripts/serve.mjs
```

打开输出的课程模板地址。若端口占用，在命令末尾加一个空闲端口。默认载入 [A 版动效模板](examples/v3-style.json)。它把 A 版风格的可换稿镜头编成 40 秒。也可切换到「注意力 · 基础镜头」和「请求处理」。三个示例共用播放器和绘制库。

## 换自己的稿

1. 把稿件按机制拆成几个镜头，给每镜定一个主动作。从 [核心动效库](../motion/README.md) 选定组件。
2. 打开页面里的「换口播、镜头和配色」，用自己的 JSON 替换现有配置，点「应用配置」。应用成功后用「保存已应用配置」下载 JSON。也可以直接复制 [注意力配置](examples/attention.json) 或 [流水线配置](examples/pipeline.json) 到本地另存后编辑。
3. 先关闭解释层和字幕检查主体是否讲得通。运动顺了再打开解释层和字幕，确认公式或数值只在需要的拍点出现。
4. 用「导出 SRT」取得临时时间轴字幕。正式配音后，更新每镜时长和句子的开始时间，再导出。

每个镜头可加 `character` 选择曦曦的 `explain`、`remember`、`inspire`、`emphasize` 或 `warn`。动作库与 Lecture Motion 保持同级，主画面和字幕仍共享这一镜的时间轴。每个镜头的 `seconds` 是时长，`effect` 与 `params` 决定图形和运动，`captions[].at` 是镜内起始秒数。字幕持续到下一句或镜尾。默认黑字、单行，超出安全区时应用配置会提示拆句。时间轴按镜头顺序合成。主题可改 `theme.background`、`primary`、`primarySoft`、`secondary`、`secondarySoft`；也可传 `background.image` 和 `background.opacity`。底图路径以当前示例文件为起点，与其他网页资源一样需通过本地服务访问。

## 渲染接口

在浏览器模块载入前可传入 `window.LECTURE_MOTION_INPUT = { course: yourConfig }`，此时底图相对 HTML。采集时给 URL 加 `?render`，等待 `window.READY`，按秒调用 `window.render(t)`。总时长在 `window.DUR`，画布为 1080×1440。加 `sample=pipeline` 选择流水线示例。参数 `detail=0` 可关闭解释层，`captions=0` 可关闭字幕。

模板交付浏览器预览、渲染接口和 SRT。角色表演和有声校准由对应 Skill 处理。A 版完整示例仍可作为运动与信息密度基准。
