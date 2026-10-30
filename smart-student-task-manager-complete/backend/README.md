# AWS Lambda backend

This backend uses an AWS Lambda Function URL (no API Gateway) and a private S3 bucket for task metadata, material metadata, and uploaded files. It does not use DynamoDB.

## Lambda configuration

- Runtime: Python 3.12 (or a currently supported Python runtime)
- Handler: `lambda_function.lambda_handler`
- Environment variable `DATA_BUCKET`: name of the private S3 bucket
- Environment variable `ALLOWED_ORIGIN`: exact S3 static website origin, for example `http://smart-student-task-manager-example.s3-website.ap-south-1.amazonaws.com`

The Lambda Python runtime includes boto3. No third-party package installation is needed for this function.

## IAM permissions for the Lambda execution role

Replace `YOUR_PRIVATE_BUCKET` with the private data bucket name. Attach this least-scope policy to the Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::YOUR_PRIVATE_BUCKET/app-data/*",
        "arn:aws:s3:::YOUR_PRIVATE_BUCKET/uploads/*"
      ]
    }
  ]
}
```

## Function URL

Create a Function URL with Auth type `NONE` for this public demo. Configure CORS:
- Allowed origins: your exact S3 website origin
- Allowed methods: GET, POST, PUT, DELETE
- Allowed headers: Content-Type

Do not use `*` for the deployed website if you can specify its exact origin. The handler also returns CORS headers.

## S3 CORS for the private data bucket

In the private bucket, Permissions > Cross-origin resource sharing (CORS), add a rule. Replace the origin with your website origin:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://YOUR-WEBSITE-BUCKET.s3-website.ap-south-1.amazonaws.com",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

The private bucket must keep Block Public Access enabled. Files are uploaded and downloaded through short-lived presigned URLs.

## API routes

- `GET /health`
- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/{taskId}`
- `DELETE /tasks/{taskId}`
- `GET /materials`
- `POST /materials/upload-url`
- `GET /materials/{materialId}/download`
- `DELETE /materials/{materialId}`

This is a small single-user/student demonstration. It has no authentication or multi-user isolation. Anyone who obtains the public Function URL can call its routes. Do not store sensitive personal data. The JSON-file storage approach is not safe for concurrent multi-user writes; use a database for a production or multi-user system.
