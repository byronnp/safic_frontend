# SAFIC · Frontend. Ejecutar desde WSL. El backend debe estar levantado (red "safic").
DC = docker compose
RUN = $(DC) exec web

.PHONY: up down logs install shell test lint fix typecheck build check

up: ## Levanta el servidor de desarrollo en http://localhost:9000
	$(DC) up -d --build
	@echo "Frontend: http://localhost:9000 (la primera vez tarda mientras instala dependencias: make logs)"

down:
	$(DC) down

logs:
	$(DC) logs -f web

install: ## Reinstala dependencias (tras cambiar package-lock.json)
	$(RUN) npm ci

shell:
	$(RUN) sh

test:
	$(RUN) npm test

lint:
	$(RUN) npm run lint:check

fix:
	$(RUN) npm run lint

typecheck:
	$(RUN) npm run typecheck

build:
	$(RUN) npm run build

check: lint typecheck test ## Lo mismo que corre CI
