# 最新版本信息更新

更新时间：2026-07-29

本轮只更新反馈站 `initial2024/lingche-feedback`，未修改灵澈 Android App、W Worker、V 后端或聊天项目。

## 最新 APK

- 版本：`4.8.7`
- versionCode：`119`
- 标题：`v48.7 final-r3 / V13 高德 Key Bridge 修复测试版`
- APK：未配置正式公网下载地址。APK 未提交到 GitHub；此前 `http://192.168.1.5:8766/` 仅为局域网测试地址，未写入正式 API。
- chinaMirrorUrl：未配置
- SHA256：`A61C06C0DFA12732053C342C431B4DD5CDAE8A3B124B532F33252A3743704297`
- required：`false`
- versionCode 已从当前 APK 的 Android `build.gradle` 确认。

## 接口与页面

- `/api/latest` 已更新，仍保留环境变量覆盖能力。
- 首页最新版卡片已同步新标题和 versionCode。
- 无正式下载地址时，首页显示“正式下载地址待配置；局域网 APK 仅用于本地测试。”
- `/api/feedback/report` 未修改。

## 部署

- 正式 Vercel 项目：`lingche-feedback-gnkt`
- 正式域名：`https://lcfeedback.ccwu.cc`
- APK 未提交到 GitHub。
- Vercel 部署与公网 `/api/latest` 结果：待本轮 push 后确认。
