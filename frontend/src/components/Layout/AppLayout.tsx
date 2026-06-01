import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Notification from '../common/Notification';
import { useAppStore } from '../../store/useAppStore';

export default function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const location = useLocation();

  return (
    <div className="gradient-bg min-h-screen">
      <Sidebar />
      <Notification />

      {/* 主内容区 */}
      <div
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'ml-56' : 'ml-0'
        }`}
      >
        {/* 顶部栏 */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl bg-[#0a0a1a]/60">
          <button
            onClick={toggleSidebar}
            className="text-white/40 hover:text-white/70 text-lg transition-colors p-1"
          >
            {sidebarOpen ? '◁' : '▷'}
          </button>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse" />
            系统在线
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
