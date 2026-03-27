import React from 'react';
import { Hotspot, Platform, HotspotType } from '../../ts/hotspot';

interface HotspotCardProps {
  hotspot: Hotspot;
}

const HotspotCard: React.FC<HotspotCardProps> = ({ hotspot }) => {
  const getPlatformName = (platform: string): string => {
    const names: Record<string, string> = {
      xiaohongshu: '小红书',
      weibo: '微博',
      douyin: '抖音',
      bilibili: 'B站'
    };
    return names[platform] || platform;
  };

  const getInfluenceLabel = (score: number): string => {
    if (score >= 100) return '🔥 超高';
    if (score >= 50) return '⭐ 很高';
    if (score >= 20) return '👍 较高';
    if (score >= 10) return '💪 中等';
    return '💪 基础';
  };

  return (
    <div className="hotspot-card">
      <h3>{hotspot.title}</h3>
      <p className="platform">{getPlatformName(hotspot.platform)}</p>
      <p className="location">{hotspot.location.city}</p>
      <p className="score">
        影响力: {hotspot.influenceScore.toFixed(2)}
      </p>
      <p className="level">{getInfluenceLabel(hotspot.influenceScore)}</p>
    </div>
  );
};

export default HotspotCard;
