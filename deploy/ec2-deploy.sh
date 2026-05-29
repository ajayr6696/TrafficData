#!/usr/bin/env sh
set -eu

: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"
: "${ECR_BACKEND_REPOSITORY:?ECR_BACKEND_REPOSITORY is required}"
: "${ECR_FRONTEND_REPOSITORY:?ECR_FRONTEND_REPOSITORY is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

APP_DIR="${APP_DIR:-/opt/traffic-data}"
DATA_DIR="$APP_DIR/data"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost}"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
ENV_FILE="$APP_DIR/.env"
CSV_FILENAME="road_tf_veh_linear_2_0 2 _ cleaned.csv"

mkdir -p "$APP_DIR" "$DATA_DIR"

cat > "$ENV_FILE" <<EOF
AWS_REGION=$AWS_REGION
ECR_REGISTRY=$ECR_REGISTRY
ECR_BACKEND_REPOSITORY=$ECR_BACKEND_REPOSITORY
ECR_FRONTEND_REPOSITORY=$ECR_FRONTEND_REPOSITORY
IMAGE_TAG=$IMAGE_TAG
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/traffic_data
NODE_ENV=production
PORT=4000
FRONTEND_ORIGIN=$FRONTEND_ORIGIN
CSV_PATH=/app/data/${CSV_FILENAME}
EOF

cat > "$COMPOSE_FILE" <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: traffic-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: traffic_data
    volumes:
      - traffic-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d traffic_data"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    image: ${ECR_REGISTRY}/${ECR_BACKEND_REPOSITORY}:${IMAGE_TAG}
    container_name: traffic-backend
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data/road_tf_veh_linear_2_0 2 _ cleaned.csv:/app/data/road_tf_veh_linear_2_0 2 _ cleaned.csv:ro
    expose:
      - "4000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: ${ECR_REGISTRY}/${ECR_FRONTEND_REPOSITORY}:${IMAGE_TAG}
    container_name: traffic-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  traffic-postgres-data:
EOF

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
docker image prune -f
