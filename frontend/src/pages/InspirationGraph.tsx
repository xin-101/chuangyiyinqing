import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { inspirationApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton } from '../components/common/UIComponents';

type GraphNode = { id: string; label: string; group: string; level: number };
type GraphEdge = { from: string; to: string; label: string };

export default function InspirationGraph() {
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const showNotification = useAppStore((s) => s.showNotification);

  const handleExpand = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    try {
      const res: any = await inspirationApi.expand({ concept });
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
      showNotification('success', '灵感图谱已展开');
    } catch {
      showNotification('error', '展开失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async (nodeLabel: string) => {
    try {
      const res: any = await inspirationApi.associate({ node_label: nodeLabel });
      if (res.nodes && res.edges) {
        const newNodes = res.nodes.map((n: GraphNode) => ({
          ...n,
          id: `${nodeLabel}_${n.id}`,
        }));
        const newEdges = res.edges.map((e: GraphEdge) => ({
          ...e,
          from: e.from === 'clicked' ? nodes.find((n) => n.label === nodeLabel)?.id || 'root' : e.from,
          to: `${nodeLabel}_${e.to}`,
        }));
        setNodes((prev) => [...prev, ...newNodes]);
        setEdges((prev) => [...prev, ...newEdges]);
        showNotification('success', `从「${nodeLabel}」发散出新灵感`);
      }
    } catch {
      showNotification('error', '联想失败');
    }
  };

  // 初始化 vis-network
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(async () => {
      if (!graphRef.current || nodes.length === 0) return;
      try {
        const { Network } = await import('vis-network/standalone');
        if (networkRef.current) {
          networkRef.current.destroy();
        }
        const visNodes = nodes.map((n) => ({
          id: n.id,
          label: n.label,
          group: n.group,
          font: { color: '#e8e8ff', size: n.level === 0 ? 18 : 13, face: 'Noto Sans SC' },
          color: {
            background: n.level === 0 ? '#00d4ff' : n.group === 'related_themes' ? '#8b5cf6' : n.group === 'style_refs' ? '#f59e0b' : n.group === 'emotions' ? '#ec4899' : '#00d4ff',
            border: n.level === 0 ? '#00d4ff' : 'rgba(255,255,255,0.2)',
            highlight: { background: '#00d4ff', border: '#ffffff' },
          },
          borderWidth: n.level === 0 ? 3 : 1,
          size: n.level === 0 ? 30 : 20,
          shape: 'dot',
        }));
        const visEdges = edges.map((e) => ({
          from: e.from,
          to: e.to,
          label: e.label,
          font: { color: 'rgba(255,255,255,0.3)', size: 10, strokeWidth: 0 },
          color: { color: 'rgba(255,255,255,0.15)', highlight: '#00d4ff' },
          width: 1,
        }));
        networkRef.current = new Network(graphRef.current, { nodes: visNodes, edges: visEdges }, {
          nodes: { borderWidth: 2, shadow: true },
          edges: { smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 } },
          physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -40, springLength: 150 } },
          interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true },
          layout: { improvedLayout: true },
        });
        networkRef.current.on('doubleClick', (params: any) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.find((n) => n.id === nodeId);
            if (node && node.level < 2) {
              handleAssociate(node.label);
            }
          }
        });
      } catch (e) {
        console.warn('vis-network init failed:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">创意灵感图谱</h1>
        <p className="text-slate-400 text-sm mt-1">输入概念 · AI 发散联想 · 双击节点继续探索</p>
      </motion.div>

      {/* 输入 */}
      <div className="glass-card p-4 mb-6 flex gap-3 items-center">
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExpand()}
          placeholder="输入核心创意概念，例如：未来城市..."
          className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-500/50 placeholder:text-slate-300"
        />
        <GenerateButton onClick={handleExpand} loading={loading} label="展开图谱" />
      </div>

      {/* 图谱展示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card overflow-hidden"
        style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}
      >
        {nodes.length > 0 ? (
          <div ref={graphRef} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-20">✦</div>
              <p className="text-slate-300 text-sm">输入概念展开灵感图谱</p>
              <p className="text-slate-200 text-xs mt-1">双击节点可继续联想发散</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* 节点说明 */}
      {nodes.length > 0 && (
        <div className="flex gap-4 mt-4 text-xs text-slate-400 justify-center">
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-cyan mr-1" /> 核心概念</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-purple mr-1" /> 相关主题</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-gold mr-1" /> 风格参考</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-pink mr-1" /> 情感/衍生</span>
        </div>
      )}
    </div>
  );
}
