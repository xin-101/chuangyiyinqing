import { useState } from 'react';
import { motion } from 'framer-motion';
import { visualApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton, SelectRow, ResultCard } from '../components/common/UIComponents';

const STYLES = [
  { value: 'auto', label: '自动' },
  { value: '国风', label: '国风' },
  { value: '赛博朋克', label: '赛博朋克' },
  { value: '水彩', label: '水彩' },
  { value: '油画', label: '油画' },
  { value: '3D渲染', label: '3D渲染' },
  { value: '扁平插画', label: '扁平插画' },
];
const TEMPLATES = [
  { value: '海报', label: '海报' },
  { value: '封面图', label: '封面图' },
  { value: '社交媒体配图', label: '社交媒体配图' },
  { value: 'PPT背景', label: 'PPT背景' },
];

export default function VisualWorkshop() {
  const [mode, setMode] = useState<'generate' | 'design'>('generate');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('auto');
  const [template, setTemplate] = useState('海报');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ image_urls: string[]; prompt?: string } | null>(null);
  const showNotification = useAppStore((s) => s.showNotification);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (mode === 'generate') {
        if (!prompt.trim()) { showNotification('error', '请输入图像描述'); setLoading(false); return; }
        const res: any = await visualApi.textToImage({ prompt, style });
        setResult({ image_urls: res.image_urls, prompt: res.prompt });
      } else {
        if (!title.trim()) { showNotification('error', '请输入标题'); setLoading(false); return; }
        const res: any = await visualApi.design({ template, title, subtitle, style });
        setResult({ image_urls: res.image_urls });
      }
    } catch {
      showNotification('error', '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">AI 视觉创作工坊</h1>
        <p className="text-white/40 text-sm mt-1">文生图 · 智能设计排版</p>
      </motion.div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-6">
        {(['generate', 'design'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              mode === m
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {m === 'generate' ? '文生图' : '智能设计排版'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="glass-card p-5 space-y-4">
            <SelectRow label="风格" value={style} options={STYLES} onChange={setStyle} />

            {mode === 'generate' ? (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要的画面..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70 resize-none h-28 focus:outline-none focus:border-neon-cyan/30 transition-colors placeholder:text-white/20"
              />
            ) : (
              <>
                <SelectRow label="模板" value={template} options={TEMPLATES} onChange={setTemplate} />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="标题"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                />
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="副标题（可选）"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                />
              </>
            )}

            <GenerateButton
              onClick={handleGenerate}
              loading={loading}
              label={mode === 'generate' ? '生成图像' : '生成设计'}
              className="w-full"
            />
          </div>
        </motion.div>

        {/* 结果区 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {result ? (
            <div className="glass-card p-5">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">◈ 生成结果</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.image_urls.map((url, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
                    <img src={url} alt={`生成 ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {result.prompt && (
                <p className="text-xs text-white/30 mt-3">提示词: {result.prompt}</p>
              )}
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3 opacity-20">◈</div>
              <p className="text-white/20 text-sm">选择参数并输入内容，生成你的视觉作品</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
