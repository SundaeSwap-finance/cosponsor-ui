#!/bin/sh

set -eu

echo "Interpolating index.html with APP_CONFIG for environment ${ENV}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_FILE=${1:-"${ROOT}/dist/index.html"}
ARCHIVE_INDEX_FILE=${2:-"${ROOT}/dist/${VERSION}.html"}
CONFIG_FILE_CONTENTS=$(cat "${ROOT}/config/${ENV}.json" | jq -c '.')
COMMIT_HASH="${COMMIT_ID}"
if [ -z "${COMMIT_HASH}" ]; then
  COMMIT_HASH="$(git rev-parse HEAD)"
fi

# Substitute @@APP_CONFIG@@ with the contents of our config file
INDEX_CONTENTS=$(awk -v pattern="@@APP_CONFIG@@" -v replacement="${CONFIG_FILE_CONTENTS}" "{gsub(pattern, replacement); print}" "${INDEX_FILE}")

# Write this out; we do this in two separate steps so the awk doesn't overwrite the file while reading it
echo "${INDEX_CONTENTS}" > $INDEX_FILE
echo "${INDEX_CONTENTS}" > $ARCHIVE_INDEX_FILE

# Echo out a latest.json file, for version notifs
echo '{"commitHash":"'"${COMMIT_HASH}"'","buildId":"'${VERSION}'","buildDate":'$(date +%s)'}' > "${ROOT}"/dist/latest.json
