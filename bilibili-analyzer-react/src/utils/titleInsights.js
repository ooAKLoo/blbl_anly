/**
 * 标题洞察分析工具
 * 纯函数，不依赖 React
 */

// ============ 关键词词典 ============

export const KEYWORD_DICT = {
  食物: ['火锅', '烧烤', '炒饭', '面条', '拉面', '米粉', '螺蛳粉', '小龙虾', '串串', '烤肉', '寿司', '披萨', '汉堡', '奶茶', '咖啡', '啤酒', '甜品', '蛋糕', '冰淇淋', '粉', '饺子', '包子', '炸鸡', '麻辣烫', '早餐', '夜宵', '自助餐', '外卖'],
  烹饪: ['做饭', '下厨', '教程', '食谱', '家常菜', '厨房'],
  地域: ['北京', '上海', '广州', '深圳', '成都', '重庆', '西安', '武汉', '长沙', '杭州', '南京', '日本', '韩国', '泰国', '东南亚', '欧洲', '美国'],
  街头: ['街头', '路边摊', '夜市', '菜市场', '小摊', '地摊'],
  科技: ['手机', 'iPhone', '华为', '小米', '电脑', '笔记本', '显卡', 'AI', '人工智能', '机器人', '特斯拉', '新能源', '芯片'],
  游戏: ['游戏', '王者', '原神', 'MC', '我的世界', '吃鸡', 'LOL', 'Steam', '手游', '端游'],
  情感: ['恋爱', '分手', '暗恋', '表白', '结婚', '离婚', '相亲', '孤独', '焦虑', '抑郁', '幸福'],
  生活: ['租房', '搬家', '装修', '通勤', '加班', '工资', '存钱', '省钱', '花钱', '买房'],
  挑战: ['挑战', '极限', '第一次', '体验', '实测', '暴走', '连续', '小时'],
  数字: ['万', '亿', '块', '元', '天', '100', '1000', '10000'],
};

// ============ 停用词 ============

export const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '那', '被', '从', '把', '让', '用', '对', '为',
  '什么', '怎么', '这个', '那个', '还是', '可以', '已经', '因为', '所以', '但是',
  '如果', '虽然', '只是', '而且', '或者', '以及', '关于', '通过', '之后', '之前',
  '这样', '那样', '其实', '终于', '居然', '竟然', '真的', '真是', '当', '做',
  '来', '里', '后', '想', '能', '跟', '吗', '呢', '吧', '啊', '哦', '嗯',
  '个', '次', '种', '件', '条', '年', '月', '日', 'UP', 'up', 'BV', 'bv',
  'vlog', 'Vlog', 'VLOG', 'vol', 'Vol', 'VOL', 'part', 'Part', 'PART',
  'EP', 'ep', '视频', '合集', '系列',
]);

/**
 * 从标题列表中提取高频 2-3 字词组
 */
function extractFrequentPhrases(titles, minCount = 3) {
  const phraseCount = {};

  for (const title of titles) {
    // 提取连续中文字符段
    const segments = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const seen = new Set(); // 同一标题去重

    for (const seg of segments) {
      // 提取 2 字和 3 字组合
      for (let len = 2; len <= 3; len++) {
        for (let i = 0; i <= seg.length - len; i++) {
          const phrase = seg.slice(i, i + len);
          if (STOP_WORDS.has(phrase)) continue;
          // 排除纯停用词组合
          const chars = [...phrase];
          if (chars.every(c => STOP_WORDS.has(c))) continue;
          if (!seen.has(phrase)) {
            seen.add(phrase);
            phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
          }
        }
      }
    }
  }

  return Object.entries(phraseCount)
    .filter(([_, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase, count]) => phrase);
}

/**
 * 提取关键词及其匹配视频
 * @param {Array} videos - 视频列表
 * @param {Object} options - 配置
 * @returns {Array<{keyword, matchedVideos, avgPlay, count}>}
 */
