# 科普曦曦工作台入口

解压 `xixi-workbench.zip`，保留整个 `xixi-workbench/` 目录。需要 Node.js 22 或更新版本及已登录的 Codex CLI。

在本仓库根目录运行，替换最后一个目录参数：

```sh
node integrations/xixi-workbench/start.mjs /path/to/xixi-workbench --check
node integrations/xixi-workbench/start.mjs /path/to/xixi-workbench --open
```

工作台安装包内已带三个 Skill 和运行时。启动后通过网页填写任务并提交。画面阶段可加载 Lecture Motion，角色和声音工作按任务要求分别调用。执行进度与任务状态保存在本机。启动器默认使用工作区权限。
