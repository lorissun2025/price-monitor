// 图例组件

/**
 * 添加图例到地图
 */
function addLegend() {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div class="legend-title">影响力图例</div>
      <div class="legend-item">
        <div class="legend-color" style="background: #FF0000;"></div>
        <span>极高影响力</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #FF6600;"></div>
        <span>高影响力</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #FFCC00;"></div>
        <span>中等影响力</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #00CC00;"></div>
        <span>低影响力</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #00CC00;"></div>
        <span>新兴热点</span>
      </div>
    `;
    return div;
  };

  legend.addTo(getMap());
}

// 导出函数供其他模块调用
window.addLegend = addLegend;
