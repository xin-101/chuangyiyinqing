"""AI 调用记录模型 - 记录每次前端调用模型的输入、模型名、是否成功"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.db.database import Base


class AICallLog(Base):
    __tablename__ = "ai_call_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    call_type = Column(String(20), default="text")          # text / image / multimodal
    input_text = Column(Text, default="")                    # 输入内容（prompt）
    model = Column(String(100), default="")                  # 调用的模型名
    success = Column(Boolean, default=True)                  # 是否成功
    response_summary = Column(String(500), default="")       # 响应摘要（前200字或状态）
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "call_type": self.call_type,
            "input_text": self.input_text,
            "model": self.model,
            "success": self.success,
            "response_summary": self.response_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
