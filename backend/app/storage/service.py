import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    @staticmethod
    async def save_file(upload_file: UploadFile, subfolder: str = "documents") -> dict:
        target_dir = os.path.join(settings.STORAGE_LOCAL_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        original_filename = upload_file.filename or "uploaded_file"
        file_ext = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        destination_path = os.path.join(target_dir, unique_filename)

        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        file_size = os.path.getsize(destination_path)
        return {
            "file_path": destination_path,
            "filename": original_filename,
            "file_size": file_size,
            "mime_type": upload_file.content_type or "application/octet-stream"
        }
