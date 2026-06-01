"""版本模型 - 保存每次 AI 生成的结果快照"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.db.database import Base


class Version(Base):
    __tablename__ = "versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), default="")          # 版本标签，如 "v1.0", "初稿"
    content_type = Column(String(50), default="text")  # text / image / fusion
    content = Column(Text, default="")                 # 文本内容或 JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "label": self.label,
            "content_type": self.content_type,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
