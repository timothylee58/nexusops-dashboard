# NexusOps dashboard

Vite + React dashboard with a mock Express API under `/api` (SSE stream, idempotent payments).

## Development

```bash
npm ci
npm run dev:all
```

- UI: [http://localhost:8080](http://localhost:8080) (Vite proxies `/api` to the API)

## Production build (single origin)

The browser expects `/api` on the **same host** as the UI. In production, Express serves the Vite output from `dist/` when that folder exists.

Set **`VITE_OFFLINE_FEED=false`** at build time so the app uses the live API instead of the bundled offline feed:

```bash
# Linux / macOS
export VITE_OFFLINE_FEED=false
npm run build
npm start
```

```powershell
# Windows PowerShell
$env:VITE_OFFLINE_FEED="false"; npm run build; npm start
```

`npm start` listens on **`PORT`** (default `3001`), or **`MOCK_API_PORT`** if `PORT` is unset. AWS App Runner sets `PORT` automatically.

Optional: **`MOCK_API_CORS`** — comma-separated origins if you split frontend and API later.

## Docker

```bash
docker build -t nexusops-dashboard .
docker run --rm -p 8080:8080 nexusops-dashboard
```

Open [http://localhost:8080](http://localhost:8080) — health check: [http://localhost:8080/api/health](http://localhost:8080/api/health).

## AWS (App Runner)

1. Create an **ECR** repository (e.g. `nexusops-dashboard`).
2. Push this image (from CI or locally):

   ```bash
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker tag nexusops-dashboard:latest <account>.dkr.ecr.<region>.amazonaws.com/nexusops-dashboard:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/nexusops-dashboard:latest
   ```

3. In **App Runner**, create a service from the ECR image, port **8080**, health check path **`/api/health`**.

## GitHub Actions → ECR → App Runner

Workflow **Deploy to ECR**: [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml).

Configure **repository secrets**:

| Secret | Purpose |
|--------|---------|
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for OIDC (recommended) |
| `AWS_REGION` | e.g. `us-east-1` |
| `ECR_REPOSITORY` | ECR repo name only (not full URI) |
| `APP_RUNNER_SERVICE_ARN` | Optional; if set, triggers `aws apprunner start-deployment` after push |

Enable OIDC: add a GitHub federation identity provider on IAM and trust `repo:<org>/<repo>:ref:refs/heads/main` on the role used by `AWS_ROLE_TO_ASSUME`. Attach policies allowing `ecr:*` push for your repo and `apprunner:StartDeployment` if you use App Runner deploy step.
