# Release pipeline for robinchm.com/domino-fox — the deploy surface.
#
# The extension repo (../domino-fox) builds and signs; THIS repo is the web
# side: the site (site/), the download directory (jsons tracked, .xpi
# artifacts UNTRACKED — they live on the server only), and the sync to the
# cloud server.
#
# Variables (put in .env, gitignored):
#   DEPLOY_HOST   cloud server host (ssh alias or user@host)
#   DEPLOY_PATH   web root for /domino-fox on the server
#                 (default: /var/www/domino-fox)
#
# Typical release flow (run in the EXTENSION repo):
#   make build sign release        # GitHub release (gh) — unchanged
#   make upload-release            # copies xpi + jsons HERE, then syncs (below)
# In THIS repo:
#   make site                      # rebuild site/ + download/ pages
#   make deploy                    # rsync site + download (+ updates.json) to the server

SHELL := /bin/bash

-include .env
export

DEPLOY_HOST := $(DEPLOY_HOST)
DEPLOY_PATH ?= /root/domino-fox

VERSION := $(shell grep -m1 '"version"' ../domino-fox/package.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
XPI := ../domino-fox/dist/domino-fox-$(VERSION).xpi

.PHONY: site deploy env

env:
	@test -n "$$DEPLOY_HOST" || { echo "ERROR: DEPLOY_HOST not set — put it in .env"; exit 1; }
	@echo "host: $(DEPLOY_HOST)  path: $(DEPLOY_PATH)  version: $(VERSION)"

## Rebuild the site + downloads pages from content.md + releases.json.
site:
	node site/build.mjs

## Sync everything to the cloud server: the site, the download jsons +
## artifacts, and the update feed at the root. Idempotent; trailing slashes
## matter to rsync (directory CONTENTS, not the dirs themselves).
deploy: env site
	rsync -avz site/index.html site/style.css site/assets $(DEPLOY_HOST):$(DEPLOY_PATH)/
	rsync -avz download/ $(DEPLOY_HOST):$(DEPLOY_PATH)/download/
	rsync -avz updates.json $(DEPLOY_HOST):$(DEPLOY_PATH)/updates.json
	@echo "deployed → https://robinchm.com/domino-fox/"

## Called by the extension repo's upload-release: land the artifacts here.
## The .xpi is UNTRACKED (server-only); the jsons are tracked (git history =
## the changelog). updates.json is regenerated from releases.json by the
## extension repo's `make site-artifacts`.
ingest:
	@test -f "$(XPI)" || { echo "ERROR: $(XPI) not found — run make sign in the extension repo"; exit 1; }
	cp -f "$(XPI)" download/domino-fox-$(VERSION).xpi
	cp -f ../domino-fox/download/releases.json download/releases.json
	cp -f ../domino-fox/download/updates.json updates.json
	@echo "ingested $(VERSION): xpi (untracked) + releases.json + updates.json"
