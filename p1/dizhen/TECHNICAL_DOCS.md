# 全球地震活动实时监测与分析3D可视化系统 - 技术文档

## 项目概述

一个运行在浏览器端的沉浸式地球科学可视化平台，将 USGS 实时地震数据以脉冲光柱的形式呈现在三维地球仪上，结合时序分析、板块边界展示和地震波传播模拟，让用户直观感受地球深处的脉动。

## 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **3D 渲染**: Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- **状态管理**: Zustand
- **本地存储**: IndexedDB (idb)
- **样式**: Tailwind CSS 3
- **数据可视化**: 原生 Canvas 实现散点图和时间轴
- **日期处理**: date-fns
- **图标**: Lucide React

## 核心模块

### 1. 数据管理层 (`src/data/`)

- **db.ts**: IndexedDB 封装，支持地震数据的持久化存储和查询
- **earthquakeService.ts**: USGS API 调用、数据解析、坐标转换
- **plateBoundaries.ts**: 全球主要板块边界坐标数据
- **dataWorker.ts**: Web Worker 模板（用于后台数据处理）

### 2. 状态管理 (`src/store/`)

- **useEarthquakeStore.ts**: Zustand store，管理全局状态：
  - 地震数据列表和筛选结果
  - 时间窗口和播放控制
  - 选中/悬停的地震事件
  - 地震波模拟状态
  - 散点图选择和视图模式
  - UI 层叠开关

### 3. 3D 场景组件 (`src/components/three/`)

- **Globe.tsx**: 三维地球仪，包含：
  - 程序化生成的地球纹理（大陆/海洋/冰盖）
  - 高程凹凸贴图效果
  - 大气边缘发光 Shader
  - 自动旋转动画

- **EarthquakePillars.tsx**: 地震脉冲光柱，核心性能优化点：
  - InstancedMesh 批量渲染（上限5000个实例）
  - 自定义 Shader 实现脉冲发光效果
  - 颜色编码深度（绿→红）
  - 高度编码震级
  - 射线检测支持悬停和点击

- **PlateBoundaries.tsx**: 板块边界线框渲染
- **SeismicWave.tsx**: 地震波传播模拟，包含 P波/S波
- **Stars.tsx**: 星空背景
- **CameraControls.tsx**: 相机飞行动画控制

### 4. Shader 资源 (`src/shaders/`)

- **pillarShaders.ts**: 光柱顶点和片段着色器
  - 顶点 Shader: 高度缩放、脉冲动画
  - 片段 Shader: 颜色混合、发光效果、透明度控制

- **waveShaders.ts**: 地震波着色器
  - 环形波浪动画
  - 渐进淡出效果

### 5. UI 组件 (`src/components/ui/`)

- **StatusBar.tsx**: 顶部状态栏，显示统计数据
- **ControlPanel.tsx**: 左侧控制面板，图层开关
- **InfoCard.tsx**: 悬停信息卡片
- **SelectedEarthquakeCard.tsx**: 选中地震详情卡
- **Timeline.tsx**: 底部时间轴，支持拖拽和播放
- **ScatterPlot.tsx**: 震级-深度散点图，支持框选

### 6. 主入口

- **Scene.tsx**: 3D 场景组装和后处理配置
- **pages/Home.tsx**: 主页面，组件布局和数据更新循环

## 数据流

```
USGS API (每30秒轮询)
    ↓
fetchEarthquakes() 解析
    ↓
IndexedDB 存储 + 增量更新
    ↓
Zustand Store 状态更新
    ↓
过滤 (时间窗口 + 散点选择)
    ↓
InstancedMesh 实例矩阵更新
    ↓
每帧渲染 (useFrame)
```

## 性能优化策略

### 1. 渲染优化

- **InstancedMesh**: 所有地震柱共享几何体，减少 draw call
- **自定义 Shader**: GPU 并行计算脉冲动画和颜色
- **后处理 Bloom**: 增强发光效果但控制阈值减少开销
- **相机距离控制**: minDistance/maxDistance 限制缩放范围
- **实例上限**: 最多渲染 5000 个地震柱

### 2. 数据优化

- **IndexedDB**: 本地缓存支持离线查看
- **增量更新**: 仅处理新增的地震事件
- **时间轴限流**: requestAnimationFrame 同步拖拽
- **Canvas 虚拟化**: 散点图和时间轴直接绘制到 Canvas

### 3. 计算优化

- **坐标预计算**: 地震柱位置矩阵在数据更新时一次性计算
- **缓动动画**: 相机飞行使用三次缓动函数
- **requestAnimationFrame**: 所有动画与渲染帧同步

## 地震波传播简化算法

### 基本假设

使用简化的均匀地壳模型：
- P波速度: 6.0 km/s
- S波速度: 3.5 km/s

### 波前计算

```javascript
elapsedTime = (now - startTime) / 1000  // 秒
pWaveRadius = (elapsedTime * 6.0) / 4000  // 归一化到地球半径
sWaveRadius = (elapsedTime * 3.5) / 4000
```

### 视觉呈现

- P波: 蓝色，较窄，速度快
- S波: 橙红色，较宽，速度慢
- 透明度随距离衰减
- 使用自定义环形 Shader 绘制

## 颜色编码规则

### 震源深度 (垂直轴色标)

| 深度范围 | 颜色 | 类型 |
|----------|------|------|
| 0-70 km | 绿色 (#22ff66) | 浅源地震 |
| 70-300 km | 黄色→橙色 | 中源地震 |
| 300-700 km | 红色 (#ff2200) | 深源地震 |

### 地震区域 (散点图标色)

| 区域 | 颜色 |
|------|------|
| 环太平洋西带 | 青色 |
| 环太平洋东带 | 红色 |
| 喜马拉雅-地中海带 | 黄色 |
| 非洲-大西洋中脊 | 绿色 |
| 其他区域 | 灰色 |

## 坐标系转换

### 经纬度 → 3D 球面坐标

```typescript
function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }
}
```

## 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 轮询间隔 | 30000 ms | USGS API 刷新频率 |
| 实例上限 | 5000 | 最大地震柱数量 |
| 最小震级 | 0 | 数据过滤阈值 |
| 最小相机距离 | 0.8 | 地球表面距离 |
| 最大相机距离 | 8.0 | 太空视角距离 |
| Bloom 阈值 | 0.8 | 辉光亮度阈值 |

## 浏览器兼容性

- Chrome/Edge: 推荐，最佳性能
- Firefox: 需启用 WebGL 2.0
- Safari: 支持，部分 Shader 特性可能受限

最低要求:
- WebGL 2.0 支持
- ES2020 JavaScript 特性
- 至少 2GB 可用内存（处理大量地震数据）

## 开发命令

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器
npm run build    # 生产环境构建
npm run preview  # 预览构建结果
npm run lint     # 代码检查
```
