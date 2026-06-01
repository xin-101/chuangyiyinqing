import { useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function LoadingButton({ children, className = '' }: Props) {
  return (
    <button disabled className={`opacity-60 cursor-not-allowed ${className}`}>
      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 align-middle" />
      {children}
    </button>
  );
}

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export function GenerateButton({ onClick, loading, label = '生成', loadingLabel = '生成中...', className = '' }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        loading
          ? 'bg-white/5 text-white/40 cursor-not-allowed'
          : 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 text-white border border-white/10 hover:border-neon-cyan/30 shadow-lg shadow-neon-cyan/5 hover:shadow-neon-cyan/10'
      } ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>✦</span> {label}
        </span>
      )}
    </button>
  );
}

// 选择器行
interface SelectRowProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-white/50 whitespace-nowrap min-w-[3rem]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/40 transition-colors appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#12122a]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// 结果展示卡片
interface ResultCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ResultCard({ title, children, className = '' }: ResultCardProps) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
