// 项目类型
export interface Project {
  id: number;
  title: string;
  description: string;
  source_idea: string;
  style: string;
  created_at: string;
  updated_at: string;
}

// 版本类型
export interface Version {
  id: number;
  project_id: number;
  label: string;
  content_type: string;
  content: string;
  created_at: string;
}

// 图片记录
export interface ImageRecord {
  id: number;
  project_id: number | null;
  prompt: string;
  style: string;
  image_url: string;
  image_data: string;
  created_at: string;
}

// 评论
export interface Comment {
  id: number;
  project_id: number;
  author: string;
  content: string;
  created_at: string;
}

// 成员
export interface Member {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

// 写作生成请求
export interface WritingGenerateRequest {
  genre: string;
  prompt: string;
  tone: string;
  style_pref: string;
  length: string;
}

// 视觉生成请求
export interface TextToImageRequest {
  prompt: string;
  style: string;
  size: string;
}

// 灵感图谱节点
export interface GraphNode {
  id: string;
  label: string;
  group: string;
  level: number;
}

// 灵感图谱边
export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

// AI 调用记录
export interface AICallLog {
  id: number;
  call_type: string;
  input_text: string;
  model: string;
  success: boolean;
  response_summary: string;
  created_at: string;
}

// API 通用响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  [key: string]: unknown;
}
