# FinanceMCP 财经数据服务器

[![smithery badge](https://smithery.ai/badge/@guangxiangdebizi/FinanceMCP)](https://smithery.ai/server/@guangxiangdebizi/FinanceMCP)

欢迎使用 **FinanceMCP 财经数据服务器**！本项目提供一个模型上下文协议 (MCP) 服务器，使语言模型（如 Cline）能够访问通过 **Tushare API** 获取的实时财经新闻、股票数据和指数数据。这使得基于最新的市场信息进行富有洞察力的分析和预测成为可能。

本指南将引导您完成此服务器的设置、配置和使用，即使您是 MCP 或 Node.js 开发的新手也能轻松上手。

## 🌟 功能特性

*   **全面的金融数据访问**：通过 Tushare API 获取股票、指数和财经新闻数据。
*   **股票数据访问**：获取指定股票代码的历史行情数据。
*   **指数数据访问**：获取如上证指数、深证成指等主要市场指数的历史行情数据。
*   **财经新闻检索**：从多种来源（通过 Tushare API）收集最新的财经新闻。
*   **MCP 集成**：与兼容 MCP 的客户端（如 Cline）无缝集成。
*   **可配置**：通过简单的 JSON 配置文件即可轻松设置和自定义。
*   **可扩展**：设计上易于通过新的 Tushare API 接口或自定义工具进行扩展。

## 🚦 环境要求

在开始之前，请确保您的系统上已安装以下软件：

1.  **Node.js 和 npm**：
    *   本项目基于 Node.js 构建。我们建议使用最新的 LTS (长期支持) 版本。
    *   您可以从 [nodejs.org](https://nodejs.org/) 下载。
    *   `npm` (Node 包管理器) 已随 Node.js 一同安装。
    *   要检查是否已安装，请打开终端或命令提示符并输入：
        ```bash
        node -v
        npm -v
        ```
        您应该能看到两者对应的版本号。

2.  **Git (可选但推荐)**：
    *   如果您想直接从 Git 源克隆仓库。
    *   可从 [git-scm.com](https://git-scm.com/) 下载。

3.  **MCP 客户端 (例如 Cline)**：
    *   要与此服务器交互，您需要一个 MCP 客户端。本指南将以 Cline 为例。

4.  **Tushare API Token**：
    *   本项目依赖 [Tushare](https://tushare.pro) 提供的金融数据。您需要在 Tushare 官网注册并获取 API Token。
    *   请访问 [https://tushare.pro/register](https://tushare.pro/register) 进行注册。
    *   获取到的 Token 将在代码中直接使用。

## 🛠️ 安装与设置

请按照以下步骤启动并运行您的服务器：

### 安装 FinanceMCP

#### Installing via Smithery

To install FinanceMCP for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@guangxiangdebizi/FinanceMCP):

```bash
npx -y @smithery/cli install @guangxiangdebizi/FinanceMCP --client claude
```

### 1. 获取代码

*   **如果您已安装 Git：** 将仓库克隆到您的本地计算机：
    ```bash
    git clone https://github.com/guangxiangdebizi/FinanceMCP.git
    cd FinanceMCP
    ```

*   **如果您未安装 Git：** 将项目文件下载为 ZIP 压缩包，并将其解压到一个名为 `FinanceMCP` 的文件夹中。然后，使用终端进入此文件夹。

### 2. 安装依赖项

进入项目的根目录 (`FinanceMCP`) 后，打开终端并运行以下命令以安装必需的 Node.js 包：

```bash
npm install
```
此命令会读取 `package.json` 文件，并将所有必需的库下载到 `node_modules` 文件夹中。

### 3. 配置 MCP 服务器

服务器需要注册到您的 MCP 客户端（例如 Cline）。这通常通过客户端中的设置文件完成。

*   找到您的 MCP 客户端的设置文件。对于 Cline，通常路径如下：
    *   Windows: `C:\Users\<您的用户名>\AppData\Roaming\Code\User\globalStorage\sauridwo.claude-dev\cline_mcp_settings.json`
    *   macOS: `~/Library/Application Support/Code/User/globalStorage/sauridwo.claude-dev/cline_mcp_settings.json`
    *   Linux: `~/.config/Code/User/globalStorage/sauridwo.claude-dev/cline_mcp_settings.json`
    *(确切路径可能因您的设置和 Cline 版本而略有不同。)*

*   使用文本编辑器打开 `cline_mcp_settings.json`。
*   添加或更新 `finance-data-server` 的配置。配置应如下所示：

```json
{
      "mcpServers": [
        {
          "finance-data-server": { // 您可以自定义服务器名称
            "url": "http://localhost:3100/sse", // 确保端口 (3100) 与您的服务器匹配
            "transport": "sse",
            "autoapprove": ["finance_news", "stock_data", "index_data", "create_note"] // 添加所有需要的工具
          }
        }
        // ... 您可能拥有的任何其他 MCP 服务器
      ]
}
```

**关键配置详情：**
 *   `"finance-data-server"`：这是您在 Cline 中引用服务器时使用的名称。
 *   `"url"`：您的 MCP 服务器将运行的地址。`http://localhost:3100/sse` 是一个常见的默认设置。端口 `3100` 应与您的 Node.js 服务器监听的端口匹配 (如果使用Supergateway)。
 *   `"transport"`：设置为 `"sse"` (服务器发送事件)，这是推荐的通信方法。如果您不使用Supergateway而是直接运行 `node build/index.js`，则此处应为`"stdio"`，且`url`字段应改为`"command"`，值为 `C:/path/to/FinanceMCP/build/index.js` (根据您的实际路径修改)。
 *   `"autoapprove"`：一个工具名称列表，Cline 可以从此服务器使用这些工具而无需每次都明确请求权限。

 ![image](https://github.com/user-attachments/assets/2df71273-10f3-4869-b323-e7492fa86e65)

 *图片说明：`cline_mcp_settings.json` 中 `finance-data-server` 的配置示例 (SSE模式)。*

### 4. Tushare API Token 配置

项目使用一个统一的配置文件（`src/config.js`）管理Tushare API的设置，包括API Token、服务器地址和超时设置。您只需要在这个文件中修改一次配置，所有工具就会自动使用最新设置。

```typescript
// src/config.ts 文件内容
export const TUSHARE_CONFIG = {
  /**
   * Tushare API Token
   * 用户只需在此处修改一次，所有工具都会使用这个值
   */
  API_TOKEN: "您的Tushare API Token",
  
  /**
   * Tushare API 服务器地址
   */
  API_URL: "http://api.tushare.pro",
  
  /**
   * API请求超时时间(毫秒)
   */
  TIMEOUT: 10000
};
```

**重要提示**：如果您计划将此项目公开，强烈建议不要将Token直接硬编码在代码中。更安全的做法是使用环境变量或 `.env` 文件，并确保 `.env` 文件已添加到 `.gitignore`中。

**未来开发计划**: 在未来版本中，我们计划支持从环境变量和配置文件中读取Tushare API设置，使配置更灵活安全。

## 🚀 运行服务器

完成所有设置和配置后：

1.  **构建项目**：
    本项目使用 TypeScript，因此需要编译成 JavaScript：
    ```bash
    npm run build
    ```
    这会将 `src` 目录中的 TypeScript 文件编译到 `build` 目录中。

2.  **启动服务器 (推荐使用 Supergateway)**：
    为了获得更好的调试体验和SSE传输支持，推荐使用 Supergateway：
    ```bash
    npx supergateway --stdio "node build/index.js" --port 3100
    ```
    您应该在终端中看到输出，表明服务器已启动并在端口 `3100` 上监听。

    **或者，直接运行 (stdio 模式，需修改客户端配置)**：
    ```bash
    node build/index.js
    ```
    如果您使用此方法，请确保您的 `cline_mcp_settings.json` 中的 `transport` 设置为 `stdio`，并且 `url` 字段替换为 `command` 指向 `build/index.js` 的路径。

    ![image](https://github.com/user-attachments/assets/97e460b9-f85b-48f2-ab0b-699ea762391f)

    *图片说明：终端输出显示服务器成功启动并在端口 3100 上监听 (Supergateway模式)。*

    在使用服务器期间，请保持此终端窗口打开。关闭它将停止服务器。

## 💡 使用示例：分析平安银行

让我们通过一个示例，演示如何使用此服务器和 Cline 来分析平安银行 (000001.SZ) 的股价。

### 第 1 步：在 Cline 中提出您的问题

打开您的 MCP 客户端 (Cline)，并确保它已连接到您的 `finance-data-server` (或您自定义的名称)。然后您可以提出如下问题：

*“结合最近的新闻给我分析一下平安银行最近的价格会涨吗?”*

![image](https://github.com/user-attachments/assets/adb770ed-1007-4d1e-a706-7def8a541b5c)

*图片说明：在 Cline 中要求分析平安银行股价。*

### 第 2 步：Cline 使用 `stock_data` 工具

Cline 将识别出它需要历史股票数据，并将使用来自您的 `finance-data-server` 的 `stock_data` 工具。

*   **工具调用：** Cline 将向您的服务器发送请求以使用 `stock_data` 工具。
    ![image](https://github.com/user-attachments/assets/99b50cea-9eb8-406a-9513-0156ca56c703)

    *图片说明：传递给 `stock_data` 工具的参数 (例如股票代码、日期范围)。*

*   **服务器响应：** 您的服务器将通过 Tushare API 获取历史股票数据并将其发送回 Cline。
    ![image](https://github.com/user-attachments/assets/d7c822e3-ef08-4fcb-8e36-c2e010bafb73)

    *图片说明：服务器返回的平安银行历史股票数据。*

### 第 3 步：Cline 使用 `finance_news` 工具

接下来，Cline 将确定它需要最近的财经新闻，并将使用 `finance_news` 工具。

*   **工具调用：** Cline 将从您的服务器请求最近的新闻。
    ![image](https://github.com/user-attachments/assets/025b8fba-e8c5-48e1-866f-37c0304fe4d1)

    *图片说明：传递给 `finance_news` 工具的参数 (例如新闻条数、来源)。*

*   **服务器响应：** 您的服务器将通过 Tushare API 获取最新的财经新闻并将其返回给 Cline。
    ![image](https://github.com/user-attachments/assets/dccee7a0-10db-4c5f-9f08-e4f1031096e3)

    *图片说明：服务器返回的近期财经新闻文章。*

### 第 4 步：Cline 生成分析报告

结合历史股票数据和近期新闻，Cline 将综合这些信息以提供分析和预测。

![image](https://github.com/user-attachments/assets/5510e8f0-ea79-4632-a14c-cf08ef87b73c)

*图片说明：Cline 基于 MCP 服务器数据生成的平安银行股价最终分析。*

这个分步过程演示了您的 MCP 服务器如何充当桥梁，为语言模型提供执行复杂任务所需的、通过 Tushare 获取的特定实时数据。

## 🔍 问题排查

*   **服务器无法启动**：
    *   在运行 `npm start` 或 `node build/index.js` (或通过 Supergateway) 时，检查终端中的错误消息。
    *   确保所有依赖项均已安装 (`npm install`)。
    *   如果使用 Supergateway，确保端口 (例如 3100) 未被其他应用程序占用。
*   **Cline 无法连接到服务器**：
    *   验证 `cline_mcp_settings.json` 中的服务器配置 (`url` 和 `transport`，或 `command` 和 `transport`) 是否正确，并与您的服务器运行方式匹配。
    *   检查您的防火墙设置，确保它没有阻止到服务器端口的连接 (如果适用)。
    *   确保您的服务器正在运行 (终端窗口已打开并显示正在监听或相关日志)。
*   **工具不工作 / Cline 中出现错误**：
    *   当 Cline 尝试使用工具时，检查服务器日志 (服务器运行的终端窗口中) 是否有错误消息，特别是与 Tushare API 相关的错误。
    *   验证您的 Tushare API Token 是否有效且具有所需接口的权限。
    *   检查传递给工具的参数是否符合 Tushare API 的要求。
*   **"Module not found" (模块未找到) 错误**：
    *   这通常意味着某个依赖项缺失或未正确安装。尝试再次运行 `npm install`。如果是项目中的特定文件，请检查构建过程 (`npm run build`) 是否成功完成以及文件路径是否正确。
*   **Tushare API 错误**：
    *   仔细阅读服务器日志中来自 Tushare API 的具体错误信息。常见的错误可能包括 Token 无效、参数错误、请求频率过高或没有相应数据接口的权限。请参考 [Tushare API 文档](https://tushare.pro/document/1)进行排查。

## 🚀 未来扩展方向

这个项目有很大的发展潜力！以下是一些未来增强功能的想法：

### 1. 添加数据可视化功能
*   **描述**：集成图表库 (例如 Chart.js、D3.js 或服务器端图像生成)，以允许工具返回数据的可视化表示，例如股价图、趋势线或情感分析图表。
*   **益处**：可视化可以使用户 (和 AI) 更容易一眼看懂复杂数据。
*   **实现思路**：
    *   创建一个新工具，例如 `get_stock_chart_image`。
    *   此工具将接受股票代码和日期范围作为输入。
    *   服务器端使用库生成图表图像 (例如 PNG 或 SVG 格式)。
    *   如果服务器可以托管静态文件，则以 base64 编码的字符串或可公开访问的 URL 形式返回图像。

### 2. 针对特定分析的智能数据检索
*   **描述**：在分析特定股票 (例如平安银行) 或行业时，优先获取与该实体高度相关的数据。这意味着要超越一般新闻，寻找公司特定的公告、行业报告、竞争对手新闻以及相关的宏观经济指标 (许多可以通过 Tushare API 获取)。
*   **益处**：通过关注最具影响力的信息，提供更有针对性和更准确的分析。
*   **实现思路**：
    *   修改现有工具或创建新工具 (例如 `get_company_announcements`、`get_industry_analysis`)，利用 Tushare 提供的更多接口。
    *   这些工具将接受公司股票代码或行业关键词。
    *   服务器将查询相应的 Tushare API 接口。
    *   在将数据返回给 LLM 之前，可能会在服务器端进行初步处理或筛选。

### 3. 情感分析工具
*   **描述**：添加一个工具，对给定的一组新闻文章或金融文本执行情感分析。
*   **益处**：可以快速衡量市场或公众对某只股票或事件的情绪，这是财务分析中的一个有用因素。
*   **实现思路**：
    *   创建一个新工具，例如 `analyze_news_sentiment`。
    *   此工具可以接受新闻标题/摘要列表 (例如从 `finance_news` 工具获取)。
    *   服务器端使用 NLP 库 (例如 TensorFlow.js, Brain.js, 或者调用外部NLP服务) 计算情感得分。
    *   返回聚合的情感或单个得分。

### 4. 扩展 Tushare 数据源
*   **描述**：集成 Tushare API 提供的更多样化的金融数据，如财务报表、基金数据、期货期权等。
*   **益处**：为更全面的分析提供更丰富的数据集。
*   **实现思路**：
    *   根据 [Tushare 数据接口文档](https://tushare.pro/document/2) 创建新的工具。
    *   例如，添加 `get_financial_statement` (获取财报)、`get_fund_nav` (获取基金净值) 等工具。

### 5. 实时数据流 (高级)
*   **描述**：对于某些工具，实现实时数据流功能，而不仅仅是请求-响应模式 (Tushare 本身可能不直接支持所有数据的实时流，但可以模拟高频轮询)。
*   **益处**：允许监控实时市场变化或新闻更新。
*   **实现思路**：
    *   探索为 `monitor_stock_price` 或 `stream_breaking_news` 等工具使用 WebSockets 或增强 SSE 传输以实现连续数据馈送。
    *   这需要仔细处理连接管理和 Tushare API 的调用频率限制。

## 🤝 贡献代码

欢迎贡献代码！如果您有改进建议、新功能想法或错误修复，请随时：

1.  Fork 本仓库：[https://github.com/guangxiangdebizi/FinanceMCP/](https://github.com/guangxiangdebizi/FinanceMCP/)
2.  为您的功能创建一个新分支 (`git checkout -b feature/your-feature-name`)。
3.  进行更改。
4.  提交您的更改 (`git commit -m 'Add some amazing feature'`)。
5.  将分支推送到远程仓库 (`git push origin feature/your-feature-name`)。
6.  发起一个 Pull Request。

请确保酌情更新测试。

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE.md) 发布。 
