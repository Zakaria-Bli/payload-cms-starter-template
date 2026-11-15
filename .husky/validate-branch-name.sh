#!/usr/bin/env sh

# symbolic-ref also works before the first commit; skip the check on a detached HEAD (rebases).
branch_name=$(git symbolic-ref --quiet --short HEAD) || exit 0

pattern="^((feat|fix|style|refactor|chore|test|build|ci|docs|perf)\/[a-z0-9]+(-[a-z0-9]+)*|main|develop|staging)$"

if ! echo "$branch_name" | grep -Eq "$pattern"; then
  echo "❌ Invalid branch name: $branch_name"
  echo "👉 Expected format: type/scope-description, or main, develop, staging"
  echo "👉 Allowed types: feat, fix, style, refactor, chore, test, build, ci, docs, perf"
  echo "👉 Example: feat/seo-setup, fix/auth-contract, style/theme-update, chore/code-quality-setup, docs/readme-refresh, perf/image-cache"
  echo "👉 If you really need another branch name, commit with --no-verify intentionally"
  exit 1
fi
