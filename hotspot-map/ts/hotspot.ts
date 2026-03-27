// 热点类型定义
enum Platform {
  XIAOHONGSHU = 'xiaohongshu',
  WEIBO = 'weibo',
  DOUYIN = 'douyin',
  BILIBILI = 'bilibili'
}

enum HotspotType {
  FOOD = 'food',
  TOURISM = 'tourism',
  EVENT = 'event',
  SOCIAL = 'social'
}

// 热点接口
interface Hotspot {
  id: string;
  title: string;
  platform: Platform;
  type: HotspotType;
  lat: number;
  lng: number;
  location: {
    city: string;
    district?: string;
  };
  influenceScore: number;
  influenceLevel: string;
  metrics: {
    likes: number;
    comments: number;
    views: number;
  };
  createdAt: string;
}

// 热点管理类
class HotspotManager {
  private hotspots: Map<string, Hotspot> = new Map();

  addHotspot(hotspot: Hotspot): void {
    this.hotspots.set(hotspot.id, hotspot);
  }

  getHotspot(id: string): Hotspot | undefined {
    return this.hotspots.get(id);
  }

  getAllHotspots(): Hotspot[] {
    return Array.from(this.hotspots.values());
  }

  filterByPlatform(platform: Platform): Hotspot[] {
    return this.getAllHotspots().filter(h => h.platform === platform);
  }

  filterByType(type: HotspotType): Hotspot[] {
    return this.getAllHotspots().filter(h => h.type === type);
  }
}

// 导出
export { Platform, HotspotType, Hotspot, HotspotManager };
