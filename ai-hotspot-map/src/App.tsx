import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            AI Native 热点地图
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            欢迎使用 AI Native 热点地图
          </h2>
          <p className="text-gray-600 mb-4">
            这是一个 AI 驱动的智能热点发现平台，通过 AI 理解用户需求，主动发现、推荐、分析社交媒体热点。
          </p>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">核心功能（MVP）</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>🤖 AI 主动推荐</li>
                <li>🔮 热点趋势预测</li>
                <li>💬 智能内容摘要</li>
                <li>🔍 自然语言搜索</li>
                <li>❓ 智能问答</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">技术栈</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>React 18 + TypeScript</li>
                <li>Vite 5</li>
                <li>Tailwind CSS 3</li>
                <li>OpenAI GPT-4</li>
                <li>Chroma Vector DB</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">当前状态</h3>
              <p className="text-gray-600">
                项目初始化完成，正在开发中...
              </p>
              <button 
                onClick={() => setCount((count) => count + 1)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                点赞 {count}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
          <p>&copy; 2026 AI Native 热点地图. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
