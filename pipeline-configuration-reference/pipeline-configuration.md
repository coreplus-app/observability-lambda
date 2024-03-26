### Pipeline configuration guide

1. Ensure that the [aws-cli](https://github.com/aws/aws-cli/tree/v2) is installed in the pipeline runtime environment to enable the surfacing of deployment observability into AWS CloudWatch.
2. Configure the AWS credentials and verify that the IAM role has the necessary permissions to send logs to CloudWatch.
3. Ensure that the action to send logs to log streams is executed as the final step of the deployment process.

In this folder, we provided sample configurations for AWS CodeBuild, GitHub Actions and Bitbucket pipeline.
Please note that each of the pipeline products provide slightly different deployment metadata accessbility. 

This will create a log in in the defined log group and stream.