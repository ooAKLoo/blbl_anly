#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
B站视频数据可视化分析 - 罗翔说刑法频道
多维度数据挖掘与可视化
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.ticker import FuncFormatter
import seaborn as sns
from datetime import datetime
import warnings
import os
import re

warnings.filterwarnings('ignore')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'STHeiti', 'Microsoft YaHei']
plt.rcParams['axes.unicode_minus'] = False

# 设置绘图风格
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")


def load_and_clean_data(filepath):
    """加载和清洗数据"""
    df = pd.read_csv(filepath, encoding='utf-8-sig')

    # 转换发布时间为datetime
    df['发布时间'] = pd.to_datetime(df['发布时间'])

    # 提取年、月、星期、小时
    df['年份'] = df['发布时间'].dt.year
    df['月份'] = df['发布时间'].dt.month
    df['星期'] = df['发布时间'].dt.dayofweek  # 0=Monday
    df['小时'] = df['发布时间'].dt.hour
    df['日期'] = df['发布时间'].dt.date
    df['年月'] = df['发布时间'].dt.to_period('M')

    # 将时长转换为秒数
    def duration_to_seconds(duration_str):
        if pd.isna(duration_str):
            return 0
        parts = str(duration_str).split(':')
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        return 0

    df['时长_秒'] = df['时长'].apply(duration_to_seconds)
    df['时长_分钟'] = df['时长_秒'] / 60

    # 计算互动率
    df['互动总量'] = df['弹幕数'] + df['评论数'] + df['收藏数']
    df['互动率'] = (df['互动总量'] / df['播放量'] * 100).round(2)
    df['弹幕率'] = (df['弹幕数'] / df['播放量'] * 10000).round(2)  # 每万播放弹幕数
    df['评论率'] = (df['评论数'] / df['播放量'] * 10000).round(2)  # 每万播放评论数

    return df


def format_number(x, pos):
    """格式化大数字显示"""
    if x >= 1e6:
        return f'{x/1e6:.1f}M'
    elif x >= 1e3:
        return f'{x/1e3:.0f}K'
    return f'{x:.0f}'


