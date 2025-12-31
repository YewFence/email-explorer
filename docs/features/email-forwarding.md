# 邮件转发和 Telegram 通知

## 功能概述

email-explorer 支持自动转发收到的邮件到多个邮箱，并通过 Telegram Bot 发送通知。

## 配置方法

在 `wrangler.jsonc` 中添加环境变量：

```jsonc
{
  "vars": {
    // 邮件转发：支持多个邮箱，用逗号分隔
    "FORWARD_EMAILS": "admin@example.com,backup@example.com",
    
    // Telegram 通知（可选）
    "TG_TOKEN": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "TG_CHAT_ID": "123456789"
  }
}
```

### 配置项说明

- **`FORWARD_EMAILS`**（可选）
  - 功能：将收到的邮件自动转发到指定邮箱
  - 格式：用逗号分隔的邮箱地址列表
  - 示例：`"user1@gmail.com,user2@outlook.com,user3@yahoo.com"`
  - 注意：邮箱地址前后的空格会自动去除

- **`TG_TOKEN`**（可选）
  - 功能：Telegram Bot 的 API Token
  - 获取方法：在 Telegram 中与 [@BotFather](https://t.me/BotFather) 对话创建 Bot
  - 格式：`"bot_token_here"`

- **`TG_CHAT_ID`**（可选）
  - 功能：接收通知的 Telegram 聊天 ID
  - 获取方法：
    1. 与你的 Bot 发送消息
    2. 访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
    3. 在返回的 JSON 中查找 `chat.id`
  - 格式：`"123456789"`

## 工作流程

当收到新邮件时：

1. **保存邮件**：邮件及附件保存到数据库和 R2 存储
2. **转发邮件**：如果配置了 `FORWARD_EMAILS`，将原始邮件转发到指定邮箱
3. **发送通知**：如果配置了 Telegram，发送包含以下信息的通知：
   - 📧 发件人（From）
   - 📧 收件人（To）
   - 📧 邮件主题（Subject）
   - ✅/❌ 各个邮箱的转发状态

## Telegram 通知示例

```
📧 新邮件
From: sender@example.com
To: receiver@yourdomain.com
Subject: Important Meeting Tomorrow

转发状态：
admin@example.com: ✅ | backup@example.com: ✅
```

## 错误处理

- **转发失败**：会在 Telegram 通知中显示 ❌ 和错误信息
- **Telegram 失败**：会在 Worker 日志中记录错误，但不影响邮件接收
- **部分转发成功**：每个邮箱独立处理，不会因为一个失败而影响其他邮箱

## 日志监控

在 Cloudflare Dashboard 的 Workers 日志中可以看到：

```
[Forward Logic] user1@gmail.com: ✅ | user2@outlook.com: ✅
[Telegram Success] Notification sent.
```

或者错误情况：

```
[Forward Logic] user1@gmail.com: ✅ | user2@outlook.com: ❌(Mailbox not found)
[Telegram FAILED] API Error: {"ok":false,"error_code":401,"description":"Unauthorized"}
```

## 安全建议

1. **保护敏感信息**：不要将 Token 和 Chat ID 提交到公开仓库
2. **使用 Secrets**：在生产环境中使用 `wrangler secret put` 命令设置敏感变量
   ```bash
   wrangler secret put TG_TOKEN
   wrangler secret put TG_CHAT_ID
   ```
3. **限制转发数量**：避免配置过多转发邮箱，以免触发速率限制

## 禁用功能

如果不需要这些功能，只需：
- 不配置相关环境变量，或
- 从 `wrangler.jsonc` 中删除 `vars` 配置

系统会自动跳过转发和通知逻辑，不影响正常的邮件接收。
