import { APIGatewayProxyResult, CloudWatchLogsEvent, CloudWatchLogsDecodedData, CloudWatchLogsLogEvent } from 'aws-lambda';
import { lambdaHandler } from '../../app';
import { expect, describe, it } from '@jest/globals';
import { Guid } from 'guid-typescript';

const zlib = require('zlib'); 

const deployments_url = "http://bitbucket.org/<workspace>/<repo>/deployments"; // Repo deployment url
const owner = "1234567890"; // AWS Console Id
const logGroup = "pipeline-deployment-logs"; // CloudWatch LogGroup name
const logStream = "deployments"; // CloudWatch LogSteam name
const subscriptionFilters = "pipeline-log-trigger"; 
const widgetsToGenerate = 10; // Number of test widgets to generate

describe('CloudWatch Observability dashboards and widget tests', function () {
    
    it('Test widget with expected error (incomplete payload)', async () => {

        let r_build_number = randomInteger(0,100);
        let r_id = randomInteger(1111111111,9999999999);
        let logEvents: CloudWatchLogsLogEvent[] = [];
        let logEvent: CloudWatchLogsLogEvent;

        logEvent = {
            id: `${r_id}`,
            timestamp: 0,
            message: JSON.stringify({
                        app: `app-unit-test`,
                        time_stamp: Date.now(),
                        git_commit_hash: Guid.create().toString(),
                        pipeline_id: `{${Guid.create().toString()}}`,
                        repo_id: `{${Guid.create().toString()}}`,
                        build_step: "build_unit_test",
                        build_number: `${r_build_number}`,
                        build_exit_code: 1,
                    })
        }
        
        logEvents.push(logEvent);

        const cloudWatchLogData: CloudWatchLogsDecodedData = {
            messageType: "DATA_MESSAGE",
            owner: owner,
            logGroup: logGroup,
            logStream: logStream,
            subscriptionFilters: [
                subscriptionFilters
            ],
            logEvents: logEvents
        }

        // Gzip and base64 encode, to emulate a cloudwatch event
        var compressedString = zlib.gzipSync(Buffer.from(JSON.stringify(cloudWatchLogData))).toString("base64");

        const event: CloudWatchLogsEvent = {
            awslogs: {
                data: compressedString 
            }
        };
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toContain("0 logs processed succesfully, 1 processed unsuccessfully");
    }, 30000);

    it('Test 1 widget', async () => {

        let r_build_number = randomInteger(0,100);
        let r_id = randomInteger(1111111111,9999999999);
        let logEvents: CloudWatchLogsLogEvent[] = [];
        let logEvent: CloudWatchLogsLogEvent;

        logEvent = {
            id: `${r_id}`,
            timestamp: 0,
            message: JSON.stringify({
                        app: `app-unit-test`,
                        time_stamp: Date.now(),
                        git_commit_hash: Guid.create().toString(),
                        pipeline_id: `{${Guid.create().toString()}}`,
                        repo_id: `{${Guid.create().toString()}}`,
                        build_step: "build_unit_test",
                        build_number: `${r_build_number}`,
                        build_exit_code: 1,
                        region: "au",
                        env: "qa",
                        dependsOn: ["infra:base-infrastructure"], 
                        deployments_url: deployments_url
                    })
        }

        logEvents.push(logEvent);

        const cloudWatchLogData: CloudWatchLogsDecodedData = {
            messageType: "DATA_MESSAGE",
            owner: owner,
            logGroup: logGroup,
            logStream: logStream,
            subscriptionFilters: [
                subscriptionFilters
            ],
            logEvents: logEvents
        }

        // Gzip and base64 encode, to emulate a cloudwatch event
        var compressedString = zlib.gzipSync(Buffer.from(JSON.stringify(cloudWatchLogData))).toString("base64");

        const event: CloudWatchLogsEvent = {
            awslogs: {
                data: compressedString 
            }
        };
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toContain("logs processed succesfully");
    }, 30000);


    it('Test multiple widgets', async () => {

        let logEvents: CloudWatchLogsLogEvent[] = [];
        let logEvent: CloudWatchLogsLogEvent;

        for(let i = 0; i<=widgetsToGenerate; i++) {
            let r_bec = randomInteger(0,1);
            let r_build_number = randomInteger(1,100);
            let r_id = randomInteger(1111111111,9999999999);
            logEvent = {
                id: `${r_id}`,
                timestamp: 0,
                message: JSON.stringify({
                            app: `app-unit-test-${i}`,
                            time_stamp: Date.now(),
                            git_commit_hash: Guid.create().toString(),
                            pipeline_id: `{${Guid.create().toString()}}`,
                            repo_id: `{${Guid.create().toString()}}`,
                            build_step: "build_unit_test",
                            build_number: `${r_build_number}`,
                            build_exit_code: r_bec,
                            region: "au",
                            env: "qa",
                            deployments_url: deployments_url
                        })
            }
            logEvents.push(logEvent);
        }   

        const cloudWatchLogData: CloudWatchLogsDecodedData = {
            messageType: "DATA_MESSAGE",
            owner: owner,
            logGroup: logGroup,
            logStream: logStream,
            subscriptionFilters: [
                subscriptionFilters
            ],
            logEvents: logEvents
        }

        // Gzip and base64 encode, to emulate a cloudwatch event
        var compressedString = zlib.gzipSync(Buffer.from(JSON.stringify(cloudWatchLogData))).toString("base64");

        const event: CloudWatchLogsEvent = {
            awslogs: {
                data: compressedString 
            }
        };
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toContain("logs processed succesfully");
    }, 30000);
})

function randomInteger(min:number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}