def create_overview_dashboard(df, save_path):
    """创建总览仪表板"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('罗翔说刑法 - 频道数据总览', fontsize=20, fontweight='bold', y=1.02)

    # 1. 播放量分布直方图
    ax1 = axes[0, 0]
    df['播放量'].hist(bins=30, ax=ax1, color='#3498db', edgecolor='white', alpha=0.8)
    ax1.set_title('播放量分布', fontsize=14, fontweight='bold')
    ax1.set_xlabel('播放量')
    ax1.set_ylabel('视频数量')
    ax1.xaxis.set_major_formatter(FuncFormatter(format_number))
    ax1.axvline(df['播放量'].mean(), color='red', linestyle='--', label=f'平均值: {df["播放量"].mean()/1e6:.2f}M')
    ax1.axvline(df['播放量'].median(), color='green', linestyle='--', label=f'中位数: {df["播放量"].median()/1e6:.2f}M')
    ax1.legend(fontsize=10)

    # 2. 核心指标KPI卡片
    ax2 = axes[0, 1]
    ax2.axis('off')
    kpi_text = f"""
    📊 核心数据指标

    📹 视频总数: {len(df)}
    👀 总播放量: {df['播放量'].sum()/1e8:.2f}亿
    💬 总弹幕数: {df['弹幕数'].sum()/1e4:.1f}万
    📝 总评论数: {df['评论数'].sum()/1e4:.1f}万

    📈 平均播放量: {df['播放量'].mean()/1e4:.1f}万
    🔥 最高播放量: {df['播放量'].max()/1e4:.1f}万
    ⏱️ 平均时长: {df['时长_分钟'].mean():.1f}分钟
    📅 发布周期: {(df['发布时间'].max() - df['发布时间'].min()).days}天
    """
    ax2.text(0.1, 0.5, kpi_text, fontsize=13, verticalalignment='center',
             bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.3),
             transform=ax2.transAxes, family='monospace')

    # 3. 视频时长分布
    ax3 = axes[0, 2]
    duration_bins = [0, 5, 10, 15, 20, 30, 60, float('inf')]
    duration_labels = ['0-5min', '5-10min', '10-15min', '15-20min', '20-30min', '30-60min', '60min+']
    df['时长区间'] = pd.cut(df['时长_分钟'], bins=duration_bins, labels=duration_labels)
    duration_counts = df['时长区间'].value_counts().sort_index()
    bars = ax3.bar(range(len(duration_counts)), duration_counts.values, color=sns.color_palette("Blues_r", len(duration_counts)))
    ax3.set_xticks(range(len(duration_counts)))
    ax3.set_xticklabels(duration_counts.index, rotation=45, ha='right')
    ax3.set_title('视频时长分布', fontsize=14, fontweight='bold')
    ax3.set_ylabel('视频数量')
    for bar, val in zip(bars, duration_counts.values):
        ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, str(val),
                ha='center', va='bottom', fontsize=10)

    # 4. 年度发布数量趋势
    ax4 = axes[1, 0]
    yearly_counts = df.groupby('年份').size()
    ax4.bar(yearly_counts.index.astype(str), yearly_counts.values, color='#2ecc71', edgecolor='white')
    ax4.set_title('年度发布视频数量', fontsize=14, fontweight='bold')
    ax4.set_xlabel('年份')
    ax4.set_ylabel('视频数量')
    for i, (year, count) in enumerate(yearly_counts.items()):
        ax4.text(i, count + 1, str(count), ha='center', fontsize=11, fontweight='bold')

    # 5. 月度发布热力分布
    ax5 = axes[1, 1]
    monthly_counts = df.groupby('月份').size()
    colors = plt.cm.YlOrRd(monthly_counts.values / monthly_counts.max())
    bars = ax5.bar(monthly_counts.index, monthly_counts.values, color=colors, edgecolor='white')
    ax5.set_title('月度发布分布', fontsize=14, fontweight='bold')
    ax5.set_xlabel('月份')
    ax5.set_ylabel('视频数量')
    ax5.set_xticks(range(1, 13))

    # 6. 发布时间（小时）分布
    ax6 = axes[1, 2]
    hourly_counts = df.groupby('小时').size()
    ax6.bar(hourly_counts.index, hourly_counts.values, color='#9b59b6', edgecolor='white', alpha=0.8)
    ax6.set_title('发布时间分布 (小时)', fontsize=14, fontweight='bold')
    ax6.set_xlabel('小时')
    ax6.set_ylabel('视频数量')
    ax6.set_xticks(range(0, 24, 2))

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ 总览仪表板已保存: {save_path}")


def create_engagement_analysis(df, save_path):
    """创建互动分析图表"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    fig.suptitle('罗翔说刑法 - 互动数据深度分析', fontsize=20, fontweight='bold', y=1.02)

    # 1. 播放量 vs 弹幕数 散点图
    ax1 = axes[0, 0]
    scatter = ax1.scatter(df['播放量']/1e4, df['弹幕数'], c=df['时长_分钟'],
                         cmap='viridis', alpha=0.6, s=50)
    ax1.set_xlabel('播放量 (万)')
    ax1.set_ylabel('弹幕数')
    ax1.set_title('播放量 vs 弹幕数 (颜色=时长)', fontsize=14, fontweight='bold')
    plt.colorbar(scatter, ax=ax1, label='时长(分钟)')

    # 2. 播放量 vs 评论数 散点图
    ax2 = axes[0, 1]
    ax2.scatter(df['播放量']/1e4, df['评论数'], c='#e74c3c', alpha=0.6, s=50)
    ax2.set_xlabel('播放量 (万)')
    ax2.set_ylabel('评论数')
    ax2.set_title('播放量 vs 评论数', fontsize=14, fontweight='bold')

    # 添加趋势线
    z = np.polyfit(df['播放量']/1e4, df['评论数'], 1)
    p = np.poly1d(z)
    x_line = np.linspace(df['播放量'].min()/1e4, df['播放量'].max()/1e4, 100)
    ax2.plot(x_line, p(x_line), "r--", alpha=0.8, label='趋势线')
    ax2.legend()

    # 3. 互动率箱线图 (按时长区间)
    ax3 = axes[0, 2]
    duration_bins = [0, 5, 10, 15, 30, float('inf')]
    duration_labels = ['<5min', '5-10min', '10-15min', '15-30min', '30min+']
    df['时长分组'] = pd.cut(df['时长_分钟'], bins=duration_bins, labels=duration_labels)
    df.boxplot(column='互动率', by='时长分组', ax=ax3)
    ax3.set_title('不同时长视频的互动率', fontsize=14, fontweight='bold')
    ax3.set_xlabel('时长区间')
    ax3.set_ylabel('互动率 (%)')
    plt.suptitle('')  # 移除自动生成的标题

    # 4. 年度平均互动指标
    ax4 = axes[1, 0]
    yearly_engagement = df.groupby('年份').agg({
        '弹幕率': 'mean',
        '评论率': 'mean'
    }).reset_index()
    x = np.arange(len(yearly_engagement))
    width = 0.35
    bars1 = ax4.bar(x - width/2, yearly_engagement['弹幕率'], width, label='弹幕率(每万播放)', color='#3498db')
    bars2 = ax4.bar(x + width/2, yearly_engagement['评论率'], width, label='评论率(每万播放)', color='#e74c3c')
    ax4.set_xticks(x)
    ax4.set_xticklabels(yearly_engagement['年份'].astype(int))
    ax4.set_title('年度平均互动指标', fontsize=14, fontweight='bold')
    ax4.set_xlabel('年份')
    ax4.set_ylabel('每万播放互动数')
    ax4.legend()

    # 5. TOP10 高互动率视频
    ax5 = axes[1, 1]
    top_engagement = df.nlargest(10, '互动率')[['标题', '互动率']].copy()
    top_engagement['短标题'] = top_engagement['标题'].apply(lambda x: x[:15] + '...' if len(x) > 15 else x)
    bars = ax5.barh(range(len(top_engagement)), top_engagement['互动率'], color='#f39c12')
    ax5.set_yticks(range(len(top_engagement)))
    ax5.set_yticklabels(top_engagement['短标题'])
    ax5.set_xlabel('互动率 (%)')
    ax5.set_title('TOP10 高互动率视频', fontsize=14, fontweight='bold')
    ax5.invert_yaxis()

    # 6. 弹幕与评论相关性热力图
    ax6 = axes[1, 2]
    corr_cols = ['播放量', '弹幕数', '评论数', '收藏数', '时长_分钟']
    corr_matrix = df[corr_cols].corr()
    sns.heatmap(corr_matrix, annot=True, cmap='RdYlBu_r', center=0, ax=ax6,
                fmt='.2f', square=True, linewidths=0.5)
    ax6.set_title('指标相关性热力图', fontsize=14, fontweight='bold')

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ 互动分析图表已保存: {save_path}")


