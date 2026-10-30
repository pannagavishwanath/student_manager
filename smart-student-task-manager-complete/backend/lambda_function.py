import base64
import json
import os
import re
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
BUCKET = os.environ["DATA_BUCKET"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
TASKS_KEY = "app-data/tasks.json"
MATERIALS_KEY = "app-data/materials.json"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "txt", "png", "jpg", "jpeg"}


def response(status, payload=None):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": "" if payload is None else json.dumps(payload),
    }


def read_collection(key):
    try:
        result = s3.get_object(Bucket=BUCKET, Key=key)
        return json.loads(result["Body"].read().decode("utf-8"))
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") in ("NoSuchKey", "404", "NotFound"):
            return []
        raise


def write_collection(key, items):
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(items, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )


def parse_body(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw)


def clean_filename(name):
    name = os.path.basename(str(name or "upload"))
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name[:120] or "upload"


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET").upper()
    path = event.get("rawPath", "/").rstrip("/") or "/"

    if method == "OPTIONS":
        return response(200, {"ok": True})

    try:
        if method == "GET" and path == "/health":
            return response(200, {"status": "ok", "service": "smart-student-task-manager"})

        if path == "/tasks":
            tasks = read_collection(TASKS_KEY)
            if method == "GET":
                return response(200, {"tasks": tasks})
            if method == "POST":
                task = parse_body(event)
                task.setdefault("taskId", str(uuid.uuid4()))
                task.setdefault("status", "pending")
                task.setdefault("createdAt", datetime.now(timezone.utc).isoformat())
                task["updatedAt"] = datetime.now(timezone.utc).isoformat()
                tasks.insert(0, task)
                write_collection(TASKS_KEY, tasks)
                return response(201, {"task": task})

        if path.startswith("/tasks/"):
            task_id = path.split("/")[-1]
            tasks = read_collection(TASKS_KEY)
            if method == "PUT":
                update = parse_body(event)
                found = False
                for index, task in enumerate(tasks):
                    if task.get("taskId") == task_id:
                        tasks[index] = {**task, **update, "taskId": task_id,
                                        "updatedAt": datetime.now(timezone.utc).isoformat()}
                        found = True
                        break
                if not found:
                    return response(404, {"error": "Task not found."})
                write_collection(TASKS_KEY, tasks)
                return response(200, {"task": tasks[index]})
            if method == "DELETE":
                remaining = [task for task in tasks if task.get("taskId") != task_id]
                if len(remaining) == len(tasks):
                    return response(404, {"error": "Task not found."})
                write_collection(TASKS_KEY, remaining)
                return response(200, {"message": "Task deleted."})

        if path == "/materials" and method == "GET":
            return response(200, {"materials": read_collection(MATERIALS_KEY)})

        if path == "/materials/upload-url" and method == "POST":
            data = parse_body(event)
            filename = clean_filename(data.get("fileName"))
            extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            size = int(data.get("fileSize") or 0)
            if extension not in ALLOWED_EXTENSIONS:
                return response(400, {"error": "File type is not allowed."})
            if size <= 0 or size > MAX_UPLOAD_BYTES:
                return response(400, {"error": "File must be between 1 byte and 10 MB."})

            material_id = str(uuid.uuid4())
            key = f"uploads/{material_id}/{filename}"
            file_type = data.get("fileType") or "application/octet-stream"
            upload_url = s3.generate_presigned_url(
                "put_object",
                Params={"Bucket": BUCKET, "Key": key, "ContentType": file_type},
                ExpiresIn=300,
            )
            material = {
                "materialId": material_id,
                "userId": "demo-user",
                "taskId": data.get("taskId") or None,
                "fileName": filename,
                "fileType": file_type,
                "fileSize": size,
                "s3Key": key,
                "uploadedAt": datetime.now(timezone.utc).isoformat(),
            }
            materials = read_collection(MATERIALS_KEY)
            materials.insert(0, material)
            write_collection(MATERIALS_KEY, materials)
            return response(201, {"uploadUrl": upload_url, "material": material})

        if path.startswith("/materials/") and path.endswith("/download") and method == "GET":
            material_id = path.split("/")[-2]
            material = next((item for item in read_collection(MATERIALS_KEY)
                             if item.get("materialId") == material_id), None)
            if not material:
                return response(404, {"error": "File not found."})
            download_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET, "Key": material["s3Key"],
                        "ResponseContentDisposition": f'attachment; filename="{quote(material["fileName"])}"'},
                ExpiresIn=300,
            )
            return response(200, {"downloadUrl": download_url})

        if path.startswith("/materials/") and method == "DELETE":
            material_id = path.split("/")[-1]
            materials = read_collection(MATERIALS_KEY)
            material = next((item for item in materials if item.get("materialId") == material_id), None)
            if not material:
                return response(404, {"error": "File not found."})
            s3.delete_object(Bucket=BUCKET, Key=material["s3Key"])
            write_collection(MATERIALS_KEY, [item for item in materials if item.get("materialId") != material_id])
            return response(200, {"message": "File deleted."})

        return response(404, {"error": "Route not found."})

    except (ValueError, json.JSONDecodeError):
        return response(400, {"error": "Invalid JSON request."})
    except Exception as error:
        print(f"Unhandled error: {error}")
        return response(500, {"error": "Internal server error. Check the Lambda logs."})
