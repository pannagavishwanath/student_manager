# AWS deployment guide (S3 + Lambda Function URL only)

This guide uses two S3 buckets:
- **Website bucket:** public read access for static website files only.
- **Private data bucket:** stores task JSON, material metadata and study files. Keep public access blocked.

No DynamoDB and no API Gateway are used.

## Part A — Deploy the frontend to S3

1. Open the AWS Console and choose the Mumbai region (`ap-south-1`).
2. Open S3 and create a globally unique bucket for the website.
3. For the basic S3 website endpoint, enable static website hosting under Properties. Set `index.html` as the index document and `index.html` as the error document for this single-page app.
4. For this website bucket only, configure public read access and a bucket policy allowing `s3:GetObject` on `arn:aws:s3:::YOUR_WEBSITE_BUCKET/*`.
5. Build the frontend:

   ```powershell
   cd frontend
   npm install
   npm run build
   ```

6. Upload the **contents** of `frontend/dist` to the website bucket (not the `dist` folder itself).
7. Copy the S3 website endpoint from Properties. It will be the frontend origin used in the next steps.

S3 static website endpoints use HTTP. For HTTPS, put CloudFront in front of the bucket and keep the bucket private with Origin Access Control. Never upload `.env`, credentials, source maps containing secrets, or private files to the public website bucket.

## Part B — Create a private data bucket

1. In S3, create a second globally unique bucket in the same region.
2. Keep **Block all public access enabled**.
3. Enable default encryption (SSE-S3).
4. Do not enable static website hosting on this bucket.
5. Add CORS under Permissions. Replace the example website origin with the exact S3 website endpoint copied in Part A. Keep localhost for local testing if needed:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedOrigins": [
         "http://YOUR_WEBSITE_BUCKET.s3-website.ap-south-1.amazonaws.com",
         "http://localhost:5173"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

## Part C — Create the Lambda function

1. Open AWS Lambda and choose Create function > Author from scratch.
2. Name: `smart-student-task-manager-api`.
3. Runtime: Python 3.12 (or another supported Python runtime).
4. Create a new execution role with basic Lambda permissions.
5. Create the function.
6. In the Code tab, replace the contents of `lambda_function.py` with `backend/lambda_function.py`. The handler setting should be `lambda_function.lambda_handler`.
7. In Configuration > Environment variables, add:
   - `DATA_BUCKET` = your private data bucket name
   - `ALLOWED_ORIGIN` = exact website origin, including `http://` and no trailing slash for an S3 website endpoint
8. In Configuration > Permissions, open the execution role and attach the policy below. Replace `YOUR_PRIVATE_BUCKET`:

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

9. Create a Function URL under Configuration > Function URL. Choose Auth type `NONE` for this public academic demo. Configure CORS:
   - Allowed origins: exact website origin
   - Allowed methods: GET, POST, PUT, DELETE
   - Allowed headers: Content-Type
10. Save and copy the Function URL.

The handler returns CORS headers as well. Do not set `ALLOWED_ORIGIN` to `*` in a deployed setup if you can use the exact website origin.

## Part D — Connect the frontend

1. In `frontend`, copy `.env.example` to a new file named `.env`.
2. Set the Function URL:

   ```env
   VITE_API_URL=https://YOUR_FUNCTION_URL.lambda-url.ap-south-1.on.aws
   ```

3. Rebuild:

   ```powershell
   cd frontend
   npm run build
   ```

4. Upload the **contents** of the newly generated `frontend/dist` folder to the website bucket and overwrite old files.
5. Open the website endpoint and test:
   - Create a task, refresh, and confirm it remains.
   - Edit a task and mark it complete.
   - Delete a task.
   - Upload a small PDF, download it, then delete it.

## Part E — Verify the backend

Open this URL in a browser:

`YOUR_FUNCTION_URL/health`

Expected response:

```json
{"status":"ok","service":"smart-student-task-manager"}
```

If the website cannot call Lambda:
- Check Function URL CORS allowed origin exactly matches the website origin.
- Check `ALLOWED_ORIGIN` Lambda environment variable.
- Check private S3 bucket CORS includes the website origin and allows PUT.
- Check Lambda execution-role S3 permissions.
- Check Lambda CloudWatch logs for errors.

## Notes and limits

- The current Lambda implementation stores task and material metadata in JSON files in S3. It is simple for a single-user college demo, but simultaneous updates can overwrite one another.
- The Function URL has no authentication. Anyone who knows the URL can read or change the demo data. Do not store sensitive information.
- The current frontend accepts study files up to 10 MB. S3 uploads use presigned PUT URLs; the file itself does not pass through Lambda.
- Use a billing budget. AWS Free Tier eligibility and limits depend on the account and current AWS offer.
