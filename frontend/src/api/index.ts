import type { AICallLog } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

// ── 写作工坊 ──
export const writingApi = {
  generate: (data: { genre: string; prompt: string; tone?: string; style_pref?: string; length?: string }) =>
    request('/writing/generate', { method: 'POST', body: JSON.stringify(data) }),
  transform: (data: { text: string; mode: string; target_style?: string; target_lang?: string }) =>
    request('/writing/transform', { method: 'POST', body: JSON.stringify(data) }),
  genres: () => request<{ success: boolean; genres: string[] }>('/writing/genres'),
};

// ── 视觉工坊 ──
export const visualApi = {
  textToImage: (data: { prompt: string; style?: string; size?: string }) =>
    request('/visual/text-to-image', { method: 'POST', body: JSON.stringify(data) }),
  design: (data: { template: string; title: string; subtitle?: string; style?: string }) =>
    request('/visual/design', { method: 'POST', body: JSON.stringify(data) }),
  styles: () => request<{ success: boolean; styles: string[] }>('/visual/styles'),
  templates: () => request<{ success: boolean; templates: string[] }>('/visual/templates'),
};

// ── 多模态融合 ──
export const fusionApi = {
  match: (data: { text: string; style?: string; composition?: string }) =>
    request('/fusion/match', { method: 'POST', body: JSON.stringify(data) }),
  videoScript: (data: { topic: string; duration?: string }) =>
    request('/fusion/video-script', { method: 'POST', body: JSON.stringify(data) }),
  fullPipeline: (data: { idea: string }) =>
    request('/fusion/full-pipeline', { method: 'POST', body: JSON.stringify(data) }),
};

// ── 灵感图谱 ──
export const inspirationApi = {
  expand: (data: { concept: string; depth?: number }) =>
    request('/inspiration/expand', { method: 'POST', body: JSON.stringify(data) }),
  associate: (data: { node_label: string }) =>
    request('/inspiration/associate', { method: 'POST', body: JSON.stringify(data) }),
};

// ── 项目管理 ──
export const projectApi = {
  list: (page = 1, pageSize = 20) =>
    request<{ success: boolean; projects: unknown[]; total: number; page: number; page_size: number }>(
      `/projects?page=${page}&page_size=${pageSize}`
    ),
  create: (data: { title?: string; description?: string; source_idea?: string; style?: string }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request(`/projects/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request(`/projects/${id}`, { method: 'DELETE' }),
  versions: {
    list: (projectId: number) => request(`/projects/${projectId}/versions`),
    create: (projectId: number, data: { label?: string; content_type?: string; content?: string }) =>
      request(`/projects/${projectId}/versions`, { method: 'POST', body: JSON.stringify(data) }),
    get: (versionId: number) => request(`/projects/versions/${versionId}`),
    compare: (vid1: number, vid2: number) => request(`/projects/versions/${vid1}/compare/${vid2}`),
  },
  comments: {
    list: (projectId: number) => request(`/projects/${projectId}/comments`),
    add: (projectId: number, data: { author?: string; content: string }) =>
      request(`/projects/${projectId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },
  members: (projectId: number) => request(`/projects/${projectId}/members`),
};

// ── 管理控制台 ──
export const adminApi = {
  getLogs: (page = 1, pageSize = 20) =>
    request<{ success: boolean; data: AICallLog[]; total: number; page: number; page_size: number }>(
      `/admin/logs?page=${page}&page_size=${pageSize}`
    ),
  getStats: () =>
    request<{ success: boolean; total_calls: number; success_count: number; fail_count: number; success_rate: number; by_type: Record<string, number> }>(
      '/admin/logs/stats'
    ),
};

// ── SSE 流式请求工具 ──
export function streamRequest(
  url: string,
  body: object,
  onMessage: (data: Record<string, unknown>) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processBuffer() {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.type === 'done') {
                onDone?.();
                return;
              }
              onMessage(json);
            } catch {
              // skip
            }
          }
        }
      }

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            processBuffer();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          read();
        }).catch((err) => {
          if (err.name !== 'AbortError') onError?.(err);
        });
      }
      read();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError?.(err);
    });

  return controller;
}
