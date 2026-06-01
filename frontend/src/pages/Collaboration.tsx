import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { projectApi } from '../api';
import { useAppStore } from '../store/useAppStore';
import { GenerateButton } from '../components/common/UIComponents';

interface Project { id: number; title: string; }
interface Comment { id: number; project_id: number; author: string; content: string; created_at: string; }
interface Member { id: number; name: string; role: string; avatar: string; }

export default function Collaboration() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('匿名用户');
  const [loading, setLoading] = useState(false);
  const showNotification = useAppStore((s) => s.showNotification);

  useEffect(() => {
    projectApi.list().then((res: any) => setProjects(res.projects || [])).catch(() => {});
  }, []);

  const loadProjectData = async (projectId: number) => {
    setSelectedProjectId(projectId);
    try {
      const [cRes, mRes] = await Promise.all([
        projectApi.comments.list(projectId),
        projectApi.members(projectId),
      ]);
      setComments((cRes as any).comments || []);
      setMembers((mRes as any).members || []);
    } catch {
      showNotification('error', '加载协作数据失败');
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedProjectId) return;
    setLoading(true);
    try {
      const res: any = await projectApi.comments.add(selectedProjectId, {
        author: authorName,
        content: newComment,
      });
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
      showNotification('success', '评论已发送');
    } catch {
      showNotification('error', '评论失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">团队协作</h1>
        <p className="text-white/40 text-sm mt-1">项目协作 · 评论讨论 · 团队成员</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 项目选择 */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs text-white/40 mb-2">选择项目</p>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => loadProjectData(p.id)}
              className={`w-full text-left glass-card p-3 text-xs transition-all ${
                selectedProjectId === p.id ? 'ring-1 ring-neon-cyan/30 text-white/80' : 'text-white/50 hover:text-white/70'
              }`}
            >
              {p.title}
            </button>
          ))}
          {projects.length === 0 && (
            <p className="text-white/20 text-xs text-center py-4">暂无项目</p>
          )}
        </div>

        {/* 评论 & 成员 */}
        <div className="lg:col-span-3">
          {!selectedProjectId ? (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3 opacity-20">👥</div>
              <p className="text-white/20 text-sm">选择一个项目开始协作</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 成员列表 */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">团队成员</h3>
                <div className="flex gap-4">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center text-xs text-white/70">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-xs text-white/60">{m.name}</p>
                        <p className="text-[10px] text-white/30">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 评论区 */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">讨论区</h3>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {comments.length === 0 && (
                    <p className="text-xs text-white/20 text-center py-4">暂无评论，发起讨论</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neon-cyan/60">{c.author}</span>
                        <span className="text-[10px] text-white/20">{new Date(c.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                      <p className="text-xs text-white/60">{c.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="你的名字"
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 focus:outline-none placeholder:text-white/20"
                  />
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="输入评论..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-neon-cyan/30 placeholder:text-white/20"
                  />
                  <button
                    onClick={addComment}
                    disabled={loading}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs text-white/60 transition-colors disabled:opacity-50"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