def create_time_series_analysis(df, save_path):
    """创建时间序列分析图表"""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('罗翔说刑法 - 时间序列分析', fontsize=20, fontweight='bold', y=1.02)

    # 1. 月度播放量趋势
    ax1 = axes[0, 0]
    monthly_views = df.groupby('年月')['播放量'].sum().reset_index()
    monthly_views['年月'] = monthly_views['年月'].astype(str)
    ax1.plot(range(len(monthly_views)), monthly_views['播放量']/1e6, marker='o', linewidth=2, markersize=4)
    ax1.fill_between(range(len(monthly_views)), monthly_views['播放量']/1e6, alpha=0.3)
    ax1.set_title('月度总播放量趋势', fontsize=14, fontweight='bold')
    ax1.set_xlabel('时间')
    ax1.set_ylabel('播放量 (百万)')
    # 显示部分x轴标签
    step = max(1, len(monthly_views) // 10)
    ax1.set_xticks(range(0, len(monthly_views), step))
    ax1.set_xticklabels(monthly_views['年月'].iloc[::step], rotation=45, ha='right')

    # 2. 月度发布频率与平均播放量
    ax2 = axes[0, 1]
    monthly_stats = df.groupby('年月').agg({
        '播放量': ['count', 'mean']
    }).reset_index()
    monthly_stats.columns = ['年月', '发布数量', '平均播放量']
    monthly_stats['年月'] = monthly_stats['年月'].astype(str)

    ax2_twin = ax2.twinx()
    line1 = ax2.bar(range(len(monthly_stats)), monthly_stats['发布数量'], alpha=0.7, color='#3498db', label='发布数量')
    line2, = ax2_twin.plot(range(len(monthly_stats)), monthly_stats['平均播放量']/1e4, 'r-o', linewidth=2, markersize=4, label='平均播放量')
    ax2.set_title('月度发布频率与平均播放量', fontsize=14, fontweight='bold')
    ax2.set_xlabel('时间')
    ax2.set_ylabel('发布数量', color='#3498db')
    ax2_twin.set_ylabel('平均播放量 (万)', color='red')
    step = max(1, len(monthly_stats) // 10)
    ax2.set_xticks(range(0, len(monthly_stats), step))
    ax2.set_xticklabels(monthly_stats['年月'].iloc[::step], rotation=45, ha='right')

    # 3. 星期发布热力图
    ax3 = axes[1, 0]
    weekday_hour = df.groupby(['星期', '小时']).size().unstack(fill_value=0)
    weekday_labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    sns.heatmap(weekday_hour, cmap='YlOrRd', ax=ax3, cbar_kws={'label': '发布数量'})
    ax3.set_yticklabels(weekday_labels, rotation=0)
    ax3.set_title('发布时间热力图 (星期 x 小时)', fontsize=14, fontweight='bold')
    ax3.set_xlabel('小时')
    ax3.set_ylabel('星期')

    # 4. 累计播放量增长曲线
    ax4 = axes[1, 1]
    df_sorted = df.sort_values('发布时间')
    df_sorted['累计播放量'] = df_sorted['播放量'].cumsum()
    df_sorted['累计视频数'] = range(1, len(df_sorted) + 1)

    ax4.plot(df_sorted['发布时间'], df_sorted['累计播放量']/1e8, linewidth=2, color='#2ecc71')
    ax4.fill_between(df_sorted['发布时间'], df_sorted['累计播放量']/1e8, alpha=0.3, color='#2ecc71')
    ax4.set_title('累计播放量增长曲线', fontsize=14, fontweight='bold')
    ax4.set_xlabel('发布时间')
    ax4.set_ylabel('累计播放量 (亿)')
    ax4.tick_params(axis='x', rotation=45)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ 时间序列分析图表已保存: {save_path}")


def create_content_analysis(df, save_path):
    """创建内容分析图表"""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('罗翔说刑法 - 内容分析', fontsize=20, fontweight='bold', y=1.02)

    # 1. TOP20 播放量视频
    ax1 = axes[0, 0]
    top_views = df.nlargest(20, '播放量')[['标题', '播放量']].copy()
    top_views['短标题'] = top_views['标题'].apply(lambda x: x[:18] + '...' if len(x) > 18 else x)
    colors = plt.cm.RdYlGn(np.linspace(0.2, 0.8, len(top_views)))[::-1]
    bars = ax1.barh(range(len(top_views)), top_views['播放量']/1e4, color=colors)
    ax1.set_yticks(range(len(top_views)))
    ax1.set_yticklabels(top_views['短标题'], fontsize=9)
    ax1.set_xlabel('播放量 (万)')
    ax1.set_title('TOP20 播放量视频', fontsize=14, fontweight='bold')
    ax1.invert_yaxis()

    # 2. 标题关键词分析
    ax2 = axes[0, 1]
    # 提取常见关键词
    keywords = ['张三', '犯罪', '法律', '刑法', 'AI', '人工智能', '杀人', '强奸', '盗窃',
                '诈骗', '律师', '法官', '案件', '判决', '罪名', '死刑', '无罪', '正当防卫']
    keyword_counts = {}
    for kw in keywords:
        count = df['标题'].str.contains(kw, na=False).sum()
        if count > 0:
            keyword_counts[kw] = count

    sorted_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    if sorted_keywords:
        kw_names, kw_counts = zip(*sorted_keywords)
        bars = ax2.barh(range(len(kw_names)), kw_counts, color='#9b59b6')
        ax2.set_yticks(range(len(kw_names)))
        ax2.set_yticklabels(kw_names)
        ax2.set_xlabel('出现次数')
        ax2.set_title('标题高频关键词', fontsize=14, fontweight='bold')
        ax2.invert_yaxis()

    # 3. 标题长度与播放量关系
    ax3 = axes[1, 0]
    df['标题长度'] = df['标题'].str.len()
    scatter = ax3.scatter(df['标题长度'], df['播放量']/1e4, c=df['时长_分钟'],
                         cmap='coolwarm', alpha=0.6, s=40)
    ax3.set_xlabel('标题长度 (字符数)')
    ax3.set_ylabel('播放量 (万)')
    ax3.set_title('标题长度与播放量关系', fontsize=14, fontweight='bold')
    plt.colorbar(scatter, ax=ax3, label='视频时长(分钟)')

    # 添加趋势线
    z = np.polyfit(df['标题长度'], df['播放量']/1e4, 1)
    p = np.poly1d(z)
    x_line = np.linspace(df['标题长度'].min(), df['标题长度'].max(), 100)
    ax3.plot(x_line, p(x_line), "r--", alpha=0.8, linewidth=2)

    # 4. 时长与播放量关系
    ax4 = axes[1, 1]
    # 按时长分组计算平均播放量
    duration_groups = pd.cut(df['时长_分钟'], bins=[0, 5, 8, 10, 12, 15, 20, 30, 60, float('inf')],
                            labels=['0-5', '5-8', '8-10', '10-12', '12-15', '15-20', '20-30', '30-60', '60+'])
    duration_views = df.groupby(duration_groups)['播放量'].agg(['mean', 'count']).reset_index()
    duration_views.columns = ['时长区间', '平均播放量', '视频数量']

    bars = ax4.bar(range(len(duration_views)), duration_views['平均播放量']/1e4,
                   color='#1abc9c', edgecolor='white')
    ax4.set_xticks(range(len(duration_views)))
    ax4.set_xticklabels(duration_views['时长区间'], rotation=45, ha='right')
    ax4.set_xlabel('视频时长 (分钟)')
    ax4.set_ylabel('平均播放量 (万)')
    ax4.set_title('不同时长视频的平均播放量', fontsize=14, fontweight='bold')

    # 在柱状图上标注视频数量
    for bar, count in zip(bars, duration_views['视频数量']):
        ax4.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'n={count}', ha='center', va='bottom', fontsize=9, color='gray')

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ 内容分析图表已保存: {save_path}")


def create_advanced_insights(df, save_path):
    """创建高级洞察图表"""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('罗翔说刑法 - 高级数据洞察', fontsize=20, fontweight='bold', y=1.02)

    # 1. 视频表现四象限分析 (播放量 vs 互动率)
    ax1 = axes[0, 0]
    median_views = df['播放量'].median()
    median_engagement = df['互动率'].median()

    colors = []
    for _, row in df.iterrows():
        if row['播放量'] >= median_views and row['互动率'] >= median_engagement:
            colors.append('#2ecc71')  # 高播放高互动 - 绿色
        elif row['播放量'] >= median_views and row['互动率'] < median_engagement:
            colors.append('#3498db')  # 高播放低互动 - 蓝色
        elif row['播放量'] < median_views and row['互动率'] >= median_engagement:
            colors.append('#f39c12')  # 低播放高互动 - 黄色
        else:
            colors.append('#e74c3c')  # 低播放低互动 - 红色

    ax1.scatter(df['播放量']/1e4, df['互动率'], c=colors, alpha=0.6, s=50)
    ax1.axvline(median_views/1e4, color='gray', linestyle='--', alpha=0.5)
    ax1.axhline(median_engagement, color='gray', linestyle='--', alpha=0.5)
    ax1.set_xlabel('播放量 (万)')
    ax1.set_ylabel('互动率 (%)')
    ax1.set_title('视频表现四象限分析', fontsize=14, fontweight='bold')

    # 添加象限标签
    ax1.text(0.75, 0.85, '🌟 爆款', transform=ax1.transAxes, fontsize=12, color='#2ecc71', fontweight='bold')
    ax1.text(0.75, 0.15, '📺 流量型', transform=ax1.transAxes, fontsize=12, color='#3498db', fontweight='bold')
    ax1.text(0.1, 0.85, '💬 口碑型', transform=ax1.transAxes, fontsize=12, color='#f39c12', fontweight='bold')
    ax1.text(0.1, 0.15, '📉 待优化', transform=ax1.transAxes, fontsize=12, color='#e74c3c', fontweight='bold')

    # 2. 发布频率与质量趋势
    ax2 = axes[0, 1]
    quarterly = df.set_index('发布时间').resample('Q').agg({
        '播放量': ['count', 'mean'],
        '弹幕数': 'mean'
    }).reset_index()
    quarterly.columns = ['时间', '发布数量', '平均播放量', '平均弹幕数']

    ax2_twin = ax2.twinx()
    bars = ax2.bar(range(len(quarterly)), quarterly['发布数量'], alpha=0.5, color='#3498db', label='发布数量')
    line, = ax2_twin.plot(range(len(quarterly)), quarterly['平均播放量']/1e4, 'ro-', linewidth=2, label='平均播放量')

    ax2.set_xlabel('季度')
    ax2.set_ylabel('发布数量', color='#3498db')
    ax2_twin.set_ylabel('平均播放量 (万)', color='red')
    ax2.set_title('季度发布频率与质量趋势', fontsize=14, fontweight='bold')
    ax2.set_xticks(range(len(quarterly)))
    ax2.set_xticklabels([t.strftime('%Y-Q%q') if hasattr(t, 'strftime') else str(t)[:7] for t in quarterly['时间']],
                       rotation=45, ha='right', fontsize=8)

    # 3. 播放量分位数分析
    ax3 = axes[1, 0]
    percentiles = [10, 25, 50, 75, 90, 95, 99]
    percentile_values = [np.percentile(df['播放量'], p) for p in percentiles]

    bars = ax3.bar([f'P{p}' for p in percentiles], [v/1e4 for v in percentile_values],
                   color=plt.cm.RdYlGn(np.linspace(0.2, 0.8, len(percentiles))))
    ax3.set_xlabel('分位数')
    ax3.set_ylabel('播放量 (万)')
    ax3.set_title('播放量分位数分布', fontsize=14, fontweight='bold')

    for bar, val in zip(bars, percentile_values):
        ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f'{val/1e4:.0f}万', ha='center', va='bottom', fontsize=9)

    # 4. 发布星期分析
    ax4 = axes[1, 1]
    weekday_stats = df.groupby('星期').agg({
        '播放量': ['mean', 'count']
    }).reset_index()
    weekday_stats.columns = ['星期', '平均播放量', '发布数量']
    weekday_labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    x = np.arange(7)
    width = 0.35

    ax4_twin = ax4.twinx()
    bars1 = ax4.bar(x - width/2, weekday_stats['发布数量'], width, label='发布数量', color='#3498db', alpha=0.7)
    bars2 = ax4_twin.bar(x + width/2, weekday_stats['平均播放量']/1e4, width, label='平均播放量', color='#e74c3c', alpha=0.7)

    ax4.set_xticks(x)
    ax4.set_xticklabels(weekday_labels)
    ax4.set_xlabel('星期')
    ax4.set_ylabel('发布数量', color='#3498db')
    ax4_twin.set_ylabel('平均播放量 (万)', color='#e74c3c')
    ax4.set_title('不同星期的发布情况与播放表现', fontsize=14, fontweight='bold')

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f"✅ 高级洞察图表已保存: {save_path}")


