"""项目模型"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), default="未命名项目")
    description = Column(Text, default="")
    source_idea = Column(Text, default="")          # 最初的灵感输入
    style = Column(String(50), default="general")    # 风格标签
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "source_idea": self.source_idea,
            "style": self.style,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
