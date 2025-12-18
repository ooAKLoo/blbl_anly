import * as HoverCard from '@radix-ui/react-hover-card';
import { Play } from 'lucide-react';
import { formatNumber, getImageUrl } from '../../utils';

/**
 * 视频列表 HoverCard 通用组件
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 触发器内容
 * @param {string} props.title - HoverCard 标题
 * @param {string} [props.subtitle] - HoverCard 副标题
 * @param {Array} props.videos - 视频列表
 * @param {Function} [props.onVideoClick] - 视频点击回调
 * @param {string} [props.emptyText] - 空列表提示文本
 * @param {string} [props.colorScheme] - 颜色方案：'neutral' | 'amber' | 'emerald' | 'red' | 'blue' | 'purple' | 'slate'
 * @param {string} [props.side] - HoverCard 位置：'top' | 'bottom' | 'left' | 'right'
 * @param {string} [props.align] - HoverCard 对齐：'start' | 'center' | 'end'
 * @param {string} [props.width] - 宽度 class，如 'w-80' | 'w-96'
 * @param {Function} [props.renderVideoMeta] - 自定义视频元信息渲染
 */
function VideoListHoverCard({
  children,
  title,
  subtitle,
  videos = [],
  onVideoClick,
  emptyText = '暂无数据',
  colorScheme = 'neutral',
  side = 'bottom',
  align = 'start',
  width = 'w-80',
  renderVideoMeta
}) {
  // 颜色方案映射
  const colorMap = {
    neutral: {
      header: 'bg-neutral-50',
      headerText: 'text-neutral-700',
      headerSubtext: 'text-neutral-500',
      itemBg: 'bg-neutral-50',
      itemHover: 'hover:bg-neutral-100',
      playText: 'text-neutral-500'
    },
    amber: {
      header: 'bg-amber-50',
      headerText: 'text-amber-800',
      headerSubtext: 'text-amber-600',
      itemBg: 'bg-amber-50',
      itemHover: 'hover:bg-amber-100',
      playText: 'text-amber-600'
    },
    emerald: {
      header: 'bg-emerald-50',
      headerText: 'text-emerald-800',
      headerSubtext: 'text-emerald-600',
      itemBg: 'bg-emerald-50',
      itemHover: 'hover:bg-emerald-100',
      playText: 'text-emerald-600'
    },
    red: {
      header: 'bg-red-50',
      headerText: 'text-red-800',
      headerSubtext: 'text-red-600',
      itemBg: 'bg-red-50',
      itemHover: 'hover:bg-red-100',
      playText: 'text-red-600'
    },
    blue: {
      header: 'bg-blue-50',
      headerText: 'text-blue-800',
      headerSubtext: 'text-blue-600',
      itemBg: 'bg-blue-50',
      itemHover: 'hover:bg-blue-100',
      playText: 'text-blue-600'
    },
    purple: {
      header: 'bg-purple-50',
      headerText: 'text-purple-800',
      headerSubtext: 'text-purple-600',
      itemBg: 'bg-purple-50',
      itemHover: 'hover:bg-purple-100',
      playText: 'text-purple-600'
    },
    slate: {
      header: 'bg-slate-100',
      headerText: 'text-slate-800',
      headerSubtext: 'text-slate-600',
      itemBg: 'bg-slate-50',
      itemHover: 'hover:bg-slate-100',
      playText: 'text-slate-600'
    }
  };

  const colors = colorMap[colorScheme] || colorMap.neutral;

  const handleVideoClick = (video) => {
    if (onVideoClick) {
      onVideoClick(video);
    } else if (video.video_url) {
      window.open(video.video_url, '_blank');
    } else if (video.bvid) {
      window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
    }
  };

  const defaultRenderMeta = (video) => (
    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
      <span className={`flex items-center gap-0.5 ${colors.playText}`}>
        <Play size={8} /> {formatNumber(video.play_count)}
      </span>
      {video.duration && <span>{video.duration}</span>}
      {video.ratio && <span>是同期 {video.ratio.toFixed(1)}x</span>}
    </div>
  );

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        {children}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          sideOffset={8}
          side={side}
          align={align}
          className={`z-50 ${width} bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95`}
        >
          <div className={`p-3 border-b border-neutral-100 ${colors.header}`}>
            <span className={`text-sm font-medium ${colors.headerText}`}>{title}</span>
            {subtitle && <p className={`text-xs ${colors.headerSubtext} mt-1`}>{subtitle}</p>}
          </div>
          <div className="p-3 max-h-80 overflow-y-auto">
            {videos.length > 0 ? (
              <div className="space-y-2">
                {videos.map((video) => (
                  <div
                    key={video.bvid}
                    className={`flex items-start gap-2 p-2 rounded-lg ${colors.itemBg} ${colors.itemHover} cursor-pointer transition-colors`}
                    onClick={() => handleVideoClick(video)}
                  >
                    <img
                      src={getImageUrl(video.cover)}
                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-tight">
                        {video.title}
                      </div>
                      {renderVideoMeta ? renderVideoMeta(video) : defaultRenderMeta(video)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-4">{emptyText}</p>
            )}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

export default VideoListHoverCard;