def create_summary_report(df, save_path):
    """创建数据分析摘要报告"""

    # 计算关键统计数据
    total_videos = len(df)
    total_views = df['播放量'].sum()
    avg_views = df['播放量'].mean()
    median_views = df['播放量'].median()
    max_views = df['播放量'].max()
    total_danmu = df['弹幕数'].sum()
    total_comments = df['评论数'].sum()
    avg_duration = df['时长_分钟'].mean()

    # 找出最佳表现视频
    best_video = df.loc[df['播放量'].idxmax()]
    best_engagement = df.loc[df['互动率'].idxmax()]

    # 时间分析
    first_video_date = df['发布时间'].min()
    last_video_date = df['发布时间'].max()
    days_active = (last_video_date - first_video_date).days
    avg_videos_per_month = total_videos / (days_active / 30)

    report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    罗翔说刑法 - B站频道数据分析报告                              ║
║                    生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                           ║
╠══════════════════════════════════════════════════════════════════════════════╣

📊 【一、基础数据概览】
─────────────────────────────────────────────────────────────────────────────
  • 视频总数: {total_videos} 个
  • 活跃时长: {days_active} 天 (从 {first_video_date.strftime('%Y-%m-%d')} 到 {last_video_date.strftime('%Y-%m-%d')})
  • 平均发布频率: {avg_videos_per_month:.1f} 个视频/月

