# NexusOps dashboard

Operations-style dashboard built with **Vite**, **React**, and **TypeScript**. It talks to a bundled **Express** mock API under **`/api`** (REST, **Server-Sent Events** for live transactions, idempotent payment POSTs).

> **Data disclaimer:** The API uses an **in-memory** mock dataset. It is intended for demos and development, not regulated production payments or durable records.

---

## Table of contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Tests and lint](#tests-and-lint)
- [Production behavior](#production-behavior)
- [Environment variables](#environment-variables)
- [Docker](#docker)
- [Deploy on AWS](#deploy-on-aws)
- [GitHub Actions: OIDC, ECR, and App Runner](#github-actions-oidc-ecr-and-app-runner)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Architecture

- **Single origin in production:** The UI calls **`/api/...`** with relative URLs and opens **`EventSource("/api/transactions/stream")`**. The Express app serves both the built SPA (`dist/`) and the API on one host/port, avoiding cross-origin API URLs and extra CORS complexity.
- **Offline vs live data:** In production builds, the client defaults to an **offline** feed unless **`VITE_OFFLINE_FEED=false`** is set at **build** time. The **Dockerfile** sets this for container images.

```text
Browser ──► Express (PORT)
              ├── /api/*     → JSON / SSE
              └── /*         → static assets + SPA fallback (index.html)
```

---

## Requirements

- **Node.js** 20+ (project CI/Docker use Node 22)
- **npm** (lockfile: `package-lock.json`)

---

## Local development

Install dependencies and run the UI plus API together:

```bash
npm ci
npm run dev:all
```

| Service | URL |
|--------|-----|
| Vite dev server (UI) | [http://localhost:8080](http://localhost:8080) |
| Mock API | `http://localhost:3001` (proxied as `/api` via Vite) |

Individual processes:

```bash
npm run dev          # UI only (port 8080)
npm run dev:api      # API only (default port 3001)
```

---

## Tests and lint

```bash
npm test
npm run lint
```

---

## Production behavior

1. Build the client: **`npm run build`** produces **`dist/`**.
2. Start the server: **`npm start`** runs **`node server/index.js`**.
3. If **`dist/`** exists, Express serves static files and falls back to **`index.html`** for client-side routes (**React Router**).

Use the **live API** in production bundles:

```bash
# Linux / macOS
export VITE_OFFLINE_FEED=false
npm run build
npm start
```

```powershell
# Windows PowerShell
$env:VITE_OFFLINE_FEED = "false"
npm run build
npm start
```

**Listen port:** **`PORT`** (used by AWS App Runner and many hosts), then **`MOCK_API_PORT`**, then **`3001`** if unset.

---

## Environment variables

Copy **[`.env.example`](.env.example)** to `.env` for local overrides. **Do not commit `.env`.**

| Variable | Scope | Purpose |
|----------|--------|---------|
| `VITE_OFFLINE_FEED` | Build-time (client) | Set to `false` so production JS calls **`/api`** instead of the offline feed. **Embedded in the browser bundle** — never put secrets here. |
| `MOCK_API_CORS` | Server | Comma-separated **`Origin`** values when the browser and API are on **different** hosts. Not needed for default same-origin Docker/App Runner setup. |
| `PORT` | Server | HTTP listen port (e.g. App Runner sets **`8080`**). |
| `MOCK_API_PORT` | Server | Fallback listen port if **`PORT`** is unset (local dev default **`3001`**). |

---

## Docker

Build and run locally:

```bash
docker build -t nexusops-dashboard .
docker run --rm -p 8080:8080 nexusops-dashboard
```

- **App URL:** [http://localhost:8080](http://localhost:8080)
- **Health:** [http://localhost:8080/api/health](http://localhost:8080/api/health)

The image sets **`VITE_OFFLINE_FEED=false`** during **`npm run build`** and exposes **`8080`**.

---

## Deploy on AWS

Typical path: **Amazon ECR** for the image and **AWS App Runner** (or ECS behind an ALB) to run it.

### 1. Amazon ECR

Create a repository (for example `nexusops-dashboard`). Authenticate Docker to your registry and push an image your CI or laptop built:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker tag nexusops-dashboard:latest <account-id>.dkr.ecr.<region>.amazonaws.com/<repository>:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/<repository>:latest
```

Use an IAM principal with **least-privilege** push rights to **that** repository (see [Security](#security)).

### 2. AWS App Runner

Create a service from the **ECR** image:

| Setting | Value |
|--------|--------|
| Container port | **8080** |
| Health check path | **`/api/health`** |

Adjust CPU/memory and autoscaling to your needs. If you scale **out** multiple instances, SSE streams are **not** shared across instances without architecture changes.

---

## GitHub Actions: OIDC, ECR, and App Runner

Workflow file: **[`.github/workflows/deploy-aws.yml`](.github/workflows/deploy-aws.yml)** — workflow name **“Deploy to ECR”**.

**Triggers:** push to **`main`**, and **`workflow_dispatch`** (manual).

**Flow:**

1. Checkout the repository.
2. Assume an IAM role via **OIDC** (`aws-actions/configure-aws-credentials@v4`).
3. Log in to **Amazon ECR** and **build/push** tags **`${{ github.sha }}`** and **`latest`**.
4. If **`APP_RUNNER_SERVICE_ARN`** is set, run **`aws apprunner start-deployment`**.

### Required job permissions (OIDC)

The **`deploy`** job must include:

```yaml
permissions:
  id-token: write   # Required so GitHub can mint an OIDC token for AWS
  contents: read    # Required for actions/checkout
```

Without **`id-token: write`**, role assumption fails.

### Repository secrets and variables (no long-lived AWS access keys)

Configure these under **GitHub → Settings → Secrets and variables → Actions**.

| Name | Type | Required | Purpose |
|------|------|----------|---------|
| **`AWS_ROLE_TO_ASSUME`** | Secret | Yes | **ARN** of the IAM role trusted by GitHub’s OIDC identity provider. |
| **`AWS_REGION`** | **Variable** (recommended) or secret | Optional | Region where **ECR** (and **App Runner**, if used) live. Resolved as **`secrets.AWS_REGION`** → **`vars.AWS_REGION`** → default **`ap-southeast-1`**. Set a variable if your resources are in another region. |
| **`ECR_REPOSITORY`** | Secret | Yes | **Repository name only** (not the full registry URL). |
| **`APP_RUNNER_SERVICE_ARN`** | Secret | No | If set, triggers an App Runner deployment after push. |

With OIDC, you **do not** store **`AWS_ACCESS_KEY_ID`** / **`AWS_SECRET_ACCESS_KEY`** in GitHub for this workflow. GitHub exchanges the short-lived OIDC token with AWS STS for **temporary** credentials.

---

## Security

### Secrets and the repository

- **Never commit** `.env`, AWS access keys, session tokens, or private URLs with embedded credentials.
- **`.gitignore`** excludes `.env` / `.env.*`; keep it that way.
- Anything prefixed **`VITE_`** is exposed in the **browser bundle**. Use **`VITE_`** only for non-sensitive configuration.

### IAM OIDC trust (GitHub → AWS)

1. In **IAM**, create an **OIDC identity provider** for **`https://token.actions.githubusercontent.com`** with audience **`sts.amazonaws.com`** (follow current [AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) and [GitHub](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) documentation — URLs and required fields can change).
2. Attach a **trust policy** to **`AWS_ROLE_TO_ASSUME`** that:
   - trusts **`sts.amazonaws.com`** via **`AssumeRoleWithWebIdentity`** for that provider;
   - **`Condition`**-limits **`token.actions.githubusercontent.com:sub`** (and optionally **`aud`**) so **only** your GitHub org/user and repo (and, if you want, **only** `refs/heads/main`) can assume the role.

Example **`sub`** restrictions (replace placeholders):

- Single branch:  
  `"token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"`
- Entire repo (broader):  
  `"token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"`

Tighten **`sub`** to reduce blast radius if branches or forks should not deploy.

### Least-privilege permissions for the deploy role

Avoid attaching **`AdministratorAccess`**. Prefer **narrow** policies:

- **`ecr:GetAuthorizationToken`** — **`Resource`** must be **`*`** (AWS requirement for this action).
- Image push/pull on **one** repository ARN, e.g.  
  **`arn:aws:ecr:REGION:ACCOUNT_ID:repository/REPO_NAME`** with actions such as:  
  **`BatchCheckLayerAvailability`**, **`GetDownloadUrlForLayer`**, **`BatchGetImage`**, **`PutImage`**, **`InitiateLayerUpload`**, **`UploadLayerPart`**, **`CompleteLayerUpload`** (exact set may vary slightly by workflow — align with [ECR documentation](https://docs.aws.amazon.com/AmazonECR/latest/userguide/security_iam_service-with-iam.html)).

For App Runner redeploy:

- **`apprunner:StartDeployment`** on **`APP_RUNNER_SERVICE_ARN`** (or a narrower App Runner resource ARN).

Review CloudTrail **`AssumeRoleWithWebIdentity`** entries using **`role-session-name`** (the workflow sets **`GitHubActions`**) for auditing.

### CI safety notes

- **Fork pull requests** do not receive your repository’s secrets by default; avoid weakening this without understanding supply-chain risk.
- **`workflow_dispatch`** runs with secrets available to the workflow; combine branch protection and restricted **`sub`** claims so unauthorized branches cannot assume production roles.

### Runtime / demo API

- The bundled API is a **mock** with **no authentication**. Do not expose untrusted networks to it without adding auth, rate limiting, and real backends appropriate to your threat model.

---

## Troubleshooting

| Issue | Things to verify |
|-------|------------------|
| OIDC **`AssumeRole`** denied | Trust policy **`sub`** / **`aud`** matches the repo and ref; OIDC provider ARN and issuer URL are correct. |
| **`Could not assume role`** | **`AWS_ROLE_TO_ASSUME`** secret is the **full role ARN**; job has **`id-token: write`**. |
| Wrong AWS region | Set repository variable **`AWS_REGION`** (or secret) to match your **ECR** region; otherwise the workflow defaults to **`ap-southeast-1`**. |
| ECR **`denied`** / **`403`** | Deploy role has **`GetAuthorizationToken`** plus repository-scoped push actions on the **correct** repo ARN and region. |
| App Runner step fails | **`APP_RUNNER_SERVICE_ARN`** is correct; role includes **`apprunner:StartDeployment`** on that service. |
| UI shows offline/mock data | Production image/build must set **`VITE_OFFLINE_FEED=false`** before **`vite build`** (Dockerfile does this). |
| **`npm run build` OOM locally** | Increase Node heap (e.g. `NODE_OPTIONS=--max-old-space-size=8192`) or build inside Docker / CI where memory is higher. |

---

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source the repo.
