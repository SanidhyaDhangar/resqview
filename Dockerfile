# ─── Stage 1: build the Common Operating Picture ──────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /build

# Copy manifests first so the dependency layer caches independently of source edits.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ─── Stage 2: the API, which also serves the built frontend ───────────────────
FROM python:3.11-slim AS runtime

# Fail fast and log straight through — a container that buffers its logs is a container
# you cannot debug during an incident.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

# app.main mounts ../../frontend/dist when it exists, so the built UI lands there.
COPY --from=frontend /build/dist ./frontend/dist

# Run unprivileged: this thing is meant to sit on someone else's infrastructure.
RUN useradd --create-home --uid 1001 resqview && chown -R resqview:resqview /app
USER resqview

WORKDIR /app/backend
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+__import__('os').environ.get('PORT','8000')+'/api/health').status==200 else 1)"

# Shell form so $PORT from the hosting platform is honoured, with a sane local default.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