📈 【二、播放数据分析】
─────────────────────────────────────────────────────────────────────────────
  • 总播放量: {total_views/1e8:.2f} 亿次
  • 平均播放量: {avg_views/1e4:.1f} 万次
  • 中位数播放量: {median_views/1e4:.1f} 万次
  • 最高播放量: {max_views/1e4:.1f} 万次
  • 播放量标准差: {df['播放量'].std()/1e4:.1f} 万

💬 【三、互动数据分析】
─────────────────────────────────────────────────────────────────────────────
  • 总弹幕数: {total_danmu/1e4:.1f} 万条
  • 总评论数: {total_comments/1e4:.1f} 万条
  • 平均弹幕数: {df['弹幕数'].mean():.0f} 条/视频
  • 平均评论数: {df['评论数'].mean():.0f} 条/视频
  • 平均互动率: {df['互动率'].mean():.2f}%

⏱️ 【四、视频时长分析】
─────────────────────────────────────────────────────────────────────────────
  • 平均时长: {avg_duration:.1f} 分钟
  • 最短视频: {df['时长_分钟'].min():.1f} 分钟
  • 最长视频: {df['时长_分钟'].max():.1f} 分钟
  • 时长中位数: {df['时长_分钟'].median():.1f} 分钟

🏆 【五、TOP表现视频】
─────────────────────────────────────────────────────────────────────────────
  📌 播放量最高:
     标题: {best_video['标题'][:50]}...
     播放量: {best_video['播放量']/1e4:.1f} 万
     发布时间: {best_video['发布时间'].strftime('%Y-%m-%d')}

  📌 互动率最高:
     标题: {best_engagement['标题'][:50]}...
     互动率: {best_engagement['互动率']:.2f}%
     发布时间: {best_engagement['发布时间'].strftime('%Y-%m-%d')}

