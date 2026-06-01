"""评论模型（协作功能）"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.db.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author = Column(String(100), default="匿名用户")
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "author": self.author,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
