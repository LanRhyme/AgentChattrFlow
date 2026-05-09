# Web UI React + Headless UI 重构计划

## 背景与动机
用户希望在不影响现有功能的前提下，对 `AgentChattrFlow` 的 Web 界面进行全面重构。
原有的纯 HTML/Vanilla JS 界面虽然直接，但随着复杂度的增加（如 WebSockets 状态管理、UI交互等），维护成本变高。
本计划旨在利用 **React**、**Tailwind CSS** (以绿色为主题色) 以及 **Headless UI** 来提供更现代、更易于维护且用户体验更佳的界面。

## 范围与影响
*   **前端结构**: 使用 Vite 构建工具搭建完整的 React SPA（单页应用）。
*   **UI/UX**: 采用 Headless UI 重构所有的交互组件（如：下拉菜单、模态框、Tabs 等），并搭配 Tailwind CSS 实现定制化的绿色主题。
*   **状态管理**: 将现有的全局 `store.js`、`jobs.js` 等 Vanilla JS 状态重构为 React Context 或 Zustand 状态，并将其与 WebSocket 的事件监听系统深度集成。
*   **后端集成**: 生产环境下，React 编译后的产物将输出到现有的 `static/` 目录，由现有的 `app.py` 无缝提供服务。

## 提议的解决方案 (Vite SPA + FastAPI)
*   **技术栈**: React 18, Vite, Tailwind CSS, Headless UI, (推荐) Zustand (用于管理复杂的 WebSocket 消息状态)。
*   **主题设计**: Tailwind 配置文件中将默认主色调 (`primary`) 设置为绿色调（如 emerald 或 green 系列），贯穿按钮、提示框、交互反馈等所有UI元素。

## 分步实施计划

### 第一阶段：初始化与基础配置
1. 在项目根目录下创建 `frontend` 文件夹并初始化 Vite + React + TypeScript/JavaScript 项目。
2. 安装相关依赖：`tailwindcss`, `postcss`, `autoprefixer`, `@headlessui/react`, `@heroicons/react` 等。
3. 配置 `tailwind.config.js`，设置绿色为主色调。
4. 配置 Vite 以在开发环境下代理 API 与 WebSocket 请求至 FastAPI 服务器（如 `localhost:8300`）。

### 第二阶段：状态管理与 WebSocket 集成
1. 将原有的 WebSocket 连接与重连逻辑提取为自定义 React Hook（如 `useWebSocket`）。
2. 构建基于 Zustand 的全局状态管理，涵盖：
    *   **Messages**: 对话消息的历史记录与实时更新。
    *   **Agents**: 代理的状态与规则配置。
    *   **Jobs & Schedules**: 任务面板与计划任务的管理。
    *   **Settings**: 用户的个性化设置（字体、主题等）。
3. 确保安全机制（如 `__SESSION_TOKEN__` 的读取）能够在 React 初始化时正确加载。

### 第三阶段：UI 组件重构 (Headless UI)
1. **主布局与侧边栏**: 构建响应式的主聊天界面布局，支持频道切换。
2. **对话列表与输入框**: 重写消息列表渲染，集成 Markdown 渲染与打字指示器。
3. **功能面板**: 
    *   利用 `<Dialog>` (Headless UI) 实现各种弹出窗口（例如：配置面板、新建任务）。
    *   利用 `<Menu>` (Headless UI) 实现下拉菜单。
    *   利用 `<Tab>` (Headless UI) 管理主视图中的频道或作业对话。
4. 替换原有基于 DOM 操作的更新方式为 React 数据驱动渲染。

### 第四阶段：后端构建与部署适配
1. 配置 Vite 的 build 选项，使其打包输出覆盖现有的 `static/` 目录。
2. 修改（或确认）`run.py` 中的 `index.html` `__SESSION_TOKEN__` 动态注入逻辑能够兼容 Vite 生成的带有打包资源引用的 HTML 文件。
3. 确保原有静态资源（如 logo、声音等）被正确迁移至 Vite 的 `public` 目录或直接由后端继续接管。

## 验证与测试
*   运行现有的所有操作流（发送消息、@代理、新建/管理 Job、修改设置）并确认其能在新界面中正确触发并收到 WebSocket 更新。
*   确认旧功能无一遗漏。
*   检查在不同浏览器和移动端的响应式表现。

## 迁移与回滚策略
*   在覆盖 `static/` 目录前，将原有的 `static/` 文件夹及 `open_chat.html` 备份为 `static_backup/`。
*   如遇阻断性 Bug 且难以立刻修复，可通过恢复备份文件迅速还原为原生的 Vanilla JS 界面。