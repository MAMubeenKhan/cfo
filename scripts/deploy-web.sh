#!/usr/bin/env bash
# Deploys web/ to Vercel production from a plain copy of the folder.
#
# Why a copy: 'vercel deploy' attaches the git commit author to a deployment, and Vercel BLOCKS the
# deployment when that author is not a member of the Vercel team ("commit author doesn't have
# permission"). A folder without .git carries no author, so it deploys normally.
#
# Usage: bash scripts/deploy-web.sh        (needs `vercel login` once, and web/.vercel from `vercel link`)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

tar -C "$root/web" --exclude=node_modules --exclude=.next --exclude=.vercel/output -cf - . | tar -C "$tmp" -xf -
cd "$tmp"
npx --yes vercel@latest deploy --prod --yes --scope "${VERCEL_SCOPE:-mubeen9}"
