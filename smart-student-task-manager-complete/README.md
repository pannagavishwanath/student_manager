# Smart Student Task Manager

A responsive React + Vite student task manager deployed with Amazon S3 and AWS Lambda. It does **not** use DynamoDB or API Gateway.

## Technology stack

- Frontend: React, HTML, CSS, JavaScript (Vite)
- Static website hosting: Amazon S3
- Backend: AWS Lambda (Python)
- Backend endpoint: Lambda Function URL (no API Gateway)
- Task and material metadata: JSON objects in a private Amazon S3 bucket
- Study-material files: private S3 objects uploaded/downloaded using short-lived presigned URLs

## Features

- Dashboard with task statistics and upcoming deadlines
- Create, edit, delete and complete tasks
- Search and filter tasks
- Study planner
- Upload, download and delete study materials
- Local demo mode with browser localStorage when `VITE_API_URL` is empty
- AWS mode with Lambda + private S3 when `VITE_API_URL` is configured

## Folder structure

```text
smart-student-task-manager/
├── README.md
├── .gitignore
├── DEPLOYMENT.md
├── backend/
│   ├── README.md
│   └── lambda_function.py
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── index.css
        ├── components/
        ├── data/
        ├── pages/
        └── utils/
            ├── api.js
            ├── constants.js
            └── helpers.js
```

## Run locally

Install Node.js 18 or newer, then:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

If `VITE_API_URL` is blank, the app runs in local demo mode and stores task metadata in the browser's localStorage. Uploaded local-demo files are held in memory as object URLs and are not permanent across browser restarts.

## Connect AWS

1. Follow [DEPLOYMENT.md](DEPLOYMENT.md).
2. Create a public S3 website bucket for the frontend.
3. Create a separate private S3 bucket for application data and study files.
4. Deploy `backend/lambda_function.py` to AWS Lambda.
5. Create a Lambda Function URL with CORS. Do not create API Gateway or DynamoDB.
6. Set `DATA_BUCKET` and `ALLOWED_ORIGIN` in Lambda environment variables.
7. Configure the Lambda execution role and private S3 bucket CORS as described in `backend/README.md`.
8. Copy the Function URL into `frontend/.env` as `VITE_API_URL`.
9. Run `npm run build` and upload the contents of `frontend/dist` to the website bucket.

## Important security notes

This is an academic single-user demo, not a production multi-user service. The Function URL is public and has no authentication. Anyone who knows it can access or modify the demo's tasks and materials. Do not store sensitive or confidential data. The JSON-file persistence model can lose updates if multiple writes happen simultaneously. Use authentication and a database before making this a real multi-user service.

## Cost note

AWS pricing and Free Tier eligibility depend on account age, account plan, region and usage. Set a billing budget and check current service pricing. S3 storage/requests, Lambda invocations and data transfer may incur charges.
