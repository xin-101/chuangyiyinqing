import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../api';
import type { AICallLog } from '../types';

type Stats = {
  total_calls: number;
  success_count: number;
  fail_count: number;
  success_rate: number;
  by_type: Record<string, number>;
};

const typeLabels: Record<string, string> = {
  text: '文本生成',
  image: '图像生成',
  multimodal: '多模态理解',
};

export default function AdminConsole() {
  const [logs, setLogs] = useState<AICallLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logRes, statsRes] = await Promise.all([
        adminApi.getLogs(page, pageSize),
        adminApi.getStats(),
      ]);
      setLogs(logRes.data);
      setTotal(logRes.total);
      setStats(statsRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const filteredLogs = search
    ? logs.filter(
        (l) =>
          l.input_text.toLowerCase().includes(search.toLowerCase()) ||
          l.model.toLowerCase().includes(search.toLowerCase()) ||
          l.response_summary.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold gradient-text mb-1">管理控制台</h1>
        <p className="text-slate-400 text-sm">AI 模型调用记录与状态监控</p>
      </motion.div>

      {/* 统计卡片 */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: '总调用次数', value: stats.total_calls, color: 'text-blue-400' },
            { label: '成功次数', value: stats.success_count, color: 'text-green-400' },
            { label: '失败次数', value: stats.fail_count, color: 'text-red-400' },
            { label: '成功率', value: `${stats.success_rate}%`, color: 'text-cyan-400' },
          ].map((item) => (
            <div key={item.label} className="glass-card p-4">
              <p className="text-slate-400 text-xs mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* 按类型分布 */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <h2 className="text-sm font-semibold text-slate-600 mb-3">按调用类型分布</h2>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(stats.by_type).map(([type, count]) => (
              <div key={type} className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-slate-400">{typeLabels[type] || type}</span>
                <span className="text-sm font-bold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 调用记录列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">调用记录</h2>
          <input
            type="text"
            placeholder="搜索输入内容、模型名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-white/30 w-56 focus:outline-none focus:border-sky-500/60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium">类型</th>
                <th className="text-left px-4 py-3 font-medium">模型</th>
                <th className="text-left px-4 py-3 font-medium max-w-xs">输入内容</th>
                <th className="text-left px-4 py-3 font-medium max-w-xs">响应摘要</th>
                <th className="text-center px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-300">
                    加载中...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-300">
                    暂无调用记录
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 rounded px-2 py-0.5 text-slate-600">
                        {typeLabels[log.call_type] || log.call_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{log.model}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={log.input_text}>
                      {log.input_text}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={log.response_summary}>
                      {log.response_summary}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.success ? (
                        <span className="text-green-400">✓ 成功</span>
                      ) : (
                        <span className="text-red-400">✗ 失败</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {new Date(log.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              共 {total} 条记录，第 {page}/{totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
