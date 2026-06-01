import { useAppStore } from '../../store/useAppStore';

export default function Notification() {
  const notification = useAppStore((s) => s.notification);
  const clearNotification = useAppStore((s) => s.clearNotification);

  if (!notification) return null;

  const bgMap = {
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border backdrop-blur-sm ${bgMap[notification.type]} shadow-lg animate-[slideDown_0.3s_ease-out]`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{notification.message}</span>
        <button onClick={clearNotification} className="ml-2 text-white/40 hover:text-white/70 text-sm">&times;</button>
      </div>
    </div>
  );
}
