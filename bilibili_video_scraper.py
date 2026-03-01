"""
B站UP主视频信息爬取工具
功能：获取指定UP主的全部视频信息（标题、发布时间、时长、播放量、封面图等）
支持WBI签名机制，解决-403反爬问题
"""

import os
import requests
import time
import pandas as pd
from datetime import datetime
import hashlib
import urllib.parse
from functools import reduce

# ============== WBI 签名相关 ==============

# WBI 混淆表 (固定值)
MIXIN_KEY_ENC_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
    37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
    22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
]

def get_mixin_key(orig: str) -> str:
    """对 imgKey 和 subKey 进行混淆编码"""
    return reduce(lambda s, i: s + orig[i], MIXIN_KEY_ENC_TAB, '')[:32]

def enc_wbi(params: dict, img_key: str, sub_key: str) -> dict:
    """为请求参数进行 WBI 签名"""
    mixin_key = get_mixin_key(img_key + sub_key)
    curr_time = round(time.time())
    params['wts'] = curr_time  # 添加 wts 字段
    params = dict(sorted(params.items()))  # 按照 key 排序参数
    # 过滤 value 中的 "!'()*" 字符
    params = {
        k: ''.join(filter(lambda chr: chr not in "!'()*", str(v)))
        for k, v in params.items()
    }
    query = urllib.parse.urlencode(params)
    wbi_sign = hashlib.md5((query + mixin_key).encode()).hexdigest()  # 计算 w_rid
    params['w_rid'] = wbi_sign
    return params

def get_wbi_keys(headers: dict) -> tuple:
    """获取最新的 img_key 和 sub_key"""
    resp = requests.get('https://api.bilibili.com/x/web-interface/nav', headers=headers)
    resp.raise_for_status()
    json_content = resp.json()
    img_url: str = json_content['data']['wbi_img']['img_url']
    sub_url: str = json_content['data']['wbi_img']['sub_url']
    img_key = img_url.rsplit('/', 1)[1].split('.')[0]
    sub_key = sub_url.rsplit('/', 1)[1].split('.')[0]
    return img_key, sub_key

# ============== 主要爬取逻辑 ==============

class BilibiliVideoScraper:
    """B站视频爬取器"""
    
    def __init__(self, cookie: str = None):
        """
        初始化爬取器
        
        Args:
            cookie: 可选，登录后的Cookie字符串。如果遇到-403错误，需要提供Cookie
        """
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com',
        }
        if cookie:
            self.headers['Cookie'] = cookie
        
        # 获取 WBI 签名所需的 keys
        self.img_key, self.sub_key = get_wbi_keys(self.headers)
        print(f"✅ WBI keys 获取成功")
    
    def get_up_info(self, mid: int) -> dict:
        """
        获取UP主基本信息
        
        Args:
            mid: UP主的用户ID
            
        Returns:
            UP主信息字典
        """
        url = 'https://api.bilibili.com/x/space/wbi/acc/info'
        params = enc_wbi({'mid': mid}, self.img_key, self.sub_key)
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            data = response.json()
            if data['code'] == 0:
                info = data['data']
                return {
                    '用户名': info['name'],
                    '粉丝数': info.get('follower', 'N/A'),  # 可能需要另一个接口
                    '签名': info['sign'],
                    '等级': info['level'],
                    '头像': info['face']
                }
            else:
                print(f"⚠️ 获取UP主信息失败: {data.get('message')}")
                return None
        except Exception as e:
            print(f"❌ 获取UP主信息出错: {e}")
            return None
    
    def get_videos(self, mid: int, max_pages: int = 100) -> list:
        """
        获取UP主的全部视频列表
        
        Args:
            mid: UP主的用户ID
            max_pages: 最大爬取页数，默认100页（3000个视频）
            
        Returns:
            视频信息列表
        """
        url = 'https://api.bilibili.com/x/space/wbi/arc/search'
        all_videos = []
        
        print(f"\n🎬 开始爬取 UP主(mid={mid}) 的视频...")
        
        for page in range(1, max_pages + 1):
            params = {
                'mid': mid,
                'ps': 30,       # 每页30条
                'tid': 0,       # 分区ID，0代表所有
                'pn': page,
                'keyword': '',
                'order': 'pubdate'  # 按发布时间排序
            }
            
            # 对参数进行 WBI 签名
            signed_params = enc_wbi(params, self.img_key, self.sub_key)
            
            try:
                response = requests.get(url, headers=self.headers, params=signed_params)
                data = response.json()
                
                if data['code'] != 0:
                    print(f"\n❌ 请求失败: {data.get('message')}")
                    if data['code'] == -403:
                        print("💡 提示: 遇到-403错误，请尝试添加Cookie后重试")
                    break
                
                vlist = data['data']['list']['vlist']
                total = data['data']['page']['count']
                
                # 如果当前页没有视频，说明爬取结束
                if not vlist:
                    print(f"\n✅ 爬取完成！共 {len(all_videos)} 个视频")
                    break
                
                for v in vlist:
                    video_info = {
                        '标题': v['title'],
                        'BVID': v['bvid'],
                        'AID': v['aid'],
                        '发布时间': datetime.fromtimestamp(v['created']).strftime('%Y-%m-%d %H:%M:%S'),
                        '时长': v['length'],  # 格式如 "04:30"
                        '播放量': v['play'],
                        '弹幕数': v.get('video_review', 0),
                        '评论数': v['comment'],
                        '收藏数': v.get('favorites', 0),
                        '分区': v.get('typename', ''),
                        '简介': v['description'][:100] if v['description'] else '',  # 只取前100字
                        '封面图URL': v['pic'],
                        '视频链接': f"https://www.bilibili.com/video/{v['bvid']}"
                    }
                    all_videos.append(video_info)
                
                # 显示进度
                progress = min(len(all_videos), total)
                print(f"\r📊 进度: {progress}/{total} ({page}页)", end='', flush=True)
                
                # 如果已经爬取完所有视频
                if len(all_videos) >= total:
                    print(f"\n✅ 爬取完成！共 {len(all_videos)} 个视频")
                    break
                
                # 稍微暂停，避免请求过快
                time.sleep(1.5)
                
            except Exception as e:
                print(f"\n❌ 发生错误: {e}")
                break
        
        return all_videos
    
    def export_to_csv(self, videos: list, filename: str):
        """
        将视频数据导出为 CSV 文件
        
        Args:
            videos: 视频信息列表
            filename: 输出文件名
        """
        if not videos:
            print("⚠️ 没有数据可导出")
            return
        
        df = pd.DataFrame(videos)
        df.to_csv(filename, index=False, encoding='utf-8-sig')  # utf-8-sig 确保Excel能正确打开中文
        print(f"📁 数据已保存至: {filename}")
    
    def export_to_excel(self, videos: list, filename: str):
        """
        将视频数据导出为 Excel 文件
        
        Args:
            videos: 视频信息列表
            filename: 输出文件名
        """
        if not videos:
            print("⚠️ 没有数据可导出")
            return
        
        df = pd.DataFrame(videos)
        df.to_excel(filename, index=False, engine='openpyxl')
        print(f"📁 数据已保存至: {filename}")


