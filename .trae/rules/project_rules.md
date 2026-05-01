# project_rules.md · 个人待办管理应用

> 每次对话开头必须先说：
> 1. 请勿修改其他任何已有功能
> 2. 请给每个功能模块加上中文注释，说明这段代码的作用

---

## 项目基本信息

- **项目名称**：个人待办管理应用
- **技术栈**：Vite + React（函数组件 + Hooks）
- **数据存储**：localStorage，无后端
- **界面语言**：中文
- **布局**：响应式，桌面端三列布局，移动端折叠面板

---

## 目录结构

```
src/
├── main.jsx               # 入口
├── App.jsx                # 路由 + 全局状态
├── components/
│   ├── ZonePanel.jsx      # 区面板（工作/推进/兴趣）
│   ├── ProjectItem.jsx    # 项目折叠块
│   ├── TaskItem.jsx       # 单条任务
│   ├── TodayFocus.jsx     # 今日聚焦视图
│   ├── History.jsx        # 历史记录视图
│   └── WeekReview.jsx     # 周回顾小结
├── hooks/
│   ├── useZones.js        # 区数据读写
│   ├── useProjects.js     # 项目数据读写
│   ├── useTasks.js        # 任务数据读写
│   ├── useStreak.js       # streak 计算（工作区达标型 / 推进区习惯型）
├── utils/
│   ├── storage.js         # localStorage 统一读写封装
│   ├── dateUtils.js       # 日期格式化工具
│   └── uuid.js            # id 生成工具
└── constants/
    └── zones.js           # 三个区的固定配置（id/名称/目标）
```

---

## 核心数据结构（不可修改字段名）

```js
// 项目 Project
{ id, zoneId, name, createdAt }

// 任务 Task
{ id, projectId, zoneId, title, done, doneAt, deadline, estimatedMin, createdAt }

// 推进区打卡 StreakRecord
{ date, checked }   // date 格式: 'YYYY-MM-DD'
```

---

## 三个区固定配置

```js
// src/constants/zones.js
export const ZONES = [
  { id: 'work',     name: '工作区', dailyGoal: '今日建议完成 2–3 条',   goalType: 'daily_count', goalValue: 2 },
  { id: 'advance',  name: '推进区', dailyGoal: '今日哪怕推进 1 分钟',   goalType: 'daily_checkin' },
  { id: 'interest', name: '兴趣区', dailyGoal: '本周至少完成 2 次',     goalType: 'weekly_count', goalValue: 2 },
]
```

---

## localStorage Key 规范

| Key | 内容 |
|---|---|
| `todo_projects` | 所有项目数组 JSON |
| `todo_tasks` | 所有任务数组 JSON |
| `todo_streak_advance` | 推进区打卡记录数组 JSON |
| `todo_streak_work` | 工作区达标记录数组 JSON |

---

## 命名规范

- 组件：PascalCase（`TaskItem.jsx`）
- Hook：camelCase，以 `use` 开头（`useTasks.js`）
- 工具函数：camelCase（`formatDate`）
- 所有代码注释使用**中文**
- 变量语义清晰，禁止缩写（如不用 `t` 代替 `task`）

---

## 禁忌（AI 不得违反）

- 不得修改 `src/constants/zones.js` 中三个区的 id 值（`work` / `advance` / `interest`）
- 不得修改已定义的数据结构字段名
- 不得引入后端或网络请求，所有数据存 localStorage
- 每次只做当前模块，不超前实现未讨论的功能
- 新增功能前先确认不影响已完成模块

---

## 已完成模块记录

> 每完成一个模块在这里打勾，方便追踪进度

- [x] 模块一：基础框架 + 三区布局
- [x] 模块二：项目与任务管理
- [x] 模块三：今日聚焦视图
- [ ] 模块四：streak 打卡（工作区达标型 + 推进区习惯型）
- [ ] 模块五：历史记录
- [ ] 模块六：周回顾小结

---

## Skills 沉淀区（预留）

> 当你发现第三次跟 Trae 解释同一件事时，把它写在这里

### Skill：新增或重命名任务字段
1. 修改 useTasks.js 中 createTask 函数的初始值
2. 修改所有用到旧字段名的组件（TaskItem.jsx、TodayFocus.jsx、History.jsx）
3. localStorage 中旧数据会自动兼容（新字段读取时为 undefined，
   用 || 给默认值即可）

### Skill：useState 初始化从 localStorage 读取
// 正确写法（惰性初始化，避免空数组覆盖已有数据）
const [data, setData] = useState(() => getItem(STORAGE_KEY, []));
// 错误写法（会导致刷新数据丢失）
const [data, setData] = useState([]);

### Skill：任务状态变化后需要继续显示 TaskItem
// 场景：勾选完成后需要显示输入框，但过滤条件会把 done:true 的任务隐藏
// 解决：用 pendingSet 临时保留刚完成的任务 id，
// 过滤条件改为：!task.done || pendingSet.has(task.id)
// 输入框操作完成后再从 pendingSet 移除

### Skill：组件间共享状态需提升到 App.jsx
当多个页面需要读取同一份数据时（如 tasks、projects），
状态必须定义在 App.jsx 顶层，通过 props 向下传递。
不能把状态放在子组件内部，否则切换页面时数据会丢失。