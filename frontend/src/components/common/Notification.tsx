import { useAppStore } from '../../store/useAppStore';

export default function Notification() {
  const notification = useAppStore((s) => s.notification);
  const clearNotification = useAppStore((s) => s.clearNotification);

  if (!notification) return null;

  const bgMap = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-sky-50 border-sky-200 text-sky-700',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border backdrop-blur-sm ${bgMap[notification.type]} shadow-lg animate-[slideDown_0.3s_ease-out]`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{notification.message}</span>
        <button onClick={clearNotification} className="ml-2 text-slate-400 hover:text-slate-700 text-sm">&times;</button>
      </div>
    </div>
  );
}
