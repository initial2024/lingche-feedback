# 灵澈反馈站 final

这是给灵澈 v48.7 final-r2 使用的 Vercel 反馈站，包含：

- `/` 首页
- `/releases` 最新版本页面
- `/feedback` 手动反馈页面
- `/admin` 简易反馈管理页
- `GET /api/latest` App 检查最新版
- `POST /api/feedback/report` App 提交诊断报告
- `GET /api/admin/issues` 管理端读取 GitHub Issues
- `GET /api/health` 健康检查

## 一、部署步骤

1. 在 GitHub 新建仓库，例如 `lingche-feedback-site`。
2. 把本项目全部文件上传到该仓库。
3. 在 Vercel 导入该仓库，Framework 选择 Next.js。
4. 在 Vercel Project Settings → Environment Variables 填入 `.env.example` 中的变量。
5. Production 重新部署。
6. 在 Vercel Project Settings → Domains 绑定 `lcfeedback.ccwu.cc`。

## 二、GitHub Issues 反馈库

建议另外建一个私有仓库：

```text
lingche-feedback
```

然后创建 Fine-grained personal access token：

- Repository access：只选 `lingche-feedback`
- Repository permissions：Issues = Read and write；Metadata = Read
- 把生成的 token 填到 Vercel 环境变量 `GITHUB_TOKEN`

环境变量：

```text
GITHUB_OWNER=你的 GitHub 用户名或组织名
GITHUB_REPO=lingche-feedback
GITHUB_TOKEN=github_pat_xxx
FEEDBACK_LABEL=lingche-feedback
```

## 三、版本发布

APK 和源码包建议放 GitHub Releases 或网盘，反馈站只存链接。

在 Vercel 环境变量里改：

```text
LATEST_VERSION=4.8.7
LATEST_VERSION_CODE=117
LATEST_APK_URL=https://github.com/xxx/releases/download/v48.7/app-v48.7.apk
LATEST_CHINA_MIRROR_URL=https://kz26.bbroot.com
LATEST_SOURCE_URL=https://github.com/xxx/releases/download/v48.7/lingche_v48_7_release_bundle.zip
LATEST_SHA256=可选
LATEST_CHANGELOG=更新说明
```

改完环境变量后，需要重新部署一次 Vercel，旧部署不会自动读取新值。

## 四、App 配置

灵澈 v48.7 final-r2 中，反馈站地址填写：

```text
https://lcfeedback.ccwu.cc
```

App 会访问：

```text
https://lcfeedback.ccwu.cc/api/latest
https://lcfeedback.ccwu.cc/api/feedback/report
```

## 五、安全说明

- 反馈报告会在服务端做基础脱敏。
- 默认每个来源 IP 每小时最多 5 次反馈。
- 默认单条反馈最大 50KB。
- 不要把 `GITHUB_TOKEN` 写进前端页面。
- 普通用户不能上传 APK；只通过环境变量维护下载链接。
