import { TUSHARE_CONFIG } from '../config.js';
import { formatHkIncomeData } from './companyPerformanceDetail_hk/hkIncomeFormatters.js';
import { formatHkBalanceData } from './companyPerformanceDetail_hk/hkBalanceFormatters.js';
import { formatHkCashflowData } from './companyPerformanceDetail_hk/hkCashflowFormatters.js';
export const companyPerformance_hk = {
    name: "company_performance_hk",
    description: "获取港股上市公司综合表现数据，包括利润表、资产负债表、现金流量表等财务报表数据",
    parameters: {
        type: "object",
        properties: {
            ts_code: {
                type: "string",
                description: "港股代码，如'00700.HK'表示腾讯控股，'00939.HK'表示建设银行"
            },
            data_type: {
                type: "string",
                description: "数据类型：income(利润表)、balance(资产负债表)、cashflow(现金流量表)",
                enum: ["income", "balance", "cashflow"]
            },
            start_date: {
                type: "string",
                description: "起始日期，格式为YYYYMMDD，如'20230101'"
            },
            end_date: {
                type: "string",
                description: "结束日期，格式为YYYYMMDD，如'20231231'"
            },
            period: {
                type: "string",
                description: "特定报告期，格式为YYYYMMDD，如'20231231'表示2023年年报。指定此参数时将忽略start_date和end_date"
            },
            ind_name: {
                type: "string",
                description: "指定财务科目名称，如'营业额'、'毛利'、'除税后溢利'等，不指定则返回全部科目"
            }
        },
        required: ["ts_code", "data_type", "start_date", "end_date"]
    },
    async run(args) {
        try {
            console.log('港股公司综合表现查询参数:', args);
            const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
            const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
            if (!TUSHARE_API_KEY) {
                throw new Error('请配置TUSHARE_TOKEN环境变量');
            }
            // 根据data_type选择对应的接口
            let apiInterface = '';
            let formatFunction = null;
            switch (args.data_type) {
                case 'income':
                    apiInterface = 'hk_income';
                    formatFunction = formatHkIncomeData;
                    break;
                case 'balance':
                    apiInterface = 'hk_balancesheet';
                    formatFunction = formatHkBalanceData;
                    break;
                case 'cashflow':
                    apiInterface = 'hk_cashflow';
                    formatFunction = formatHkCashflowData;
                    break;
                default:
                    throw new Error(`不支持的数据类型: ${args.data_type}`);
            }
            const result = await fetchHkFinancialData(apiInterface, args.ts_code, args.period, args.start_date, args.end_date, args.ind_name, TUSHARE_API_KEY, TUSHARE_API_URL);
            if (!result.data || result.data.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `# ${args.ts_code} 港股${getDataTypeName(args.data_type)}数据\n\n❌ 未找到相关数据，请检查股票代码或日期范围`
                        }
                    ]
                };
            }
            // 使用对应的格式化函数
            if (formatFunction) {
                const formattedResult = formatFunction(result.data, args.ts_code, args.data_type);
                return formattedResult;
            }
            else {
                // 如果没有实现格式化器，返回原始数据
                return {
                    content: [
                        {
                            type: "text",
                            text: `# ${args.ts_code} 港股${getDataTypeName(args.data_type)}数据\n\n⚠️ 格式化器待实现，以下为原始数据：\n\n${JSON.stringify(result.data, null, 2)}`
                        }
                    ]
                };
            }
        }
        catch (error) {
            console.error('港股公司业绩查询错误:', error);
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ 港股公司业绩查询失败: ${error instanceof Error ? error.message : String(error)}`
                    }
                ],
                isError: true
            };
        }
    }
};
// 获取数据类型中文名称
function getDataTypeName(dataType) {
    const names = {
        'income': '利润表',
        'balance': '资产负债表',
        'cashflow': '现金流量表'
    };
    return names[dataType] || dataType;
}
// 通用的港股财务数据获取函数
async function fetchHkFinancialData(apiInterface, ts_code, period, start_date, end_date, ind_name, apiKey, apiUrl) {
    const requestData = {
        api_name: apiInterface,
        token: apiKey,
        params: {
            ts_code: ts_code
        }
    };
    // 根据是否指定period来设置参数
    if (period) {
        requestData.params.period = period;
    }
    else if (start_date && end_date) {
        requestData.params.start_date = start_date;
        requestData.params.end_date = end_date;
    }
    // 如果指定了具体的财务科目
    if (ind_name) {
        requestData.params.ind_name = ind_name;
    }
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(TUSHARE_CONFIG.TIMEOUT)
    });
    if (!response.ok) {
        throw new Error(`Tushare API请求失败: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`Tushare API错误: ${data.msg || '未知错误'}`);
    }
    // 将返回的数组格式转换为对象数组
    const items = [];
    if (data.data && data.data.items && data.data.items.length > 0) {
        const fields = data.data.fields;
        for (const item of data.data.items) {
            const obj = {};
            fields.forEach((field, index) => {
                obj[field] = item[index];
            });
            items.push(obj);
        }
    }
    return { data: items };
}