📅 【六、发布规律分析】
─────────────────────────────────────────────────────────────────────────────
  • 最常发布星期: {['周一','周二','周三','周四','周五','周六','周日'][df['星期'].mode()[0]]}
  • 最常发布时段: {df['小时'].mode()[0]}:00 - {df['小时'].mode()[0]+1}:00
  • 发布量最多年份: {df['年份'].mode()[0]}年 ({df[df['年份']==df['年份'].mode()[0]].shape[0]}个视频)

💡 【七、数据洞察】
─────────────────────────────────────────────────────────────────────────────
  1. 播放量分布呈现{('右偏' if df['播放量'].skew() > 0 else '左偏')}分布，说明大部分视频播放量集中在中低水平，少数视频贡献大量播放

  2. 视频时长与播放量相关系数: {df['时长_分钟'].corr(df['播放量']):.3f}
     {'正相关: 较长视频倾向于获得更多播放' if df['时长_分钟'].corr(df['播放量']) > 0.1 else '负相关或无明显相关'}

  3. 弹幕与播放量相关系数: {df['弹幕数'].corr(df['播放量']):.3f}
     说明弹幕互动与播放量{'高度正相关' if df['弹幕数'].corr(df['播放量']) > 0.7 else '中等正相关' if df['弹幕数'].corr(df['播放量']) > 0.4 else '弱相关'}

