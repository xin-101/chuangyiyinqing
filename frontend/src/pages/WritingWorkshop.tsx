import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { writingApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton, SelectRow, ResultCard } from '../components/common/UIComponents';

const GENRES = ['新闻报道', '营销文案', '故事小说', '剧本脚本', '学术论文', '社交媒体'];
const TONES = [
  { value: 'positive', label: '积极/热情' },
  { value: 'neutral', label: '中立/客观' },
  { value: 'negative', label: '深沉/内敛' },
];
const LENGTHS = [
  { value: 'short', label: '简短（200字内）' },
  { value: 'medium', label: '适中（500-800字）' },
  { value: 'long', label: '详细（1000-1500字）' },
];

export default function WritingWorkshop() {
  const [genre, setGenre] = useState('新闻报道');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('medium');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const showNotification = useAppStore((s) => s.showNotification);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res: any = await writingApi.generate({ genre, prompt, tone, length });
      setResult(res.content);
    } catch {
      showNotification('error', '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">智能写作工坊</h1>
        <p className="text-slate-400 text-sm mt-1">20+文体支持 · AI 智能创作</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 控制面板 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="glass-card p-5 space-y-4">
            <SelectRow label="文体" value={genre} options={GENRES.map((g) => ({ value: g, label: g }))} onChange={setGenre} />
            <SelectRow label="语气" value={tone} options={TONES} onChange={setTone} />
            <SelectRow label="篇幅" value={length} options={LENGTHS} onChange={setLength} />

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想写的内容..."
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 resize-none h-28 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-300"
            />
            <GenerateButton onClick={handleGenerate} loading={loading} label="开始创作" className="w-full" />
          </div>
        </motion.div>

        {/* 结果区 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {result ? (
            <ResultCard title={`${genre} · 生成结果`}>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result}</div>
            </ResultCard>
          ) : (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3 opacity-20">✎</div>
              <p className="text-slate-300 text-sm">选择文体并在左侧输入需求，开始创作</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
