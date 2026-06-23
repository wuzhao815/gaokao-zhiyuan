# 本地AI推荐与自我完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不接外部API的前提下，加强高考志愿平台的本地AI推荐解释、风险提示、导出说明和系统自检能力。

**Architecture:** 保持现有静态前端结构，只修改 `index.html`、`assets/js/app.js`、`assets/css/style.css`。新增逻辑全部以独立函数形式追加到 `app.js`，避免重构主导航和已修复的江西45志愿模块。

**Tech Stack:** HTML、CSS、原生 JavaScript、GitHub Pages 静态部署、Node 语法检查、浏览器回归验证。

---

### Task 1: 增强江西45志愿本地AI解释

**Files:**
- Modify: `assets/js/app.js`
- Modify: `assets/css/style.css`

- [ ] **Step 1: 语法基线检查**

Run: `node -c assets/js/app.js`
Expected: exit code 0

- [ ] **Step 2: 添加本地AI辅助函数**

在 `jxDoRecommend` 前添加：

```javascript
function jxGetAiLevelText(level) {
  if (level === 'reach') return '冲刺';
  if (level === 'target') return '稳妥';
  return '保底';
}

function jxGetAiRiskText(level, diff) {
  if (level === 'reach') return '风险较高，适合作为冲刺志愿，建议搭配足量稳妥和保底院校。';
  if (level === 'target') return '匹配度较高，适合作为方案主体，但仍需关注当年招生计划变化。';
  return '安全边际较大，适合作为兜底选择，建议保留足够数量。';
}
```

- [ ] **Step 3: 推荐结果增加AI评分和推荐依据**

在 `jxDoRecommend` 计算每所学校时增加 `aiScore`、`reason`、`riskText`，表格新增“AI评分”和“推荐依据”列。

- [ ] **Step 4: 导出文件增加AI说明**

在 `jxExport` 中每条志愿写入 AI评分、推荐依据和风险提示。

- [ ] **Step 5: 验证**

Run: `node -c assets/js/app.js`
Expected: exit code 0

### Task 2: 新增系统自检能力

**Files:**
- Modify: `index.html`
- Modify: `assets/js/app.js`
- Modify: `assets/css/style.css`

- [ ] **Step 1: 首页增加自检入口卡片**

在首页兴趣测试前增加 `home-ai-health` 容器。

- [ ] **Step 2: 添加自检函数**

新增 `runAiSelfCheck()`，检查核心 section、导航、数据数组、兴趣容器、关键函数是否存在，并输出正常/需注意/异常。

- [ ] **Step 3: 渲染自检卡片**

新增 `renderAiHealthCard()`，首页展示系统状态、数据状态、建议事项，并提供“立即自检”按钮。

- [ ] **Step 4: 导航时刷新首页卡片**

在 `init()` 或首页渲染流程调用 `renderAiHealthCard()`。

- [ ] **Step 5: 验证**

浏览器打开首页，确认卡片展示；点击“立即自检”，确认结果刷新且无JS错误。

### Task 3: 回归测试与部署

**Files:**
- Modify: deployment result only

- [ ] **Step 1: 本地语法检查**

Run: `node -c assets/js/app.js; node -c assets/js/data.js`
Expected: both exit code 0

- [ ] **Step 2: 线上部署**

Run: `python deploy_v2.py`
Expected: `index.html`、`style.css`、`data.js`、`app.js` 上传成功，Pages build OK。

- [ ] **Step 3: 浏览器回归**

验证：首页自检卡片、江西45志愿、兴趣选择、45志愿生成、导出、专业目录点击、导航切换。

- [ ] **Step 4: 收尾说明**

向用户说明已完成的AI增强、自检能力和验证结果。

---

Self-review:
- 覆盖用户要求：本地AI增强、自我完善、稳定收尾。
- 无外部API和密钥依赖。
- 不重构大文件结构，降低回归风险。
- 所有修改都有语法检查和浏览器回归验证。
