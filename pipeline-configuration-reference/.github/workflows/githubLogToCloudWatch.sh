#!/bin/bash
set -e
 
BUILD_STEP_NAME=$1
DEPLOYMENT_START=$2
BUILD_RESULT=$3

GIT_SOURCE="GitHub"
DEPLOYMENT_TIME=$(($(date -u +%s) - $DEPLOYMENT_START))


if [ "$BUILD_RESULT" == "success" ]; then
  echo $BUILD_RESULT
  BUILD_EXIT_CODE=0
else
  BUILD_EXIT_CODE=1
fi

TIMESTAMP=$(($(date +%s%N)/1000000)) && \
aws logs put-log-events \
  --log-group-name $BUILD_LOG_GROUP_NAME \
  --log-stream-name $BUILD_LOG_STREAM_NAME \
  --log-events '[{
    "timestamp": '"$TIMESTAMP"',
    "message": "{\"app\": \"'"$APP_NAME"'\", \"time_stamp\": '"$TIMESTAMP"', \"git_commit_hash\": \"'"$GIT_COMMIT_HASH"'\", \"pipeline_id\": \"'"$PIPELINE_ID"'\", \"repo_id\": \"'"$REPO_ID"'\", \"repo_name\": \"'"$REPO_NAME"'\", \"build_step\": \"'"$BUILD_STEP_NAME"'\", \"build_number\": \"'"$BUILD_NUMBER"'\", \"build_exit_code\": \"'"$BUILD_EXIT_CODE"'\", \"region\": \"'"$CDK_REGION"'\", \"env\": \"'"$CDK_ENV"'\", \"git_source\": \"'"$GIT_SOURCE"'\", \"deployment_time\": \"'"$DEPLOYMENT_TIME"'\",\"deployments_url\": \"'"$GIT_URL"'/deployments\",\"git_source\": \"'"$GIT_SOURCE"'"}"
  }]'
 