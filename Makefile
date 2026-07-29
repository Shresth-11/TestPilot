.PHONY: dev test docker-up docker-down lint clean

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-sample-api:
	uvicorn examples.sample_api.main:app --reload --port 8001

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest -o pythonpath=. -v

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down -v

lint:
	cd backend && ruff check app/
