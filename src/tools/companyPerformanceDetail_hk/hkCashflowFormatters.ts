// 港股现金流量表数据格式化器

export interface HkCashflowItem {
  ts_code: string;
  end_date: string;
  name: string;
  ind_name: string;
  ind_value: number;
}

// 格式化港股现金流量表数据
export function formatHkCashflowData(data: HkCashflowItem[], ts_code: string, dataType: string) {
  if (!data || data.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `# ${ts_code} 港股现金流量表数据\n\n❌ 未找到相关数据`
        }
      ]
    };
  }

  // 获取股票名称
  const stockName = data[0]?.name || ts_code;
  
  // 按报告期分组
  const groupedByPeriod = groupByPeriod(data);
  
  let content = `# ${stockName} (${ts_code}) 港股现金流量表数据\n\n`;
  
  // 按报告期展示数据
  for (const [period, items] of Object.entries(groupedByPeriod)) {
    content += `## 📊 ${formatPeriod(period)} 现金流量表\n\n`;
    
    // 分类展示现金流数据
    const categorizedData = categorizeCashflowItems(items);
    
    // 经营活动现金流
    if (categorizedData.operating.length > 0) {
      content += `### 💼 经营活动现金流\n\n`;
      content += `| 现金流项目 | 金额(港币) | 备注 |\n`;
      content += `|---------|-----------|------|\n`;
      
      for (const item of categorizedData.operating) {
        const formattedValue = formatCurrency(item.ind_value);
        content += `| **${item.ind_name}** | ${formattedValue} | 经营活动 |\n`;
      }
      content += `\n`;
    }
    
    // 投资活动现金流
    if (categorizedData.investing.length > 0) {
      content += `### 📈 投资活动现金流\n\n`;
      content += `| 现金流项目 | 金额(港币) | 备注 |\n`;
      content += `|---------|-----------|------|\n`;
      
      for (const item of categorizedData.investing) {
        const formattedValue = formatCurrency(item.ind_value);
        content += `| **${item.ind_name}** | ${formattedValue} | 投资活动 |\n`;
      }
      content += `\n`;
    }
    
    // 筹资活动现金流
    if (categorizedData.financing.length > 0) {
      content += `### 🏦 筹资活动现金流\n\n`;
      content += `| 现金流项目 | 金额(港币) | 备注 |\n`;
      content += `|---------|-----------|------|\n`;
      
      for (const item of categorizedData.financing) {
        const formattedValue = formatCurrency(item.ind_value);
        content += `| **${item.ind_name}** | ${formattedValue} | 筹资活动 |\n`;
      }
      content += `\n`;
    }
    
    // 其他现金流项目
    if (categorizedData.others.length > 0) {
      content += `### 🔄 其他现金流项目\n\n`;
      content += `| 现金流项目 | 金额(港币) | 备注 |\n`;
      content += `|---------|-----------|------|\n`;
      
      for (const item of categorizedData.others) {
        const formattedValue = formatCurrency(item.ind_value);
        content += `| **${item.ind_name}** | ${formattedValue} | 其他项目 |\n`;
      }
      content += `\n`;
    }
    
    // 添加现金流关键指标分析
    content += generateCashflowKeyMetrics(items, period);
    content += `\n---\n\n`;
  }
  
  // 添加数据说明
  content += `\n## 📋 数据说明\n\n`;
  content += `- **数据来源**: Tushare港股财务数据\n`;
  content += `- **货币单位**: 港币\n`;
  content += `- **更新时间**: ${new Date().toLocaleDateString('zh-CN')}\n`;
  content += `- **数据条数**: ${data.length} 条现金流项目数据\n`;

  return {
    content: [
      {
        type: "text",
        text: content
      }
    ]
  };
}

// 按报告期分组数据
function groupByPeriod(data: HkCashflowItem[]): { [period: string]: HkCashflowItem[] } {
  return data.reduce((groups, item) => {
    const period = item.end_date;
    if (!groups[period]) {
      groups[period] = [];
    }
    groups[period].push(item);
    return groups;
  }, {} as { [period: string]: HkCashflowItem[] });
}

// 格式化报告期显示
function formatPeriod(period: string): string {
  if (!period || period.length !== 8) return period;
  
  const year = period.substring(0, 4);
  const month = period.substring(4, 6);
  const day = period.substring(6, 8);
  
  if (month === '12' && day === '31') {
    return `${year}年年报`;
  } else if (month === '06' && day === '30') {
    return `${year}年中报`;
  } else if (month === '09' && day === '30') {
    return `${year}年三季报`;
  } else if (month === '03' && day === '31') {
    return `${year}年一季报`;
  } else {
    return `${year}-${month}-${day}`;
  }
}

