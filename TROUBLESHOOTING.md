# AI功能"获取推荐失败"问题排查指南

## 问题现象
用户在使用AI器材选购助手时，点击"获取推荐方案"后提示"获取推荐失败"。

## 排查步骤

### 1. 检查千问API密钥是否正确配置

```bash
# 查看API密钥
grep QWEN_API_KEY ./backend/.env

# 应该显示类似：
# QWEN_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**如果未配置或密钥错误**：
- 访问 https://dashscope.aliyun.com/
- 登录阿里云账号并开通DashScope服务
- 获取API Key
- 编辑 `/backend/.env` 添加：`QWEN_API_KEY=sk-your-key-here`
- 重启后端服务

### 2. 测试千问API连接

```bash
cd ./backend
node -e "
const axios = require('axios');
(async () => {
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: { messages: [{ role: 'user', content: '测试' }] },
        parameters: { max_tokens: 50 }
      },
      {
        headers: {
          'Authorization': 'Bearer ' + process.env.QWEN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ API连接成功');
  } catch (error) {
    console.log('❌ API连接失败:', error.response?.data || error.message);
  }
})();
"
```

### 3. 检查后端服务状态

```bash
# 查看后端进程
ps aux | grep "node.*server.js" | grep -v grep

# 查看后端日志
tail -f ./backend/logs/server.log

# 测试健康检查
curl http://localhost:3000/health
```

### 4. 检查前端浏览器控制台

打开浏览器开发者工具（F12），查看：
- **Console标签**：查看JavaScript错误和日志
- **Network标签**：查看API请求状态和响应

**重点检查**：
- `/ai/equipment-advice` 请求的状态码
- 响应体中的错误信息
- 请求头是否包含正确的Authorization

### 5. 完整测试流程

```bash
#!/bin/bash

echo "=== AI功能测试 ==="
echo ""

# 1. 登录获取token
echo "1. 登录..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138001", "password": "123456"}' \
  | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败"
  exit 1
fi
echo "✅ 登录成功"

# 2. 测试器材推荐
echo ""
echo "2. 测试器材推荐..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/ai/equipment-advice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "budget": 10000,
    "scene": ["人像", "风光"],
    "experience": "进阶",
    "question": "需要轻便"
  }')

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.code == 200' > /dev/null; then
  echo "✅ 器材推荐成功"
else
  echo "❌ 器材推荐失败"
  echo "错误信息:" $(echo "$RESPONSE" | jq -r '.message')
fi
```

## 常见错误和解决方案

### 错误1：千问API密钥未配置
**错误信息**：`千问API密钥未配置，请在.env中设置QWEN_API_KEY`

**解决方案**：
```bash
# 编辑.env文件
vim ./backend/.env

# 添加或修改
QWEN_API_KEY=sk-your-actual-key-here

# 重启服务
pkill -f "node.*server.js"
cd ./backend && node src/server.js
```

### 错误2：API密钥无效
**错误信息**：`AI服务暂时不可用，请稍后重试`
**后端日志**：`Invalid API-key provided`

**解决方案**：
- 检查API密钥是否正确复制（无多余空格）
- 确认阿里云账号已开通DashScope服务
- 检查API密钥是否过期
- 重新生成新的API密钥

### 错误3：网络超时
**错误信息**：`timeout of 30000ms exceeded`

**解决方案**：
- 检查服务器网络连接
- 增加超时时间（在aiController.js中调整timeout参数）
- 检查防火墙设置

### 错误4：Token无效
**错误信息**：`无效的令牌`

**解决方案**：
- 重新登录获取新token
- 检查token是否过期
- 确认前端正确传递Authorization头

### 错误5：scene字段格式错误
**错误信息**：API返回异常或推荐内容不正确

**解决方案**：已修复 - scene数组会自动转换为字符串

## 快速修复命令

```bash
# 一键重启所有服务
cd .

# 停止服务
pkill -f "node.*server.js"

# 启动后端
cd backend && nohup node src/server.js > logs/server.log 2>&1 &

# 前端应该自动热重载，如需重启：
# cd frontend && npm run dev
```

## 验证修复

访问 http://localhost:5173/equipment-advisor
1. 登录账号
2. 填写表单（预算、场景、经验）
3. 点击"获取推荐方案"
4. 应该看到AI推荐内容

## 技术支持

如问题仍未解决，请提供：
1. 浏览器控制台截图
2. 后端日志：`./backend/logs/server.log`
3. 错误信息完整内容
