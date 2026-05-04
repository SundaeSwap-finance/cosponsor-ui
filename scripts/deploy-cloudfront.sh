#!/bin/bash

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

STACK_INSTANCE=$(aws cloudformation list-stack-instances --stack-set-name ${ENV}-cosponsor-ui | jq -r '.Summaries[0].StackId')
echo "Stack Instance: $STACK_INSTANCE"

if [ -n "${SECRET_ID:=}" ] ; then
  SECRETS=$(aws secretsmanager get-secret-value --secret-id "${SECRET_ID}" | jq -r .SecretString)
  echo "Loading credentials from secret, ${SECRET_ID}"
  AWS_ACCESS_KEY_ID=$(echo "${SECRETS}"     | jq -r .AWS_ACCESS_KEY_ID)
  AWS_SECRET_ACCESS_KEY=$(echo "${SECRETS}" | jq -r .AWS_SECRET_ACCESS_KEY)
  AWS_REGION=$(echo "${SECRETS}"            | jq -r .AWS_REGION)
  export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION
fi

ACCOUNT=$(aws sts get-caller-identity | jq -r .Account)

echo "Deploying UI..."

# Interpolate index.html with the environment config;
# We do this here, rather than with vite, so that we can deploy the same artifact
# to multiple environments
${ROOT}/scripts/interpolate-index.sh "${ROOT}/dist/index.html"

# sync bucket with build
S3_BUCKET="${ENV}-cosponsor-ui-${ACCOUNT}-us-east-2"
DIST="${ROOT}/dist"
# We use aws s3 cp here, rather than aws sync, because aws sync only compares file sizes and timestamps
# which isn't very robust
(cd "${DIST}" && aws s3 cp --recursive . "s3://${S3_BUCKET}/")

# Enumerate and invalidate any cloudfront distributions for any clients
echo "Invalidating cloudfront distributions..."
DISTRIBUTIONS=$(aws cloudformation list-stack-resources --stack-name ${STACK_INSTANCE} | jq -r '.StackResourceSummaries[] | select(.ResourceType == "AWS::CloudFront::Distribution") | .PhysicalResourceId')
for distribution in $DISTRIBUTIONS; do
  echo "Invalidating distribution ${distribution}..."
  aws cloudfront create-invalidation --distribution-id "${distribution}" --paths "/" "/*"
done
