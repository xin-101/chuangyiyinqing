import { useReducer, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { streamRequest } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton } from '../components/common/UIComponents';

// ── useReducer: 流式状态管理（替代 useState + useRef 闭包 hack）──

type StreamState = {
  writing: string;
  image_prompt: string;
  image_urls: string[];
  video_outline: string;
};

type StreamAction =
  | { type: 'writing'; content: string }
  | { type: 'image_prompt'; content: string }
  | { type: 'image'; urls: string[] }
  | { type: 'video_outline'; content: string }
  | { type: 'reset' };

function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'writing':
      return { ...state, writing: state.writing + action.content };
    case 'image_prompt':
      return { ...state, image_prompt: action.content };
    case 'image':
      return { ...state, image_urls: action.urls };
    case 'video_outline':
      return { ...state, video_outline: state.video_outline + action.content };
    case 'reset':
      return { writing: '', image_prompt: '', image_urls: [], video_outline: '' };
  }
}

// ── 工具：复制到剪贴板 ──

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

function downloadAsMarkdown(state: StreamState) {
  const parts: string[] = ['# 创艺引擎 · 全案生成报告\n'];
  if (state.writing) {
    parts.push('## 创意文案\n');
    parts.push(state.writing + '\n');
  }
  if (state.image_prompt) {
    parts.push('## 配图方案\n');
    parts.push(`- 提示词：${state.image_prompt}\n`);
    state.image_urls.forEach((url, i) => {
      parts.push(`- ![配图${i + 1}](${url})\n`);
    });
    parts.push('\n');
  }
  if (state.video_outline) {
    parts.push('## 视频脚本梗概\n');
    parts.push(state.video_outline + '\n');
  }
  const blob = new Blob(parts, { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `创艺引擎_${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── 主组件 ──

export default function Dashboard() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamState, dispatch] = useReducer(streamReducer, {
    writing: '',
    image_prompt: '',
    image_urls: [],
    video_outline: '',
  });
  const [showResult, setShowResult] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const showNotification = useAppStore((s) => s.showNotification);
  const addRecentIdea = useAppStore((s) => s.addRecentIdea);

  const handleGenerate = useCallback(() => {
    if (!idea.trim()) return;

    abortRef.current?.abort();

    setLoading(true);
    setShowResult(true);
    dispatch({ type: 'reset' });

    abortRef.current = streamRequest(
      '/fusion/full-pipeline/stream',
      { idea: idea.trim() },
      (data) => {
        const type = data.type as string;
        if (type === 'writing') {
          dispatch({ type: 'writing', content: data.content as string });
        } else if (type === 'image_prompt') {
          dispatch({ type: 'image_prompt', content: data.content as string });
        } else if (type === 'image') {
          dispatch({ type: 'image', urls: data.urls as string[] });
        } else if (type === 'video_outline') {
          dispatch({ type: 'video_outline', content: data.content as string });
        }
      },
      () => {
        setLoading(false);
        addRecentIdea(idea.trim());
        showNotification('success', '全案生成完成！');
      },
      (err) => {
        setLoading(false);
        showNotification('error', `生成失败: ${err.message}`);
      },
    );
  }, [idea, addRecentIdea, showNotification]);

  const handleCopy = useCallback(() => {
    const text = [
      streamState.writing && `【创意文案】\n${streamState.writing}`,
      streamState.image_prompt && `【配图提示词】${streamState.image_prompt}`,
      streamState.video_outline && `【视频脚本】\n${streamState.video_outline}`,
    ].filter(Boolean).join('\n\n---\n\n');
    if (!text) return;
    copyToClipboard(text).then((ok) => {
      showNotification(ok ? 'success' : 'error', ok ? '已复制到剪贴板' : '复制失败');
    });
  }, [streamState, showNotification]);

  const exampleIdeas = [
    '用AI科技守护非遗文化传承',
    '一个关于未来城市的爱情故事',
    '让每个人都能成为艺术家的AI工具',
    '探索深海未知文明的纪录片',
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* 标题区 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-bold gradient-text mb-3">创艺引擎</h1>
        <p className="text-white/40 text-sm">输入一个灵感，收获完整的创作方案</p>
      </motion.div>

      {/* 灵感输入区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-8"
      >
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="输入你的创意灵感，例如：用AI守护传统文化..."
          className="w-full bg-transparent border border-white/10 rounded-xl p-4 text-white/80 text-sm resize-none h-24 focus:outline-none focus:border-cyan-400/30 transition-colors placeholder:text-white/20"
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2 flex-wrap">
            {exampleIdeas.map((ex) => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <GenerateButton onClick={handleGenerate} loading={loading} label="一键全案生成" />
        </div>
      </motion.div>

      {/* 生成结果 */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 文案输出（流式） */}
          {streamState.writing && (
            <div className="glass-card p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                ✦ 创意文案
                {loading && <span className="ml-2 inline-block w-2 h-4 bg-cyan-400/60 animate-pulse" />}
              </h3>
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {streamState.writing}
                {loading && <span className="inline-block w-2 h-4 bg-cyan-400/60 animate-pulse ml-1" />}
              </div>
            </div>
          )}

          {/* 配图区域 */}
          {(streamState.image_urls.length > 0 || streamState.image_prompt) && (
            <div className="glass-card p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">◈ 配图方案</h3>
              {streamState.image_urls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {streamState.image_urls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                      <img src={url} alt={`配图 ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {streamState.image_prompt && (
                <p className="text-xs text-white/30 mt-3">提示词: {streamState.image_prompt}</p>
              )}
            </div>
          )}

          {/* 视频脚本（流式） */}
          {streamState.video_outline && (
            <div className="glass-card p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                ◎ 视频脚本梗概
                {loading && !streamState.image_urls.length && <span className="ml-2 inline-block w-2 h-4 bg-cyan-400/60 animate-pulse" />}
              </h3>
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {streamState.video_outline}
              </div>
            </div>
          )}

          {/* 操作栏：复制 + 导出 */}
          {!loading && streamState.writing && (
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors"
              >
                复制到剪贴板
              </button>
              <button
                onClick={() => downloadAsMarkdown(streamState)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors"
              >
                导出 Markdown
              </button>
              <button onClick={() => navigate('/writing')} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors">继续精修文案</button>
              <button onClick={() => navigate('/visual')} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors">调整视觉方案</button>
              <button onClick={() => navigate('/inspiration')} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors">发散更多灵感</button>
            </div>
          )}
        </motion.div>
      )}

      {/* 空状态 */}
      {!showResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16"
        >
          <div className="text-5xl mb-4 opacity-20">✦</div>
          <p className="text-white/20 text-sm">在上方输入灵感，体验"一个灵感，全案生成"</p>
        </motion.div>
      )}
    </div>
  );
}
