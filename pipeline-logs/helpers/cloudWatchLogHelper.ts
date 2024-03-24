import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogGroupCommandInput, DescribeLogGroupsCommand, DescribeLogStreamsCommand, DescribeLogGroupsCommandInput, DescribeLogStreamsCommandInput, CreateLogStreamCommandInput, CreateLogStreamCommand, PutLogEventsCommandInput, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { z } from 'zod';
import { pipelineMessage } from '../types';
import { createMetricsLogger, Configuration } from "aws-embedded-metrics";

type LogEvent = z.infer<typeof pipelineMessage>;

export const LogEvent = async (logName: string, streamName: string, logEvent: LogEvent, cloudWatchLogsClient: CloudWatchLogsClient): Promise<boolean> => {

    let putLogEventsCommandInput: PutLogEventsCommandInput = {
        logStreamName: streamName,
        logGroupName: logName,
        logEvents: [
            {
                timestamp: Date.now(),
                message: JSON.stringify(logEvent),
            }
        ]} 

    const logEventCommand = new PutLogEventsCommand(putLogEventsCommandInput);
    
    try {

        console.log("Writing log entry to " + logName);

        const putLogEventCommandResponse = await cloudWatchLogsClient.send(logEventCommand);
        if(putLogEventCommandResponse.$metadata?.httpStatusCode === 200) {
            console.log(`Success writing to log ${streamName}, stream ${logName}`);
            return Promise.resolve(true);
        }
        else {
            console.log(`Error writing to log ${streamName}, stream ${logName}`);
            return Promise.reject(false);
        }

    }
    catch(err) {
        console.log("Error: " + (err as Error).name);
        return Promise.reject(false);
    }

}

export const CreateLogStream = async (streamName: string, logName: string, cloudWatchLogsClient: CloudWatchLogsClient): Promise<boolean> => {

    let describeLogStreamCommandInput: DescribeLogStreamsCommandInput = {
        logGroupName: logName,
        logStreamNamePrefix: streamName,
        limit: 1
    }

    const describeLogStreamCommand = new DescribeLogStreamsCommand(describeLogStreamCommandInput);

    try {

        const describeLogSteamCommandResponse = await cloudWatchLogsClient.send(describeLogStreamCommand);

        if(describeLogSteamCommandResponse.logStreams?.length==0) {

            console.log("Log stream " + streamName + " doesn't exist. Creating log stream.");

            const createLogStreamCommandInput: CreateLogStreamCommandInput = {
                logGroupName: logName,
                logStreamName: streamName
            };

            const createLogStreamCommand = new CreateLogStreamCommand(createLogStreamCommandInput);
            const createLogStreamCommandResponse = await cloudWatchLogsClient.send(createLogStreamCommand);
            
            if(createLogStreamCommandResponse.$metadata?.httpStatusCode === 200) {
                console.log("Log stream " + streamName + " in log group " + logName + " created successfully.");
                return Promise.resolve(true);
            }
            else {
                console.log("Error creating log stream " + streamName + " in log group " + logName + ". HttpResponse: " + createLogStreamCommandResponse.$metadata?.httpStatusCode);
                return Promise.reject(false);
            }

        }
        else {
            console.log("Log stream " + streamName + " in log group " + logName + " already exists.");
            return Promise.resolve(true);
        }
        
    }
    catch(err) {
        console.log("Error: " + (err as Error).name);
        return Promise.reject(false);
    }

}

export const CreateLogGroups = async (logName: string, cloudWatchLogsClient: CloudWatchLogsClient): Promise<boolean> => {

    let describeLogGroupsCommandInput: DescribeLogGroupsCommandInput = {
        logGroupNamePrefix: logName,
        limit: 50
    }

    const describeLogGroupCommand = new DescribeLogGroupsCommand(describeLogGroupsCommandInput);

    try {
        
        const describeLogGroupCommandResponse = await cloudWatchLogsClient.send(describeLogGroupCommand);

        let logGroupExists = false;
        //let records = describeLogGroupCommandResponse?.logGroups?.length ?? 0;

        for(let logGroup of describeLogGroupCommandResponse?.logGroups ?? "") {
            
            if(logGroup === "") {
                logGroupExists = false;
                break;
            }

            if(logGroup === logName) {
                logGroupExists = true;
                break;
            }
        };


        if(!logGroupExists) {
            
            console.log("Log group " + logName + " doesn't exist. Creating log group.");
            
            const createLogGroupCommandInput: CreateLogGroupCommandInput= {
                logGroupName: logName
            }

            const createLogGroupCommand = new CreateLogGroupCommand(createLogGroupCommandInput);
            const createLogGroupCommandResponse = await cloudWatchLogsClient.send(createLogGroupCommand);
            
            if(createLogGroupCommandResponse.$metadata?.httpStatusCode === 200) {
                console.log("Log group " + logName + " created successfully.");
                return Promise.resolve(true);
            }
            else {
                console.log("Error creating log group " + logName + ". HttpResponse: " + createLogGroupCommandResponse.$metadata?.httpStatusCode);
                return Promise.reject(false);
            }

        }
        else {
            console.log("Log group " + logName + " already exists.");
            return Promise.resolve(true);
        }

    }
    catch(err) {
        console.log("Error: " + (err as Error).name);
        if((err as Error).name === "ResourceAlreadyExistsException") {
            return Promise.resolve(true);
        }
        return Promise.reject(false);
    }  
};

export const SendEmbeddedMetricsFormat = async (logGroupName: string, streamName: string, logEvent: LogEvent, dashboardName: string): Promise<void> => {
    
    try  {
        Configuration.logGroupName = logGroupName;
        Configuration.logStreamName = streamName;
        Configuration.serviceName = dashboardName

        const metrics = createMetricsLogger();
        
        metrics.putDimensions(
            {
                Service: dashboardName,
                ApplicationName: logEvent.app,
                AppEnv: logEvent.env
            }
        )
        
        metrics.setProperty('Region', logEvent.region)
        metrics.setProperty('RepoId', logEvent.repo_id)
        metrics.setProperty('buildNumber', logEvent.build_number)
        metrics.setProperty('buildStep', logEvent.build_step)
        metrics.setProperty("dependency", logEvent.dependsOn)
        metrics.putMetric('build_exit_code', logEvent.build_exit_code)

        const rest = await metrics.flush();
        
        console.log('Successfully uploaded to logGroupName' + logGroupName + ', stream:' + streamName + ', for embedded metrics format, and result is' + rest)
    }
    catch(err) {
        console.log("Error: " + (err as Error).name);
    }
    
    return
}