╚══════════════════════════════════════════════════════════════════════════════╝
"""

    with open(save_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"✅ 分析报告已保存: {save_path}")
    print("\n" + "="*80)
    print(report)
    print("="*80)


def main():
    """主函数"""
    print("="*60)
    print("🎬 B站视频数据可视化分析系统")
    print("📺 频道: 罗翔说刑法")
    print("="*60 + "\n")

    # 设置文件路径
    base_path = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(base_path, '罗翔说刑法_videos_20251215.csv')

    # 创建输出目录
    output_dir = os.path.join(base_path, 'analysis_output')
    os.makedirs(output_dir, exist_ok=True)

    print("📂 正在加载数据...")
    df = load_and_clean_data(data_file)
    print(f"✅ 数据加载完成，共 {len(df)} 条记录\n")

    print("📊 正在生成可视化图表...")
    print("-" * 40)

    # 生成各类图表
    create_overview_dashboard(df, os.path.join(output_dir, '01_overview_dashboard.png'))
    create_engagement_analysis(df, os.path.join(output_dir, '02_engagement_analysis.png'))
    create_time_series_analysis(df, os.path.join(output_dir, '03_time_series_analysis.png'))
    create_content_analysis(df, os.path.join(output_dir, '04_content_analysis.png'))
    create_advanced_insights(df, os.path.join(output_dir, '05_advanced_insights.png'))

    print("-" * 40)
    print("\n📝 正在生成分析报告...")
    create_summary_report(df, os.path.join(output_dir, 'analysis_report.txt'))

    print("\n" + "="*60)
    print("🎉 分析完成！所有图表和报告已保存至:")
    print(f"   📁 {output_dir}")
    print("="*60)


if __name__ == '__main__':
    main()
