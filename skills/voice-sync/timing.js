// 临时时间轴：尚未绑定实际录音。画面与字幕共用此数据。
window.COURSE_TIMING = {
  "schema_version": 1,
  "status": "provisional_no_audio",
  "duration_seconds": 40,
  "cues": {
    "question": 0,
    "token_vectors": 8,
    "projection_split": 12,
    "query_appears": 17,
    "keys_match": 18.2,
    "weights_ready": 22,
    "values_merge": 25,
    "recap": 29,
    "wave": 36,
    "end": 40
  },
  "captions": [
    [
      0,
      0.7,
      ""
    ],
    [
      0.7,
      2,
      "我是曦曦！"
    ],
    [
      2,
      4.3,
      "把 I love deep learning"
    ],
    [
      4.3,
      6.4,
      "翻译成“我爱深度学习”"
    ],
    [
      6.4,
      8,
      "Transformer 是怎样做到的？"
    ],
    [
      8,
      10.1,
      "我们先看编码器自注意力"
    ],
    [
      10.1,
      12,
      "四个词，先变成表示"
    ],
    [
      12,
      14.6,
      "同一组表示，经过不同投影"
    ],
    [
      14.6,
      17,
      "得到 Q、K、V"
    ],
    [
      17,
      19.3,
      "以 love 为例，用它的 Q"
    ],
    [
      19.3,
      22,
      "和各位置的 K 算匹配"
    ],
    [
      22,
      23.5,
      "分数先缩放"
    ],
    [
      23.5,
      25,
      "再经过 Softmax，变成权重"
    ],
    [
      25,
      29,
      "按这些权重，加权汇总 V"
    ],
    [
      29,
      30.2,
      "嗯！记住"
    ],
    [
      30.2,
      33.2,
      "Q、K、V 来自同一条序列"
    ],
    [
      33.2,
      35.1,
      "只是经过不同的投影"
    ],
    [
      35.1,
      36,
      "这就是自注意力！"
    ],
    [
      36,
      40,
      "下节课再见！"
    ]
  ]
};
