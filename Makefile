# ------------------------------
# Root Makefile for "humansonly"
# ------------------------------

SHELL := bash

REPO_ROOT := $(shell git -C $(CURDIR) rev-parse --show-toplevel 2>/dev/null || pwd)
ifndef INCLUDED_TOOLKIT_BOOTSTRAP
  include $(REPO_ROOT)/devops-toolkit/bootstrap.mk
endif

ENV ?= dev
COMPOSE_PROJECT_NAME := humansonly
COMPOSE_NETWORK_NAME ?= humansonly_network

COMPOSE_FILE := humansonly.compose.yaml:$(DEVOPS_TOOLKIT_PATH)/backend/docker/db.compose.yaml:override.compose.yaml

APP_NAME := humansonly
BACKEND_GATEWAY_PATH := .

export COMPOSE_DB_NAME := humansonly_pg_db
export MIGRATIONS_PATH := $(REPO_ROOT)/migrations

BWS_ENV := $(if $(filter $(ENV),dev-test),dev,$(ENV))
export BWS_PROJECT_NAME_FOR_DB_SECRETS := $(APP_NAME)-$(BWS_ENV)

ifndef INCLUDED_ENV_CONFIGURATION
  include $(DEVOPS_TOOLKIT_PATH)/shared/make/utils/env_configuration.mk
endif

export HEALTHCHECK_PATH := /api/health

# This app has no separate backend dependency service.
WITH_DEPS ?= 0
DEPS :=

ENABLE_NGROK_FOR_DEV ?= 1
export ENABLE_NGROK_FOR_DEV

ENABLE_CLOUDFLARED_FOR_DEV ?= 0
export ENABLE_CLOUDFLARED_FOR_DEV
CLOUDFLARED_HOSTNAME ?= $(subst _,-,$(UNIQUE_RUNNER_ID)).humansonly.io
export CLOUDFLARED_HOSTNAME
CLOUDFLARED_TUNNEL_NAME ?= $(APP_NAME)-$(subst _,-,$(UNIQUE_RUNNER_ID))
export CLOUDFLARED_TUNNEL_NAME
CLOUDFLARE_BWS_PROJECT ?= $(APP_NAME)-$(BWS_ENV)
export CLOUDFLARE_BWS_PROJECT

ifndef INCLUDED_COMPOSE_PROJECT_CONFIGURATION
  include $(DEVOPS_TOOLKIT_PATH)/backend/make/compose/compose-project-configurations/compose_project_configuration.mk
endif

DEPS_PASSTHROUGH_VARS += DOCKER_BUILD_CACHE_FROM DOCKER_BUILD_CACHE_TO

export APP_NAME
override APP_PORT := 8080

PROD_DEPLOY_TARGET := vercel
STAGING_DEPLOY_TARGET := vercel
VERCEL_PROJECT_NAME := humansonly
VERCEL_STAGING_DOMAIN ?= staging.humansonly.io
export VERCEL_STAGING_DOMAIN
VERCEL_DOMAIN ?= humansonly.io
export VERCEL_DOMAIN
VERCEL_HOLD_PROMOTION ?= 0

export NEXT_PUBLIC_ENV := $(ENV)
NEXT_PUBLIC_DEVTOOLS_ENABLED := 0
ifneq (,$(filter $(ENV),$(DEV_TEST_ENV)))
  NEXT_PUBLIC_DEVTOOLS_ENABLED := 1
endif

export NEXT_PUBLIC_DEVTOOLS_ENABLED

FRONTEND_RELEASE_MODE ?= 0

FRONTEND_NODE_ENV := development
FRONTEND_CHOKIDAR_USEPOLLING := 1
FRONTEND_WATCHPACK_POLLING := 1

ifeq ($(FRONTEND_RELEASE_MODE),1)
  NEXT_PUBLIC_DEVTOOLS_ENABLED := 0
  FRONTEND_NODE_ENV := production
  FRONTEND_CHOKIDAR_USEPOLLING := 0
  FRONTEND_WATCHPACK_POLLING := 0
endif

export FRONTEND_RELEASE_MODE
export FRONTEND_NODE_ENV
export FRONTEND_CHOKIDAR_USEPOLLING
export FRONTEND_WATCHPACK_POLLING

ifndef INCLUDED_COMPOSE_APP_CONFIGURATION
  include $(DEVOPS_TOOLKIT_PATH)/backend/make/compose/compose-project-configurations/compose-file-configurations/app/compose_app_configuration.mk
endif

ifndef INCLUDED_NEXTJS_APP_CONFIGURATION
  include $(DEVOPS_TOOLKIT_PATH)/frontend/make/utils/nextjs_app_configuration.mk
endif

ifndef INCLUDED_NEXTJS_APP_TARGETS
  include $(DEVOPS_TOOLKIT_PATH)/frontend/make/utils/nextjs_app_targets.mk
endif

ifndef INCLUDED_ENV_LOCAL_UTILS
  include $(DEVOPS_TOOLKIT_PATH)/shared/make/utils/env_local.mk
endif

ifneq (,$(filter $(ENV),$(DEV_ENV) $(DEV_TEST_ENV)))
up:: env-local
endif

ifndef INCLUDED_COMPOSE_APP_TARGETS
  include $(DEVOPS_TOOLKIT_PATH)/backend/make/compose/compose-project-configurations/compose-file-configurations/app/compose_app_targets.mk
endif
