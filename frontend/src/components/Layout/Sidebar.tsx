import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { path: '/', label: '创作工作台', icon: '✦' },
  { path: '/writing', label: '智能写作', icon: '✎' },
  { path: '/visual', label: '视觉创作', icon: '◈' },
  { path: '/fusion', label: '多模态融合', icon: '◎' },
  { path: '/inspiration', label: '灵感图谱', icon: '✦' },
  { path: '/projects', label: '项目管理', icon: '▦' },
  { path: '/collaboration', label: '团队协作', icon: '👥' },
  { path: "/admin", label: "管理控制台", icon: "⚙" },
];

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 z-30 glass-card rounded-none border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✦</span>
          <div>
            <h1 className="text-sm font-bold gradient-text">创艺引擎</h1>
            <p className="text-[10px] text-white/40">多模态AI创意智能体</p>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white font-medium shadow-[inset_0_0_15px_rgba(0,212,255,0.08)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 底部版本信息 */}
      <div className="p-4 border-t border-white/5">
        <p className="text-[10px] text-white/30 text-center">v1.0 · AI 创意引擎</p>
      </div>
    </aside>
  );
}
