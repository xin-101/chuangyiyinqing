import { useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function LoadingButton({ children, className = '' }: Props) {
  return (
    <button disabled className={`opacity-60 cursor-not-allowed ${className}`}>
      <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin mr-2 align-middle" />
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
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border border-transparent shadow-lg shadow-sky-200/50 hover:shadow-sky-300/50'
      } ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
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
      <label className="text-xs text-slate-500 whitespace-nowrap min-w-[3rem]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-sky-500/60 transition-colors appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white">
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
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
