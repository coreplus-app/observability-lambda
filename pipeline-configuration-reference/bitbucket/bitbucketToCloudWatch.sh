#!/bin/bash
set -e
 
BUILD_STEP_NAME=$1
 
DIR="$(cd "$(dirname "$0")" && pwd)"
# source color vars
. $DIR/console.sh
 
TIMESTAMP=$(($(date +%s%N)/1000000)) && \
aws logs put-log-events \
  --log-group-name $BUILD_LOG_GROUP_NAME \
  --log-stream-name $BUILD_LOG_STREAM_NAME \
  --log-events '[{
    "timestamp": '"$TIMESTAMP"',
    "message": "{\"app\": \"'"$BUILD_APP_NAME"'\", \"time_stamp\": '"$TIMESTAMP"', \"git_commit_hash\": \"'"$BITBUCKET_COMMIT"'\", \"pipeline_id\": \"'"$BITBUCKET_PIPELINE_UUID"'\", \"repo_id\": \"'"$BITBUCKET_REPO_UUID"'\", \"repo_name\": \"'"$BITBUCKET_REPO_FULL_NAME"'\", \"build_step\": \"'"$BUILD_STEP_NAME"'\", \"build_number\": \"'"$BITBUCKET_BUILD_NUMBER"'\", \"build_exit_code\": \"'"$BUILD_EXIT_CODE"'\", \"region\": \"'"$CDK_COREPLUS_REGION"'\", \"env\": \"'"$CDK_COREPLUS_ENV"'\", \"deployments_url\": \"'"$BITBUCKET_GIT_HTTP_ORIGIN"'/deployments\"}"
  }]'