export function extractKeywords(videos, options = {}) {
  const { minCount = 3 } = options;

  if (videos.length < minCount) return [];

  // 1. 用预定义词典扫描
  const keywordResults = {};

  const allKeywords = [];
  for (const [, words] of Object.entries(KEYWORD_DICT)) {
    allKeywords.push(...words);
  }

  for (const kw of allKeywords) {
    const matched = videos.filter(v => v.title.includes(kw));
    if (matched.length >= minCount) {
      keywordResults[kw] = {
        keyword: kw,
        matchedVideos: matched,
        avgPlay: Math.round(matched.reduce((s, v) => s + v.play_count, 0) / matched.length),
        count: matched.length,
      };
    }
  }

  // 2. 自动提取高频词组
  const titles = videos.map(v => v.title);
  const freqPhrases = extractFrequentPhrases(titles, minCount);

  for (const phrase of freqPhrases) {
    if (keywordResults[phrase]) continue; // 已在词典中
    const matched = videos.filter(v => v.title.includes(phrase));
    if (matched.length >= minCount) {
      keywordResults[phrase] = {
        keyword: phrase,
        matchedVideos: matched,
        avgPlay: Math.round(matched.reduce((s, v) => s + v.play_count, 0) / matched.length),
        count: matched.length,
      };
    }
  }

  return Object.values(keywordResults);
}

/**
 * 获取标题关键词洞察
 * @param {Array} videos - 视频列表
 * @returns {Array<{keyword, avgPlay, count, lift, topVideos}>} top 5 关键词
 */
export function getTitleKeywordInsights(videos) {
  if (videos.length < 5) return [];

  const totalAvgPlay = videos.reduce((s, v) => s + v.play_count, 0) / videos.length;
  const keywords = extractKeywords(videos, { minCount: 3 });

  if (keywords.length === 0) return [];

  const withLift = keywords.map(kw => {
    // 未命中的视频
    const matchedBvids = new Set(kw.matchedVideos.map(v => v.bvid));
    const unmatched = videos.filter(v => !matchedBvids.has(v.bvid));
    const unmatchedAvg = unmatched.length > 0
      ? unmatched.reduce((s, v) => s + v.play_count, 0) / unmatched.length
      : totalAvgPlay;

    const lift = unmatchedAvg > 0 ? kw.avgPlay / unmatchedAvg : 1;

    return {
      keyword: kw.keyword,
      avgPlay: kw.avgPlay,
      count: kw.count,
      lift: Math.round(lift * 100) / 100,
      topVideos: [...kw.matchedVideos]
        .sort((a, b) => b.play_count - a.play_count)
        .slice(0, 3),
    };
  });

  return withLift
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 5);
}

/**
 * 获取标题句式规律洞察
 * @param {Array} videos - 视频列表
 * @returns {Array<{pattern, label, avgPlay, count, lift}>}
 */
export function getTitlePatternInsights(videos) {
  if (videos.length < 5) return [];

  const totalAvgPlay = videos.reduce((s, v) => s + v.play_count, 0) / videos.length;

  // 5 种句式检测
  const patterns = [
    { pattern: 'ellipsis', label: '省略号(…)', test: (t) => /[…⋯\.]{3}|\.{3}|。{3}|…/.test(t) },
    { pattern: 'question', label: '问号(？)', test: (t) => /[?？]/.test(t) },
    { pattern: 'exclamation', label: '感叹号(！)', test: (t) => /[!！]/.test(t) },
    { pattern: 'brackets', label: '括号【】', test: (t) => /[【】\[\]「」『』]/.test(t) },
    { pattern: 'hasNumber', label: '含数字', test: (t) => /\d+/.test(t) },
  ];

  // 标题长度分桶
  const lengthBuckets = [
    { pattern: 'short_title', label: '短标题(<10字)', test: (t) => t.length < 10 },
    { pattern: 'medium_title', label: '中等标题(10-20字)', test: (t) => t.length >= 10 && t.length <= 20 },
    { pattern: 'long_title', label: '长标题(>20字)', test: (t) => t.length > 20 },
  ];

  const allPatterns = [...patterns, ...lengthBuckets];
  const results = [];

  for (const p of allPatterns) {
    const matched = videos.filter(v => p.test(v.title));
    const unmatched = videos.filter(v => !p.test(v.title));

    if (matched.length < 3 || unmatched.length < 3) continue;

    const matchedAvg = matched.reduce((s, v) => s + v.play_count, 0) / matched.length;
    const unmatchedAvg = unmatched.reduce((s, v) => s + v.play_count, 0) / unmatched.length;
    const lift = unmatchedAvg > 0 ? matchedAvg / unmatchedAvg : 1;

    if (lift > 1.2) {
      results.push({
        pattern: p.pattern,
        label: p.label,
        avgPlay: Math.round(matchedAvg),
        unmatchedAvgPlay: Math.round(unmatchedAvg),
        count: matched.length,
        unmatchedCount: unmatched.length,
        lift: Math.round(lift * 100) / 100,
      });
    }
  }

  return results.sort((a, b) => b.lift - a.lift);
}
