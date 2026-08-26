# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React + Vite. The project is a local, interactive product prototype and this stack supports a fast desktop-first build with a responsive browser preview.

## Users

- 获客服务商、短视频/内容代运营团队：同时服务多个客户，需要快速产出、交付并复盘内容获客项目。
- 运营负责人或门店经营者：需要清楚知道当前获客项目下一步做什么，以及哪些内容带来了有效咨询。

## Product Purpose

获客工作台把一次内容获客行动组织成“项目设定 -> 内容生产 -> 发布 -> 线索追踪 -> 项目复盘”的闭环，减少每个客户从零开始策划、写稿和整理结果的重复劳动。

## Positioning

不是 AI 文案工具、剪辑工具、社媒账号管理器或销售 CRM。它的不同之处是将每条内容的行动指令、来源追踪、线索质量和复盘决策放在同一个项目里。

## Operating Context

用户通常坐在电脑前，为多个客户同时准备和交付内容；常用渠道包括短视频、图文、公众号等。平台发布可由用户在外部渠道手工完成，再回到工作台记录发布和线索结果。

## Capabilities and Constraints

- 当前只实现 Base Template v1：客户列表、项目设定、内容流水线、线索追踪、项目复盘。
- 每个项目必须有目标、目标场景、内容和可追踪的 CTA。
- 首版使用本地演示数据与本地交互，不接第三方平台 API。
- 不做视频剪辑、图片设计、自动发布、私信机器人、订单、回款或复杂 CRM。

## Evidence on Hand

- 已定稿的产品骨架：[01_通用获客模板_v1_定稿.md](01_通用获客模板_v1_定稿.md)
- 详细页面与状态设计：[02_通用获客模板_v1_详细设计.md](02_通用获客模板_v1_详细设计.md)
- 现有参考原型位于 `/Users/Admin/Documents/Codex/2026-08-22/w/work/review-20260824/bincode-workspace`。
- 这是演示产品，不应展示未经验证的客户、营收、效果或行业基准。

## Product Principles

1. 目标驱动内容，不允许先写内容再找理由。
2. 每条内容都要有明确 CTA 和来源追踪。
3. 线索一定回连到内容，复盘一定基于数据。
4. 用户每次打开都应看到一个明确的下一步。
5. 界面服务高频操作，避免不必要的协作和管理复杂度。

## Accessibility & Inclusion

界面需要支持键盘操作、清晰焦点状态、可读的文字和状态对比，并在桌面和移动浏览器上保持可用。
