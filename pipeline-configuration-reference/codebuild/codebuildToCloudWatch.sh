#!/bin/bash
set -e

GIT_SOURCE="CodeBuild"
TIMESTAMP=$(($(date +%s%N)/1000000))
DEPLOYMENT_TIME=$((($TIMESTAMP - $CODEBUILD_START_TIME)/1000))

if [ "$CODEBUILD_BUILD_SUCCEEDING" == "1" ]; then
  BUILD_EXIT_CODE=0 # 0 is success in product definition
else
  BUILD_EXIT_CODE=1
fi

aws logs put-log-events \
  --log-group-name $BUILD_LOG_GROUP_NAME \
  --log-stream-name $BUILD_LOG_STREAM_NAME \
  --log-events '[{
    "timestamp": '"$TIMESTAMP"',
    "message": "{\"app\": \"'"$APP_NAME"'\", \"time_stamp\": '"$TIMESTAMP"', \"git_commit_hash\": \"'"$CODEBUILD_RESOLVED_SOURCE_VERSION"'\", \"pipeline_id\": \"'"$CODEBUILD_BUILD_ID"'\", \"repo_id\": \"'"$CODEBUILD_BUILD_ARN"'\", \"repo_name\": \"'"$APP_NAME"'\", \"build_step\": \"'post-build'\", \"build_number\": \"'"$CODEBUILD_BUILD_NUMBER"'\", \"build_exit_code\": \"'"$BUILD_EXIT_CODE"'\", \"region\": \"'"$AWS_REGION"'\", \"env\": \"'"$ENV"'\", \"git_source\": \"'"$GIT_SOURCE"'\", \"deployment_time\": \"'"$DEPLOYMENT_TIME"'\",\"deployments_url\": \"'"$CODEBUILD_SOURCE_REPO_URL"'\"}"
  }]'
 