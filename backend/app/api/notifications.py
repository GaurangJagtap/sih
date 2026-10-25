from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Notification, User, UserRole

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])

@router.get("")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification)
    if current_user.role == UserRole.INSTITUTION:
        query = query.where(
            (Notification.recipient_user_id == current_user.id) |
            (Notification.institution_id == current_user.institution_id)
        )
    else:
        query = query.where(
            (Notification.recipient_user_id == current_user.id) |
            (Notification.recipient_user_id == None)
        )

    query = query.order_by(Notification.created_at.desc()).limit(30)
    result = await db.execute(query)
    notifications = result.scalars().all()

    return [
        {
            "id": n.id,
            "event_type": n.event_type,
            "channel": n.channel,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "delivery_status": n.delivery_status,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]

@router.post("/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = result.scalars().first()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"message": "Notification marked read"}
