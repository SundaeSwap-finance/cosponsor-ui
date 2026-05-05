#!/bin/bash

set -eu

# Diagnostic: log container memory limits to confirm whether vite OOMs
# are bounded by cgroup or by the JS engine's heap limit.
echo "=== container memory ==="
cat /sys/fs/cgroup/memory.max 2>/dev/null \
  || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null \
  || echo "(no cgroup memory file found)"
grep -E '^MemTotal|^MemAvailable' /proc/meminfo 2>/dev/null || true
echo "========================"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(basename "${CODEBUILD_SRC_DIR:=${ROOT}}")"
VERSION="${CODEBUILD_BUILD_NUMBER:=0}.$(echo "${CODEBUILD_RESOLVED_SOURCE_VERSION:=$(date +%Y%m%d%H%M%S)}" | cut -c1-7)"
TARGET="${ROOT}/target"
S3_BUCKET="${S3_BUCKET:=codebuild-artifacts-us-east-2-113073460856}"
S3_PREFIX="${S3_PREFIX:=cosponsor-ui}"
COMMIT_HASH="${CODEBUILD_RESOLVED_SOURCE_VERSION}"
if [ -z "${COMMIT_HASH}" ]; then
  COMMIT_HASH="$(git rev-parse HEAD)"
fi

(cd "${ROOT}" && bun install --frozen-lockfile && COMMIT_HASH="$COMMIT_HASH" VERSION="$VERSION" bun run build)

TGZ="${ROOT}/cosponsor-ui-${VERSION}.tar.gz"
DIST="${ROOT}/dist"
(cd "$DIST" && tar -czf "${TGZ}" *)

aws s3 cp "${TGZ}" "s3://${S3_BUCKET}/${S3_PREFIX}/${VERSION}/cosponsor-ui.tar.gz"

mkdir -p "${TARGET}"
sed "s/latest/${VERSION}/g" "${ROOT}/resources.template" > "${TARGET}/resources.template"
