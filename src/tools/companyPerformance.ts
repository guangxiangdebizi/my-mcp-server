import { TUSHARE_CONFIG } from '../config.js';

export const companyPerformance = {
  name: "company_performance",
  description: "获取上市公司全面的财务表现数据，包括利润表、资产负债表、现金流量表、业绩预告、业绩快报、财务指标和分红送股数据",
  parameters: {
    type: "object",
    properties: {
      ts_code: {
        type: "string",
        description: "股票代码，如'000001.SZ'表示平安银行，'600000.SH'表示浦发银行"
      },
      data_type: {
        type: "string",
        description: "数据类型，可选值：income(利润表)、balance(资产负债表)、cashflow(现金流量表)、forecast(业绩预告)、express(业绩快报)、indicators(财务指标)、dividend(分红送股)、all(全部数据)",
        enum: ["income", "balance", "cashflow", "forecast", "express", "indicators", "dividend", "all"]
      },
      period: {
        type: "string",
        description: "报告期，格式为YYYYMMDD，如'20231231'表示2023年年报，'20230930'表示2023年三季报"
      },
      start_date: {
        type: "string",
        description: "起始日期，格式为YYYYMMDD，如'20230101'"
      },
      end_date: {
        type: "string",
        description: "结束日期，格式为YYYYMMDD，如'20231231'"
      },
      report_type: {
        type: "string",
        description: "报告类型，可选值：1(合并报表)、2(单季合并)、3(调整单季合并表)、4(调整合并报表)、5(调整前合并报表)，默认为1",
        enum: ["1", "2", "3", "4", "5"]
      },
      fields: {
        type: "string",
        description: "指定返回的字段，多个字段用逗号分隔。如果不指定，将返回该数据类型的主要字段"
      }
    },
    required: ["ts_code", "data_type"]
  },
  async run(args: { 
    ts_code: string; 
    data_type: string; 
    period?: string; 
    start_date?: string; 
    end_date?: string; 
    report_type?: string;
    fields?: string;
  }) {
    try {
      console.log('公司财务表现查询参数:', args);
      
      const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
      const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
      
      if (!TUSHARE_API_KEY) {
        throw new Error('请配置TUSHARE_TOKEN环境变量');
      }

      // 默认日期设置
      const today = new Date();
      const currentYear = today.getFullYear();
      const defaultEndDate = `${currentYear}1231`;
      const defaultStartDate = `${currentYear - 2}0101`;

      const results: any[] = [];

      // 根据data_type决定要查询的API
      const dataTypes = args.data_type === 'all' 
        ? ['income', 'balance', 'cashflow', 'forecast', 'express', 'indicators', 'dividend']
        : [args.data_type];

      for (const dataType of dataTypes) {
        try {
          const result = await fetchFinancialData(
            dataType,
            args.ts_code,
            args.period,
            args.start_date || defaultStartDate,
            args.end_date || defaultEndDate,
            args.report_type || '1',
            args.fields,
            TUSHARE_API_KEY,
            TUSHARE_API_URL
          );
          
          if (result.data && result.data.length > 0) {
            results.push({
              type: dataType,
              data: result.data,
              fields: result.fields
            });
          }
        } catch (error) {
          console.warn(`获取${dataType}数据失败:`, error);
          results.push({
            type: dataType,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      if (results.length === 0) {
        throw new Error(`未找到股票${args.ts_code}的财务数据`);
      }

      // 格式化输出
      const formattedOutput = formatFinancialData(results, args.ts_code);
      
      return {
        content: [{ type: "text", text: formattedOutput }]
      };

    } catch (error) {
      console.error('公司财务表现查询错误:', error);
      return {
        content: [{ 
          type: "text", 
          text: `查询公司财务表现数据时发生错误: ${error instanceof Error ? error.message : '未知错误'}` 
        }]
      };
    }
  }
};

// 获取财务数据的通用函数
async function fetchFinancialData(
  dataType: string,
  tsCode: string,
  period?: string,
  startDate?: string,
  endDate?: string,
  reportType?: string,
  fields?: string,
  apiKey?: string,
  apiUrl?: string
) {
  const apiConfigs: Record<string, any> = {
    income: {
      api_name: "income",
      default_fields: "ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,total_revenue,revenue,int_income,prem_earned,comm_income,n_commis_income,n_oth_income,n_oth_b_income,prem_income,out_prem,une_prem_reser,reins_income,n_sec_tb_income,n_sec_uw_income,n_asset_mg_income,oth_b_income,fv_value_chg_gain,invest_income,ass_invest_income,forex_gain,total_cogs,oper_cost,int_exp,comm_exp,biz_tax_surchg,sell_exp,admin_exp,fin_exp,assets_impair_loss,prem_refund,compens_payout,reser_insur_liab,div_payt,reins_exp,oper_exp,compens_payout_refu,insur_reser_refu,reins_cost_refund,other_bus_cost,operate_profit,non_oper_income,non_oper_exp,nca_disploss,total_profit,income_tax,n_income,n_income_attr_p,minority_gain,oth_compr_income,t_compr_income,compr_inc_attr_p,compr_inc_attr_m_s,ebit,ebitda,insurance_exp,undist_profit,distable_profit,rd_exp,fin_exp_int_exp,fin_exp_int_inc,transfer_surplus_rese,transfer_housing_imprest,transfer_oth,adj_lossgain,withdra_legal_surplus,withdra_legal_pubfunds,withdra_biz_devfunds,withdra_rese_fund,withdra_oth_ersu,workers_welfare,distr_profit_shrhder,prfshare_payable_dvd,comshare_payable_dvd,capit_comstock_div,continued_net_profit,end_net_profit"
    },
    balance: {
      api_name: "balancesheet",
      default_fields: "ts_code,ann_date,f_ann_date,end_date,report_type,comp_type,total_share,cap_rese,undistr_porfit,surplus_rese,special_rese,money_cap,trad_asset,notes_receiv,accounts_receiv,oth_receiv,prepayment,div_receiv,int_receiv,inventories,amor_exp,nca_within_1y,sett_rsrv,loanto_oth_bank_fi,premium_receiv,reinsur_receiv,reinsur_res_receiv,pur_resale_fa,oth_cur_assets,total_cur_assets,fa_avail_for_sale,htm_invest,lt_eqt_invest,invest_real_estate,time_deposits,oth_assets,lt_rec,fix_assets,cip,const_materials,fixed_assets_disp,produc_bio_assets,oil_and_gas_assets,intan_assets,r_and_d,goodwill,lt_amor_exp,defer_tax_assets,decr_in_disbur,oth_nca,total_nca,cash_reser_cb,depos_in_oth_bfi,prec_metals,deriv_assets,rr_reinsur_une_prem,rr_reinsur_outsrnd_cla,rr_reinsur_lins_liab,rr_reinsur_lthins_liab,refund_depos,ph_pledge_loans,receiv_invest,receiv_cap_contrib,insurance_cont_reserves,receiv_reinsur_res,receiv_reinsur_cont_res,oth_assets_special,total_assets,short_loan,trad_liab,notes_payable,acct_payable,adv_receipts,sold_for_repur_fa,comm_payable,payroll_payable,taxes_payable,int_payable,div_payable,oth_payable,acc_exp,deferred_inc,st_bonds_payable,payable_to_reinsurer,rsrv_insur_cont,acting_trading_sec,acting_uw_sec,non_cur_liab_due_1y,oth_cur_liab,total_cur_liab,bond_payable,lt_payable,specific_payables,estimated_liab,defer_tax_liab,defer_inc_non_cur_liab,oth_ncl,total_ncl,depos_oth_bfi,deriv_liab,depos,agency_bus_liab,oth_liab,prem_receiv_adva,depos_received,ph_invest,reser_une_prem,reser_outstd_claims,reser_lins_liab,reser_lthins_liab,indept_acc_liab,pledge_borr,indem_payable,policy_div_payable,total_liab,treasury_share,ordin_risk_reser,forex_differ,invest_loss_unconf,minority_int,total_hldr_eqy_exc_min_int,total_hldr_eqy_inc_min_int,total_liab_hldr_eqy,lt_payroll_payable,oth_comp_income,oth_eqt_tools,oth_eqt_tools_p_shr,lending_funds,acc_receivable,st_fin_payable,payables"
    },
    cashflow: {
      api_name: "cashflow",
      default_fields: "ts_code,ann_date,f_ann_date,end_date,comp_type,report_type,net_profit,finan_exp,c_fr_sale_sg,recp_tax_rends,n_depos_incr_fi,n_incr_loans_cb,n_inc_borr_oth_fi,prem_fr_orig_contr,n_incr_insured_dep,n_reinsur_prem,n_incr_disp_tfa,ifc_cash_incr,n_incr_disp_faas,n_incr_disc_rec,pay_orig_inco,pay_workers_prof,pay_all_typ_tax,n_incr_clt_loan_adv,n_incr_dep_cbob,c_pay_acq_const_fiolta,c_paid_invest,n_incr_pledge_loan,c_pay_dividcash_profit,c_pay_dist_dpcp,c_pay_int_fuloan,c_pay_oth_oper_act,c_inf_fr_oper_act,n_cashflow_act,oth_recp_ral_inv_act,c_disp_withdrwl_invest,c_recp_return_invest,n_recp_disp_fiolta,n_recp_disp_sobu,stot_inflows_inv_act,c_pay_acq_const_fiolta,c_paid_invest,n_incr_impawn_loan,c_pay_oth_inv_act,n_cashflow_inv_act,stot_outflows_inv_act,n_cashflow_inv_act,c_recp_borrow,proc_issue_bonds,oth_cash_recp_ral_fnc_act,stot_inflows_fnc_act,free_cashflow,c_prepay_amt_borr,c_pay_dist_dpcp,procs_repay_borr,c_pay_int_fuloan,c_pay_oth_fnc_act,stot_outflows_fnc_act,n_cash_flows_fnc_act,eff_fx_flu_cash,n_incr_cash_cash_equ,c_cash_equ_beg_period,c_cash_equ_end_period,c_recp_cap_contrib,incr_depr_reserves,depr_fa_coga_dpba,amort_intang_assets,lt_amort_deferred_exp,decr_deferred_exp,incr_acc_exp,loss_disp_fiolta,loss_scr_fa,loss_fv_chg,invest_loss,decr_def_inc_tax_assets,incr_def_inc_tax_liab,decr_inventories,decr_oper_payable,incr_oper_payable,others,im_net_cashflow_oper_act,conv_debt_into_cap,conv_copbonds_due_within_1y,fa_fnc_leases,end_bal_cash,beg_bal_cash,end_bal_cash_equ,beg_bal_cash_equ,im_n_incr_cash_equ"
    },
    forecast: {
      api_name: "forecast",
      default_fields: "ts_code,ann_date,end_date,type,p_change_min,p_change_max,net_profit_min,net_profit_max,last_parent_net,first_ann_date,summary,change_reason"
    },
    express: {
      api_name: "express",
      default_fields: "ts_code,ann_date,end_date,revenue,operate_profit,total_profit,n_income,total_assets,total_hldr_eqy_exc_min_int,diluted_eps,diluted_roe,yoy_net_profit,bps,yoy_sales,yoy_op,yoy_tp,yoy_dedu_np,yoy_eps,yoy_roe,growth_assets,yoy_equity,growth_bps,or_last_year,op_last_year,tp_last_year,np_last_year,eps_last_year,open_net_assets,open_bps,perf_summary,is_audit,remark"
    },
    indicators: {
      api_name: "fina_indicator",
      default_fields: "ts_code,ann_date,end_date,eps,dt_eps,total_revenue_ps,revenue_ps,capital_rese_ps,surplus_rese_ps,undist_profit_ps,extra_item,profit_dedt,gross_margin,current_ratio,quick_ratio,cash_ratio,invturn_days,arturn_days,inv_turn,ar_turn,ca_turn,fa_turn,assets_turn,op_income,valuechange_income,interst_income,daa,ebit,ebitda,fcff,fcfe,current_exint,noncurrent_exint,interestdebt,netdebt,tangible_asset,working_capital,networking_capital,invest_capital,retained_earnings,diluted2_eps,bps,ocfps,retainedps,cfps,ebit_ps,fcff_ps,fcfe_ps,netprofit_margin,grossprofit_margin,cogs_of_sales,expense_of_sales,profit_to_gr,saleexp_to_gr,adminexp_of_gr,finaexp_of_gr,impai_ttm,gc_of_gr,op_of_gr,ebit_of_gr,roe,roe_waa,roe_dt,roa,npta,roic,roe_yearly,roa_yearly,roe_avg,opincome_of_ebt,investincome_of_ebt,n_op_profit_of_ebt,tax_to_ebt,dtprofit_to_profit,salescash_to_or,ocf_to_or,ocf_to_opincome,capitalized_to_da,debt_to_assets,assets_to_eqt,dp_assets_to_eqt,ca_to_assets,nca_to_assets,tbassets_to_totalassets,int_to_talcap,eqt_to_talcapital,currentdebt_to_debt,longdeb_to_debt,ocf_to_shortdebt,debt_to_eqt,eqt_to_debt,eqt_to_interestdebt,tangibleasset_to_debt,tangasset_to_intdebt,tangibleasset_to_netdebt,ocf_to_debt,ocf_to_interestdebt,ocf_to_netdebt,ebit_to_interest,longdebt_to_workingcapital,ebitda_to_debt,turn_days,roa_yearly,roa_dp,fixed_assets,profit_prefin_exp,non_op_profit,op_to_ebt,nop_to_ebt,ocf_to_profit,cash_to_liqdebt,cash_to_liqdebt_withinterest,op_to_liqdebt,op_to_debt,roic_yearly,total_fa_trun,profit_to_op,q_opincome,q_investincome,q_dtprofit,q_eps,q_netprofit_margin,q_gsprofit_margin,q_exp_to_sales,q_profit_to_gr,q_saleexp_to_gr,q_adminexp_to_gr,q_finaexp_to_gr,q_impair_to_gr_ttm,q_gc_to_gr,q_op_to_gr,q_roe,q_dt_roe,q_npta,q_ocf_to_sales,q_ocf_to_or,basic_eps_yoy,dt_eps_yoy,cfps_yoy,op_yoy,ebt_yoy,netprofit_yoy,dt_netprofit_yoy,ocf_yoy,roe_yoy,bps_yoy,assets_yoy,eqt_yoy,tr_yoy,or_yoy,q_gr_yoy,q_gr_qoq,q_sales_yoy,q_sales_qoq,q_op_yoy,q_op_qoq,q_profit_yoy,q_profit_qoq,q_netprofit_yoy,q_netprofit_qoq,equity_yoy,rd_exp,update_flag"
    },
    dividend: {
      api_name: "dividend",
      default_fields: "ts_code,end_date,ann_date,div_proc,stk_div,stk_bo_rate,stk_co_rate,cash_div,cash_div_tax,record_date,ex_date,pay_date,div_listdate,imp_ann_date,base_date,base_share"
    }
  };

  const config = apiConfigs[dataType];
  if (!config) {
    throw new Error(`不支持的数据类型: ${dataType}`);
  }

  // 构建请求参数
  const params: any = {
    api_name: config.api_name,
    token: apiKey,
    params: {
      ts_code: tsCode
    },
    fields: fields || config.default_fields
  };

  // 根据不同的API添加特定参数
  if (['income', 'balance', 'cashflow', 'indicators'].includes(dataType)) {
    if (period) {
      params.params.period = period;
    } else {
      if (startDate) params.params.start_date = startDate;
      if (endDate) params.params.end_date = endDate;
    }
    if (reportType) params.params.report_type = reportType;
  } else if (['forecast', 'express'].includes(dataType)) {
    if (startDate) params.params.start_date = startDate;
    if (endDate) params.params.end_date = endDate;
  } else if (dataType === 'dividend') {
    if (startDate) params.params.start_date = startDate;
    if (endDate) params.params.end_date = endDate;
  }

  console.log(`请求${dataType}数据，API: ${config.api_name}，参数:`, params.params);

  // 设置请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);

  try {
    const response = await fetch(apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Tushare API请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`Tushare API错误: ${data.msg}`);
    }

    if (!data.data || !data.data.items || data.data.items.length === 0) {
      return { data: [], fields: [] };
    }

    // 获取字段名
    const fieldsArray = data.data.fields;

    // 将数据转换为对象数组
    const resultData = data.data.items.map((item: any) => {
      const result: Record<string, any> = {};
      fieldsArray.forEach((field: string, index: number) => {
        result[field] = item[index];
      });
      return result;
    });

    console.log(`成功获取到${resultData.length}条${dataType}数据记录`);
    return { data: resultData, fields: fieldsArray };

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 格式化财务数据输出
function formatFinancialData(results: any[], tsCode: string): string {
  let output = `# 📊 ${tsCode} 公司财务表现分析\n\n`;

  const dataTypeNames: Record<string, string> = {
    income: '📈 利润表',
    balance: '⚖️ 资产负债表',
    cashflow: '💰 现金流量表',
    forecast: '🔮 业绩预告',
    express: '⚡ 业绩快报',
    indicators: '📊 财务指标',
    dividend: '💵 分红送股'
  };

  for (const result of results) {
    const typeName = dataTypeNames[result.type] || result.type;
    output += `## ${typeName}\n\n`;

    if (result.error) {
      output += `❌ 获取失败: ${result.error}\n\n`;
      continue;
    }

    if (!result.data || result.data.length === 0) {
      output += `ℹ️ 暂无数据\n\n`;
      continue;
    }

    // 根据不同数据类型格式化输出
    switch (result.type) {
      case 'income':
        output += formatIncomeStatement(result.data);
        break;
      case 'balance':
        output += formatBalanceSheet(result.data);
        break;
      case 'cashflow':
        output += formatCashFlow(result.data);
        break;
      case 'forecast':
        output += formatForecast(result.data);
        break;
      case 'express':
        output += formatExpress(result.data);
        break;
      case 'indicators':
        output += formatIndicators(result.data);
        break;
      case 'dividend':
        output += formatDividend(result.data);
        break;
      default:
        output += formatGenericData(result.data, result.fields);
    }

    output += '\n---\n\n';
  }

  return output;
}

// 格式化利润表数据
function formatIncomeStatement(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) { // 显示最近5期数据
    output += `### ${item.end_date || item.period} 期间\n`;
    output += `**公告日期**: ${item.ann_date || 'N/A'}  **实际公告日期**: ${item.f_ann_date || 'N/A'}\n\n`;
    
    if (item.total_revenue) output += `**营业总收入**: ${formatNumber(item.total_revenue)} 万元\n`;
    if (item.revenue) output += `**营业收入**: ${formatNumber(item.revenue)} 万元\n`;
    if (item.total_cogs) output += `**营业总成本**: ${formatNumber(item.total_cogs)} 万元\n`;
    if (item.operate_profit) output += `**营业利润**: ${formatNumber(item.operate_profit)} 万元\n`;
    if (item.total_profit) output += `**利润总额**: ${formatNumber(item.total_profit)} 万元\n`;
    if (item.n_income) output += `**净利润**: ${formatNumber(item.n_income)} 万元\n`;
    if (item.n_income_attr_p) output += `**归属于母公司净利润**: ${formatNumber(item.n_income_attr_p)} 万元\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化资产负债表数据
function formatBalanceSheet(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) {
    output += `### ${item.end_date || item.period} 期间\n`;
    output += `**公告日期**: ${item.ann_date || 'N/A'}  **实际公告日期**: ${item.f_ann_date || 'N/A'}\n\n`;
    
    if (item.total_assets) output += `**资产总计**: ${formatNumber(item.total_assets)} 万元\n`;
    if (item.total_cur_assets) output += `**流动资产合计**: ${formatNumber(item.total_cur_assets)} 万元\n`;
    if (item.total_nca) output += `**非流动资产合计**: ${formatNumber(item.total_nca)} 万元\n`;
    if (item.total_liab) output += `**负债合计**: ${formatNumber(item.total_liab)} 万元\n`;
    if (item.total_cur_liab) output += `**流动负债合计**: ${formatNumber(item.total_cur_liab)} 万元\n`;
    if (item.total_hldr_eqy_exc_min_int) output += `**股东权益合计**: ${formatNumber(item.total_hldr_eqy_exc_min_int)} 万元\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化现金流量表数据
function formatCashFlow(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) {
    output += `### ${item.end_date || item.period} 期间\n`;
    output += `**公告日期**: ${item.ann_date || 'N/A'}  **实际公告日期**: ${item.f_ann_date || 'N/A'}\n\n`;
    
    if (item.n_cashflow_act) output += `**经营活动现金流量净额**: ${formatNumber(item.n_cashflow_act)} 万元\n`;
    if (item.n_cashflow_inv_act) output += `**投资活动现金流量净额**: ${formatNumber(item.n_cashflow_inv_act)} 万元\n`;
    if (item.n_cash_flows_fnc_act) output += `**筹资活动现金流量净额**: ${formatNumber(item.n_cash_flows_fnc_act)} 万元\n`;
    if (item.n_incr_cash_cash_equ) output += `**现金及现金等价物净增加额**: ${formatNumber(item.n_incr_cash_cash_equ)} 万元\n`;
    if (item.c_cash_equ_end_period) output += `**期末现金及现金等价物余额**: ${formatNumber(item.c_cash_equ_end_period)} 万元\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化业绩预告数据
function formatForecast(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 10)) {
    output += `### ${item.end_date} 期间预告\n`;
    output += `**公告日期**: ${item.ann_date}  **预告类型**: ${getForecastType(item.type)}\n`;
    
    if (item.p_change_min !== null && item.p_change_max !== null) {
      output += `**净利润变动幅度**: ${item.p_change_min}% ~ ${item.p_change_max}%\n`;
    }
    if (item.net_profit_min !== null && item.net_profit_max !== null) {
      output += `**预计净利润**: ${formatNumber(item.net_profit_min)} ~ ${formatNumber(item.net_profit_max)} 万元\n`;
    }
    if (item.last_parent_net) output += `**上年同期净利润**: ${formatNumber(item.last_parent_net)} 万元\n`;
    if (item.summary) output += `**业绩预告摘要**: ${item.summary}\n`;
    if (item.change_reason) output += `**变动原因**: ${item.change_reason}\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化业绩快报数据
function formatExpress(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) {
    output += `### ${item.end_date} 期间快报\n`;
    output += `**公告日期**: ${item.ann_date}\n\n`;
    
    if (item.revenue) output += `**营业收入**: ${formatNumber(item.revenue)} 万元\n`;
    if (item.operate_profit) output += `**营业利润**: ${formatNumber(item.operate_profit)} 万元\n`;
    if (item.total_profit) output += `**利润总额**: ${formatNumber(item.total_profit)} 万元\n`;
    if (item.n_income) output += `**净利润**: ${formatNumber(item.n_income)} 万元\n`;
    if (item.total_assets) output += `**总资产**: ${formatNumber(item.total_assets)} 万元\n`;
    if (item.total_hldr_eqy_exc_min_int) output += `**股东权益**: ${formatNumber(item.total_hldr_eqy_exc_min_int)} 万元\n`;
    if (item.diluted_eps) output += `**每股收益**: ${item.diluted_eps} 元\n`;
    if (item.diluted_roe) output += `**净资产收益率**: ${item.diluted_roe}%\n`;
    
    // 同比增长率
    if (item.yoy_net_profit) output += `**净利润同比增长**: ${item.yoy_net_profit}%\n`;
    if (item.yoy_sales) output += `**营收同比增长**: ${item.yoy_sales}%\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化财务指标数据
function formatIndicators(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) {
    output += `### ${item.end_date} 期间指标\n`;
    output += `**公告日期**: ${item.ann_date}\n\n`;
    
    // 盈利能力指标
    output += `**盈利能力指标**:\n`;
    if (item.eps) output += `- 每股收益: ${item.eps} 元\n`;
    if (item.roe) output += `- 净资产收益率: ${item.roe}%\n`;
    if (item.roa) output += `- 总资产收益率: ${item.roa}%\n`;
    if (item.netprofit_margin) output += `- 销售净利率: ${item.netprofit_margin}%\n`;
    if (item.grossprofit_margin) output += `- 销售毛利率: ${item.grossprofit_margin}%\n`;
    
    // 偿债能力指标
    output += `\n**偿债能力指标**:\n`;
    if (item.current_ratio) output += `- 流动比率: ${item.current_ratio}\n`;
    if (item.quick_ratio) output += `- 速动比率: ${item.quick_ratio}\n`;
    if (item.debt_to_assets) output += `- 资产负债率: ${item.debt_to_assets}%\n`;
    
    // 营运能力指标
    output += `\n**营运能力指标**:\n`;
    if (item.inv_turn) output += `- 存货周转率: ${item.inv_turn}\n`;
    if (item.ar_turn) output += `- 应收账款周转率: ${item.ar_turn}\n`;
    if (item.assets_turn) output += `- 总资产周转率: ${item.assets_turn}\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化分红送股数据
function formatDividend(data: any[]): string {
  let output = '';
  
  for (const item of data.slice(0, 10)) {
    output += `### ${item.end_date} 分红方案\n`;
    output += `**公告日期**: ${item.ann_date}  **实施进度**: ${item.div_proc || 'N/A'}\n`;
    
    if (item.stk_div) output += `**送股比例**: 每10股送${item.stk_div}股\n`;
    if (item.stk_bo_rate) output += `**转股比例**: 每10股转${item.stk_bo_rate}股\n`;
    if (item.cash_div) output += `**现金分红**: 每10股派${item.cash_div}元\n`;
    if (item.cash_div_tax) output += `**税后分红**: 每10股派${item.cash_div_tax}元\n`;
    
    if (item.record_date) output += `**股权登记日**: ${item.record_date}\n`;
    if (item.ex_date) output += `**除权除息日**: ${item.ex_date}\n`;
    if (item.pay_date) output += `**派息日**: ${item.pay_date}\n`;
    
    output += '\n';
  }
  
  return output;
}

// 格式化通用数据
function formatGenericData(data: any[], fields: string[]): string {
  let output = '';
  
  for (const item of data.slice(0, 5)) {
    output += '### 数据记录\n';
    for (const field of fields.slice(0, 10)) { // 只显示前10个字段
      if (item[field] !== null && item[field] !== undefined) {
        output += `**${field}**: ${item[field]}\n`;
      }
    }
    output += '\n';
  }
  
  return output;
}

// 辅助函数：格式化数字
function formatNumber(num: any): string {
  if (num === null || num === undefined || num === '') return 'N/A';
  const number = parseFloat(num);
  if (isNaN(number)) return 'N/A';
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

// 辅助函数：获取预告类型描述
function getForecastType(type: string): string {
  const typeMap: Record<string, string> = {
    '1': '预增',
    '2': '预减',
    '3': '扭亏',
    '4': '首亏',
    '5': '续亏',
    '6': '续盈',
    '7': '略增',
    '8': '略减'
  };
  return typeMap[type] || type;
} 