def main():
    """主函数 - 使用示例"""
    
    print("=" * 60)
    print("🎯 B站UP主视频爬取工具")
    print("=" * 60)
    
    # ========== 配置区域 ==========
    
    # 1. UP主的 mid (在UP主空间URL中获取，如 https://space.bilibili.com/517327498)
    TARGET_MID = 517327498  # 示例：罗翔说刑法
    
    # 2. Cookie (可选，遇到-403错误时需要填写)
    #    获取方式：
    #    1) 在浏览器登录B站
    #    2) 按F12打开开发者工具 -> Network
    #    3) 刷新页面，找任意请求，复制其Cookie
    #    4) 设置环境变量: export BILIBILI_COOKIE="你的Cookie"
    COOKIE = os.environ.get("BILIBILI_COOKIE", "")
    
    # 3. 最大爬取页数 (每页30条，100页=3000条视频)
    MAX_PAGES = 100
    
    # ==============================
    
    # 创建爬取器实例
    scraper = BilibiliVideoScraper(cookie=COOKIE)
    
    # 获取UP主信息
    up_info = scraper.get_up_info(TARGET_MID)
    if up_info:
        print(f"\n👤 UP主信息:")
        print(f"   用户名: {up_info['用户名']}")
        print(f"   签名: {up_info['签名'][:50]}..." if len(up_info['签名']) > 50 else f"   签名: {up_info['签名']}")
    
    # 获取视频列表
    videos = scraper.get_videos(mid=TARGET_MID, max_pages=MAX_PAGES)
    
    # 导出数据
    if videos:
        # 获取UP主用户名作为文件名
        up_name = up_info['用户名'] if up_info else str(TARGET_MID)
        # 清理文件名中的非法字符
        safe_name = "".join(c for c in up_name if c.isalnum() or c in (' ', '-', '_')).strip()
        
        # 导出为 CSV
        csv_filename = f"{safe_name}_videos_{datetime.now().strftime('%Y%m%d')}.csv"
        scraper.export_to_csv(videos, csv_filename)
        
        # 也可以导出为 Excel (需要安装 openpyxl: pip install openpyxl)
        # excel_filename = f"{safe_name}_videos_{datetime.now().strftime('%Y%m%d')}.xlsx"
        # scraper.export_to_excel(videos, excel_filename)
        
        # 显示统计信息
        print(f"\n📈 统计信息:")
        print(f"   视频总数: {len(videos)}")
        if videos:
            total_plays = sum(v['播放量'] for v in videos if isinstance(v['播放量'], int))
            avg_plays = total_plays // len(videos) if len(videos) > 0 else 0
            print(f"   总播放量: {total_plays:,}")
            print(f"   平均播放: {avg_plays:,}")


if __name__ == "__main__":
    main()
