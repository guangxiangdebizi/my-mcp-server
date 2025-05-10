# my-mcp-server MCP Server

一个支持财经新闻查询和笔记管理的Model Context Protocol服务器

这是一个基于TypeScript的MCP服务器，实现了财经新闻查询和简单的笔记系统。它展示了MCP核心概念，提供以下功能：

- 资源：表示带有URI和元数据的文本笔记
- 工具：创建新笔记和获取金融数据（新闻、股票、指数）
- 提示词：生成笔记摘要

<a href="https://glama.ai/mcp/servers/@guangxiangdebizi/my-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@guangxiangdebizi/my-mcp-server/badge" alt="Financial News and Notes Server MCP server" />
</a>

## 功能特点

### 资源 (Resources)
- 通过`note://`URI列出和访问笔记
- 每个笔记都有标题、内容和元数据
- 纯文本mime类型方便访问内容

### 工具 (Tools)
- `create_note` - 创建新的文本笔记
  - 需要标题和内容作为必要参数
  - 将笔记存储在服务器状态中
  
- `finance_news` - 获取最新财经新闻
  - 可选参数count指定获取的新闻条数（默认5条）
  - 使用Tushare API获取实时财经新闻
  - 支持source参数指定新闻来源（sina、wallstreetcn、10jqka、eastmoney等）
  - 如果实时获取失败，会提供模拟数据作为后备
  
- `stock_data` - 获取股票历史行情数据
  - 需要code参数指定股票代码（如：000001.SZ）
  - 可选参数start_date、end_date指定日期范围
  - 可选参数fields指定需要的数据字段
  
- `index_data` - 获取指数历史行情数据
  - 需要code参数指定指数代码（如：000001.SH为上证指数）
  - 可选参数start_date、end_date指定日期范围
  - 返回指数走势摘要和历史数据

### 提示词 (Prompts)
- `summarize_notes` - 生成所有存储笔记的摘要
  - 包含所有笔记内容作为嵌入资源
  - 返回结构化提示词供LLM摘要

## Tushare API集成

本项目使用[Tushare API](https://tushare.pro)获取金融数据，支持以下功能：

1. **财经新闻** - 从多个来源获取最新财经快讯
   - 支持的来源：新浪财经、华尔街见闻、同花顺、东方财富等
   - 可获取最近24小时内的新闻

2. **股票数据** - 获取指定股票的历史行情
   - 支持所有A股市场股票
   - 默认获取最近一个月数据，可指定日期范围
   - 包含开盘价、最高价、最低价、收盘价、成交量等信息

3. **指数数据** - 获取主要指数历史行情
   - 支持上证指数、深证成指、创业板指等主要指数
   - 提供指数走势摘要分析
   - 包含价格和成交量数据

## 开发

安装依赖:
```bash
npm install
```

构建服务器:
```bash
npm run build
```

开发时自动重新构建:
```bash
npm run watch
```

## 安装配置

### VSCode中使用

在VSCode中与Claude扩展一起使用，需添加以下配置:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "C:/path/to/my-mcp-server/build/index.js",
      "transport": "stdio",
      "autoApprove": ["finance_news", "create_note", "stock_data", "index_data"]
    }
  }
}
```

### 使用Supergateway（推荐）

推荐使用Supergateway运行服务器以获得更好的调试体验:

```bash
npx -v supergateway --stdio "node build/index.js" --port 3100
```

然后在Claude配置中使用:

```json
{
  "mcpServers": {
    "finance-news-server": {
      "url": "http://localhost:3100/sse",
      "transport": "sse",
      "autoApprove": ["finance_news", "create_note", "stock_data", "index_data"]
    }
  }
}
```

### 调试

由于MCP服务器通过stdio通信，调试可能具有挑战性。我们推荐使用[MCP Inspector](https://github.com/modelcontextprotocol/inspector)，可通过以下脚本运行:

```bash
npm run inspector
```

Inspector将提供URL以在浏览器中访问调试工具。

## 使用示例

### 获取财经新闻

```
请使用finance_news工具获取最新财经新闻
```

指定新闻数量和来源:

```
请使用finance_news工具获取10条来自东方财富的最新财经新闻，参数：count=10, source=eastmoney
```

### 获取股票数据

```
请使用stock_data工具获取平安银行(000001.SZ)最近一个月的股票数据
```

指定日期范围:

```
请使用stock_data工具获取贵州茅台(600519.SH)从20230101到20230131的股票数据
```

### 获取指数数据

```
请使用index_data工具获取上证指数(000001.SH)的最新数据
```

### 创建笔记

```
请使用create_note工具创建一个新笔记，标题为"会议记录"，内容为"今天讨论了项目进度..."
```

### 生成摘要

```
请使用summarize_notes提示生成所有笔记的摘要
```