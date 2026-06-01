import { useState } from 'react';
import { motion } from 'framer-motion';
import { fusionApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton } from '../components/common/UIComponents';

type Tab = 'match' | 'video' | 'pipeline';

export default function FusionCreation() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const showNotification = useAppStore((s) => s.showNotification);

  // 图文匹配
  const [matchText, setMatchText] = useState('');

  // 视频脚本
  const [videoTopic, setVideoTopic] = useState('');
  const [videoDuration, setVideoDuration] = useState('60秒');

  // 全案生成
  const [pipelineIdea, setPipelineIdea] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res: any;
      if (tab === 'match') {
        if (!matchText.trim()) { showNotification('error', '请输入文章内容'); setLoading(false); return; }
        res = await fusionApi.match({ text: matchText });
      } else if (tab === 'video') {
        if (!videoTopic.trim()) { showNotification('error', '请输入视频主题'); setLoading(false); return; }
        res = await fusionApi.videoScript({ topic: videoTopic, duration: videoDuration });
      } else {
        if (!pipelineIdea.trim()) { showNotification('error', '请输入创意灵感'); setLoading(false); return; }
        res = await fusionApi.fullPipeline({ idea: pipelineIdea });
      }
      setResult(res);
      showNotification('success', '生成完成！');
    } catch {
      showNotification('error', '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'pipeline' as Tab, label: '一个灵感全案生成', icon: '✦' },
    { key: 'match' as Tab, label: '图文自动匹配', icon: '◎' },
    { key: 'video' as Tab, label: '视频创作辅助', icon: '▶' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">多模态融合创作</h1>
        <p className="text-white/40 text-sm mt-1">图文匹配 · 视频脚本 · 全案生成</p>
      </motion.div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              tab === t.key
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧输入 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-5 space-y-4">
            {tab === 'match' && (
              <>
                <p className="text-xs text-white/40">粘贴文章内容，AI 自动生成配套插图</p>
                <textarea
                  value={matchText}
                  onChange={(e) => setMatchText(e.target.value)}
                  placeholder="粘贴文章或文案内容..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70 resize-none h-40 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                />
              </>
            )}
            {tab === 'video' && (
              <>
                <p className="text-xs text-white/40">输入主题，一键生成完整视频制作方案</p>
                <input
                  value={videoTopic}
                  onChange={(e) => setVideoTopic(e.target.value)}
                  placeholder="视频主题..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                />
                <select
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
                >
                  <option value="15秒">15秒</option>
                  <option value="30秒">30秒</option>
                  <option value="60秒">60秒</option>
                  <option value="90秒">90秒</option>
                </select>
              </>
            )}
            {tab === 'pipeline' && (
              <>
                <p className="text-xs text-white/40">输入一个灵感，同时生成文案+配图+视频脚本</p>
                <textarea
                  value={pipelineIdea}
                  onChange={(e) => setPipelineIdea(e.target.value)}
                  placeholder="输入你的创意灵感..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70 resize-none h-40 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                />
              </>
            )}
            <GenerateButton onClick={handleGenerate} loading={loading} label="开始生成" className="w-full" />
          </div>
        </motion.div>

        {/* 结果区 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {result ? (
            <div className="glass-card p-5 max-h-[70vh] overflow-y-auto">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">◎ 生成结果</h3>
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap space-y-4">
                {Object.entries(result).map(([key, value]) => {
                  if (key === 'image_urls' && Array.isArray(value)) {
                    return (
                      <div key={key}>
                        <p className="text-xs text-white/40 mb-2">{key}:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(value as string[]).map((url, i) => (
                            <img key={i} src={url} alt="" className="rounded-lg w-full aspect-[4/3] object-cover" />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (key === 'success') return null;
                  return (
                    <div key={key}>
                      <p className="text-xs text-white/40 mb-1">{key}:</p>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{String(value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 text-center h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-3 opacity-20">◎</div>
              <p className="text-white/20 text-sm">选择左侧模式，输入内容后开始创作</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
