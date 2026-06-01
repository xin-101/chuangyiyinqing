import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { projectApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton } from '../components/common/UIComponents';

interface Project {
  id: number;
  title: string;
  description: string;
  source_idea: string;
  style: string;
  created_at: string;
  updated_at: string;
}

interface Version {
  id: number;
  project_id: number;
  label: string;
  content_type: string;
  content: string;
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIdea, setNewIdea] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[number | null, number | null]>([null, null]);
  const [compareResult, setCompareResult] = useState<any>(null);
  const showNotification = useAppStore((s) => s.showNotification);

  const loadProjects = async () => {
    try {
      const res: any = await projectApi.list();
      setProjects(res.projects || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const loadVersions = async (projectId: number) => {
    try {
      const res: any = await projectApi.versions.list(projectId);
      setVersions(res.versions || []);
    } catch {
      setVersions([]);
    }
  };

  const selectProject = async (p: Project) => {
    setSelectedProject(p);
    setCompareMode(false);
    setCompareResult(null);
    await loadVersions(p.id);
  };

  const createProject = async () => {
    try {
      const res: any = await projectApi.create({
        title: newTitle || '未命名项目',
        description: newDesc,
        source_idea: newIdea,
      });
      setProjects((prev) => [res.project, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewIdea('');
      showNotification('success', '项目创建成功');
    } catch {
      showNotification('error', '创建失败');
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setVersions([]);
      }
      showNotification('success', '项目已删除');
    } catch {
      showNotification('error', '删除失败');
    }
  };

  const handleCompare = async () => {
    if (compareIds[0] === null || compareIds[1] === null) {
      showNotification('error', '请选择两个版本进行对比');
      return;
    }
    try {
      const res: any = await projectApi.versions.compare(compareIds[0], compareIds[1]);
      setCompareResult(res);
    } catch {
      showNotification('error', '对比失败');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">项目管理</h1>
          <p className="text-white/40 text-sm mt-1">创作成果管理 · 版本历史 · 版本对比</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white/70 transition-colors border border-white/10"
        >
          + 新建项目
        </button>
      </motion.div>

      {/* 新建项目弹窗 */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div className="glass-card p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-medium text-white/80 mb-4">新建项目</h2>
            <div className="space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="项目名称" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="项目描述" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 resize-none h-20 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20" />
              <textarea value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="灵感来源" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 resize-none h-20 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white/60">取消</button>
                <GenerateButton onClick={createProject} loading={false} label="创建" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 项目列表 */}
        <div className="lg:col-span-1 space-y-2">
          {projects.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-white/20 text-sm">还没有项目，点击右上角创建</p>
            </div>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => selectProject(p)}
              className={`glass-card p-3 cursor-pointer transition-all ${
                selectedProject?.id === p.id ? 'ring-1 ring-neon-cyan/30' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-white/80 truncate">{p.title}</h3>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">{p.source_idea || p.description || '无描述'}</p>
                  <p className="text-[10px] text-white/20 mt-1">{new Date(p.updated_at).toLocaleDateString('zh-CN')}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  className="text-white/20 hover:text-red-400 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 版本详情 & 对比 */}
        <div className="lg:col-span-2">
          {!selectedProject && !compareResult && (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3 opacity-20">▦</div>
              <p className="text-white/20 text-sm">选择一个项目查看版本历史</p>
            </div>
          )}

          {selectedProject && !compareMode && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/80">{selectedProject.title}</h2>
                <button
                  onClick={() => setCompareMode(true)}
                  className="text-xs text-neon-cyan/60 hover:text-neon-cyan/80"
                >
                  版本对比
                </button>
              </div>
              <p className="text-xs text-white/40 mb-4">{selectedProject.description || selectedProject.source_idea}</p>

              {versions.length === 0 && (
                <p className="text-xs text-white/20 py-6 text-center">暂无版本记录</p>
              )}
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/50">{v.label || `版本 #${v.id}`}</span>
                      <span className="text-[10px] text-white/20">{new Date(v.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2">{v.content?.slice(0, 200)}</p>
                    <span className="text-[10px] text-white/20 mt-1 inline-block">{v.content_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {compareMode && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/80">版本对比</h2>
                <button
                  onClick={() => { setCompareMode(false); setCompareResult(null); }}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  返回
                </button>
              </div>

              <div className="flex gap-3 items-center mb-4">
                <select
                  value={compareIds[0] ?? ''}
                  onChange={(e) => setCompareIds([Number(e.target.value), compareIds[1]])}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                >
                  <option value="">选择版本 A</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.label || `版本 #${v.id}`}</option>
                  ))}
                </select>
                <span className="text-white/20 text-xs">vs</span>
                <select
                  value={compareIds[1] ?? ''}
                  onChange={(e) => setCompareIds([compareIds[0], Number(e.target.value)])}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
                >
                  <option value="">选择版本 B</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.label || `版本 #${v.id}`}</option>
                  ))}
                </select>
                <button onClick={handleCompare} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs text-white/60 transition-colors">对比</button>
              </div>

              {compareResult && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-neon-cyan mb-2">版本 A</p>
                    <p className="text-xs text-white/50 whitespace-pre-wrap line-clamp-[15]">{compareResult.version_a?.content}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-neon-purple mb-2">版本 B</p>
                    <p className="text-xs text-white/50 whitespace-pre-wrap line-clamp-[15]">{compareResult.version_b?.content}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