// 格式化货币金额
function formatCurrency(value: number): string {
  if (value === null || value === undefined) return 'N/A';
  
  const absValue = Math.abs(value);
  let formatted: string;
  let unit: string;
  
  if (absValue >= 1e12) {
    formatted = (value / 1e12).toFixed(2);
    unit = '万亿';
  } else if (absValue >= 1e8) {
    formatted = (value / 1e8).toFixed(2);
    unit = '亿';
  } else if (absValue >= 1e4) {
    formatted = (value / 1e4).toFixed(2);
    unit = '万';
  } else {
    formatted = value.toFixed(2);
    unit = '';
  }
  
  return `${formatted}${unit}`;
}

// 分类现金流量表项目
function categorizeCashflowItems(items: HkCashflowItem[]) {
  const operating: HkCashflowItem[] = [];
  const investing: HkCashflowItem[] = [];
  const financing: HkCashflowItem[] = [];
  const others: HkCashflowItem[] = [];
  
  for (const item of items) {
    const category = getCashflowCategory(item.ind_name);
    if (category === 'operating') {
      operating.push(item);
    } else if (category === 'investing') {
      investing.push(item);
    } else if (category === 'financing') {
      financing.push(item);
    } else {
      others.push(item);
    }
  }
  
  return { operating, investing, financing, others };
}

// 获取现金流量表科目分类
function getCashflowCategory(indName: string): string {
  const operatingKeywords = [
    '经营活动', '营业收入', '客户款项', '供应商款项', '员工成本', 
    '营运资金', '经营业务', '税项', '利息收入', '股息收入'
  ];
  
  const investingKeywords = [
    '投资活动', '购买物业', '出售物业', '投资支出', '投资收入',
    '收购', '出售', '资本支出', '设备', '投资证券'
  ];
  
  const financingKeywords = [
    '筹资活动', '股份发行', '借款', '偿还', '股息支付',
    '债务', '融资', '股本', '借贷', '回购'
  ];
  
  for (const keyword of operatingKeywords) {
    if (indName.includes(keyword)) return 'operating';
  }
  
  for (const keyword of investingKeywords) {
    if (indName.includes(keyword)) return 'investing';
  }
  
  for (const keyword of financingKeywords) {
    if (indName.includes(keyword)) return 'financing';
  }
  
  return 'other';
}

// 生成现金流关键指标分析
function generateCashflowKeyMetrics(items: HkCashflowItem[], period: string): string {
  const metrics: { [key: string]: number | null } = {};
  
  // 提取关键指标
  items.forEach(item => {
    metrics[item.ind_name] = item.ind_value;
  });
  
  let analysis = `### 📈 ${formatPeriod(period)} 现金流关键指标\n\n`;
  
  // 经营活动现金流净额
  const operatingCashFlow = findMetricByKeywords(metrics, [
    '经营活动产生的现金流量净额', '经营活动现金流净额', '营运资金变动'
  ]);
  if (operatingCashFlow) {
    analysis += `- **经营活动现金流净额**: ${formatCurrency(operatingCashFlow)}\n`;
  }
  
  // 投资活动现金流净额
  const investingCashFlow = findMetricByKeywords(metrics, [
    '投资活动产生的现金流量净额', '投资活动现金流净额'
  ]);
  if (investingCashFlow) {
    analysis += `- **投资活动现金流净额**: ${formatCurrency(investingCashFlow)}\n`;
  }
  
  // 筹资活动现金流净额
  const financingCashFlow = findMetricByKeywords(metrics, [
    '筹资活动产生的现金流量净额', '筹资活动现金流净额'
  ]);
  if (financingCashFlow) {
    analysis += `- **筹资活动现金流净额**: ${formatCurrency(financingCashFlow)}\n`;
  }
  
  // 现金及现金等价物净增加额
  const netCashChange = findMetricByKeywords(metrics, [
    '现金及现金等价物净增加额', '现金净增加额', '现金变动净额'
  ]);
  if (netCashChange) {
    analysis += `- **现金净增加额**: ${formatCurrency(netCashChange)}\n`;
  }
  
  // 自由现金流（经营现金流 - 资本支出）
  const capex = findMetricByKeywords(metrics, ['资本支出', '购买物业、设备']);
  if (operatingCashFlow && capex) {
    const freeCashFlow = operatingCashFlow + capex; // capex通常为负数
    analysis += `- **自由现金流**: ${formatCurrency(freeCashFlow)}\n`;
  }
  
  return analysis;
}

// 根据关键词查找指标值
function findMetricByKeywords(metrics: { [key: string]: number | null }, keywords: string[]): number | null {
  for (const [key, value] of Object.entries(metrics)) {
    for (const keyword of keywords) {
      if (key.includes(keyword)) {
        return value;
      }
    }
  }
  return null;
} 