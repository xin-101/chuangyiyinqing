"""图像记录模型"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.db.database import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    prompt = Column(Text, default="")
    style = Column(String(50), default="general")
    image_url = Column(String(500), default="")
    image_data = Column(Text, default="")   # Base64 备用
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "prompt": self.prompt,
            "style": self.style,
            "image_url": self.image_url,
            "image_data": self.image_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
