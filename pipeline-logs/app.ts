import { APIGatewayProxyResult, CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { widgetMarkdownSchema, pipelineMessage, widgetSchema, propertiesSchema } from './types';
import { GetDashboardWidgets, PutDashboard } from './helpers/cloudWatchHelper';
import { CreateLogGroups, CreateLogStream, LogEvent, SendEmbeddedMetricsFormat } from './helpers/cloudWatchLogHelper';
import { ReplaceInvalidCharacters, GenerateWidgetMarkdown } from './helpers/generalHelper';
import { z } from 'zod';

const zlib = require('zlib'); 

export const lambdaHandler = async (event: CloudWatchLogsEvent): Promise<APIGatewayProxyResult> => {

    let result: APIGatewayProxyResult  = { 
        statusCode: 500,
        body: ""
     }

    if(event?.awslogs?.data == null) {
        result.statusCode = 400,
        result.body = JSON.stringify({message: `Invalid data received: ${JSON.stringify(event)}`});
        return result;
    }

    // Parse payload
    let payload;
    try {
        console.log("Received data: " + event.awslogs.data);
        
        let cloudWatchLogsEvent = z.custom<CloudWatchLogsEvent>().parse(event);
        payload =  zlib.gunzipSync(Buffer.from(cloudWatchLogsEvent.awslogs.data, 'base64')).toString('utf8')

        let cloudWatchLog = z.custom<CloudWatchLogsDecodedData>().parse(JSON.parse(payload));
        if(cloudWatchLog.logEvents.length === 0 ) {
            console.log("No log event to process. Skipping record");
        }

        // AWS clients
        const cloudWatchClient = new CloudWatchClient({ region: "us-east-1" });
        const cloudWatchLogClient = new CloudWatchLogsClient({ region: "us-east-1" });
        
        let logsProcessed = 0;
        let logsUnprocessed = 0;
        let widgetBody: z.infer<typeof widgetMarkdownSchema> = { widgets: [] };
        let successDashboardArray: string[] = [];
        let successLogGroupArray: string[] = [];
        let successLogStreamArray: string[] = [];
        let dashboardName: string = "";
        
        const widgetWidth = 6;
        const widgetHeight = 4;
        const widgetBackgroundWidth = 23; // Max cloudwatch dashboard width
        const orangeTick = "![alt text Base 64 inline image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAACi0lEQVRIiY2VP2gUQRjFf285QrBKEY6rQqqgcrVwVSDkj4UINhLMtZaSaJMitaiNIFbBNhvSGqIo0daAhZWECCFYpbgqpJAQQp7F7tzN7c2dbrMPvm/fvPfNmx0x4nFOA5g3LAiaNnUJgA5wCOwDX7TC6TAOJUgB6oZ1wSOgURRS3d3FtoEXQEcr/cUs8cE85gB4FsgdS3H0LnAds2Y4ABZHOnBO2+YdYjwUHTW6JBZgJbC4AB5rha2+BbwFiEXMeyjI+xQX+AnmZ0nWlHhbqQd8ATzAfFIbahQKGoJNw7hi2dFCNj+yNt9Kp5ddZ4pcFnhcsIloAadZybFhmO6SqTcOuxQWDTPUQr2KbaaADYDsOmcKWJZ7ThWEqyBOhUdRLYVtHjpnKpNZxExWWew0jm04zD+BJSYxd2uIJZxIS2iO9qHCP1JIuchSDWgiUJSGLt+Q8YQRdVcagg3NDKj3s45WFlsYNaIS1zNcnGa7YrvaHKunP8nDsESWITrBsnqF/07RKAx0asARMIOL/CvIGJzrhHPqwLXNRDhg/9iKwxqwb7gfq+smyn34Q9+JjWKXwi6C87UGfJI5Q0zE9sMHkapLxPfS4R2JsYH+CBvOEB8z4BixG5+F1K5JvJSZBWYNz4e0xXgXc1wIypku/+cN0UtOd0RFbG5lbY7K/hnMr/CPck9EwB2JllY4CRfOb8yq4DI0VlMkMeeczDkZMIfSyZG4EqwCJ0Fbz1rOGvAKM5aIxB9gD7imCMWNgeSYK8Q68Dpcnak7eRl4Y6jHI+pLVGIsEh2bpxLb8b2cupN3gBawYzgfGFdlLDbniG2gRYU86SByAuYm4h6wANyGIsqGc5lDxGebPcGR2mmev+a8KHB8iBnFAAAAAElFTkSuQmCC)";
        const greenTick = "![alt text Base 64 inline image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAAXNSR0IArs4c6QAAAcBJREFUSEu9lT1PFFEUhp9zd3a38R/YG4kxIVqawBAre2EoLI2FsaFHC1oKY20IFkbZNZRQYLEDFP6BTSTxHxhjZcPszH0NIyv7xe4yzHK7uZlznvOeez6MGzh2Awz6IGFrNcL0GrgLVAoEkCFOvNPG0WKz2bX/D8kBaKcfWwCTm0jeWO2CLiBx1AbuFXU7wq4dh437Z/e9kLRgikbHJbJ4qREMQlSiitxVHDZyEb1KrgWR4U243kBLhQg+OLNjSVszgQiO6tVkOenUYmBuFpAfyC+A+4jxePBNr50uGb/Np4/MBWsSL0YVzUSIzH4inpr0GeN2rxMZiVL/xLnKA0ybl1XlREjet+htJUvfZUH1wMSdf80MOP88y9yvimN3XG9NBTkHbaeBW6+mfg9s3mBT8p8wdwzcGtdbU0NyJ6bdJKi/rHdOX2Xm3juvb4MpLPQmw0b6mpx2ntVqtX2Mh9NMh6spufD4Z1KKZtEnYwUNK2lFKVZoUV0CUhqHzWr/gGxFbazEfSLa8dLAPlk4XFlxYgeshL0vCYsOw8aXPiVnH4txtGzw5nzQXX3Hiwzju2CjCxiCTFOWRf4pITWTsX8BcLjDGnLSWkEAAAAASUVORK5CYII=)";
        const redCross = "![alt text Base 64 inline image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAAXNSR0IArs4c6QAAAVRJREFUSEvFll9Og0AQxr9x+dPewnoIE41/Ej0BJPiql9B4Ax/0En3SpMny0As0bfTBS+gtlMJ2DARpweIu0iKPDDO//b6ZZZfQwUMdMFBAPn1/bwcYAjgAIFrAFZhflGVd9kejt7ROAZn7/gzAUYvi5VTmmROGJ1VI0lJBCcKAcqW0qhDemIq8kCNl5tSqXf8HYeCdgN06lb/FjZSkBRwh9mOlngCc/QAxT+xeL5hH0SsBg2rcCJIlMU8iy7pwF4tHMJ8Xhb7f1y0AgDlkHcgAkKY1g+Sg3JprR4iHWgtXPGsOyZzjezcMbyLPuyOiW93IN4csm7wlJdUe1A1DRZq5kromG4CMIJ3tk63veN306OJGdumK6OLrIBs9TwAkjpR2+VfveVMQHetWZxonYGpLeVqCfATBQCTJEESHLU9IRcBzEsdX/fG4fMabrvAv33VyJfoCbarpGjUSYyYAAAAASUVORK5CYII=)";
        const cloudwatchBaseUrl = "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/";    
        const streamName = "logs";

        for(const log of cloudWatchLog?.logEvents ?? []) {
            const pipeline_log_result = pipelineMessage.safeParse(JSON.parse(log.message));            
            
            if (!pipeline_log_result.success) {
                console.log("Error when reading log entry with value: " + log.message)
                console.error(JSON.parse(pipeline_log_result.error.message)[0].message)
                logsUnprocessed++;
            } 
            
            else {
                
                let pipeline_log = pipeline_log_result.data;

                if(!pipeline_log.app.length) {
                    logsUnprocessed++;
                    console.log("Error with log entry. No 'app' was defined. Skipping record.")
                    break;
                }

                if(!pipeline_log.region.length) {
                    logsUnprocessed++;
                    console.log("Error with log entry. No 'region' was defined. Skipping record.")
                    break;
                }

                if(!pipeline_log.env.length) {
                    logsUnprocessed++;
                    console.log("Error with log entry. No 'env' was defined. Skipping record.")
                    break;
                }

                let logName = pipeline_log.region+'/'+pipeline_log.env+'/'+pipeline_log.app;
                dashboardName =  pipeline_log.region+'-'+pipeline_log.env;
                let git_commit_hash = pipeline_log.git_commit_hash;

                // Santize inputs
                var acceptedLogNameRegExp = /[^\.\-_/#A-Za-z0-9]+/;
                logName = await ReplaceInvalidCharacters(logName, acceptedLogNameRegExp);

                // Dashboard widgets
                if(!successDashboardArray.some(x => x === dashboardName)) {
                    widgetBody = await GetDashboardWidgets(dashboardName, cloudWatchClient);
                    if(!!widgetBody) {
                        successDashboardArray.push(dashboardName);
                    }
                    console.log(widgetBody);
                }

                // Check service dependencies
                let dependencyServiceFail = false; 
                if(!!pipeline_log?.dependsOn) {
                    for(let dependency of pipeline_log?.dependsOn) {
                        let dependencyLogName = pipeline_log.region+'/'+pipeline_log.env+'/'+dependency;
                        if(!!dependency) {
                            let dependencyWidget = widgetBody.widgets.find(x => x.properties?.markdown?.indexOf(dependencyLogName));
                            if(dependencyWidget?.properties?.markdown.indexOf(redCross)) {
                                dependencyServiceFail = true;
                                break;
                            }
                        }
                    }
                }
                
                // Log group
                if(!successLogGroupArray.some(x => x === logName)) {
                    let logGroupSuccess = await CreateLogGroups(logName, cloudWatchLogClient);
                    if(logGroupSuccess) {
                        successLogGroupArray.push(logName);
                    }
                }
                
                // Log stream
                let logStreamAndGroup = logName + "_" + streamName;
                if(!successLogStreamArray.some(x => x === logStreamAndGroup)) {
                    let logStreamSuccess = await CreateLogStream(streamName, logName, cloudWatchLogClient);
                    if(logStreamSuccess) {
                        successLogStreamArray.push(logStreamAndGroup);
                    }
                }

                // Log event
                await LogEvent(logName, streamName, pipeline_log, cloudWatchLogClient);
                //await SendEmbeddedMetricsFormat(logName, streamName, pipeline_log, dashboardName);
                
                // Timestamp to utc
                let widgetTimeStamp;
                try {
                    widgetTimeStamp = new Date(z.number().parse(pipeline_log.time_stamp)).toUTCString()
                }
                catch(err) {
                    console.log("Error parsing 'time_stamp' in log")
                }

                // Deployments url
                let deploymentsUrl;
                try {
                    deploymentsUrl = z.string().url().optional().or(z.literal('')).parse(pipeline_log.deployments_url);
                }
                catch(err) {
                    console.log("Error parsing 'deployments_url' in log")
                }

                // Image
                let image = "";
                if(dependencyServiceFail) {
                    image = orangeTick;
                }
                else {
                    switch(pipeline_log.build_exit_code) {
                        case 0:
                            image = greenTick;
                            break;
                        default:
                            image = redCross;
                            break;
                    }
                }

                // Generate Widget Markdown
                let widgetHtml = await GenerateWidgetMarkdown(image, pipeline_log.app, widgetTimeStamp, git_commit_hash, deploymentsUrl, `${cloudwatchBaseUrl}/log-events/${streamName}`, pipeline_log.dependsOn )

                // Remove existing widget for matching app
                for(let existingWidget of widgetBody?.widgets) {
                    if(existingWidget.properties.markdown.includes(` ${pipeline_log.app} `)) {
                        widgetBody?.widgets.splice(widgetBody?.widgets.indexOf(existingWidget), 1);
                    }
                }

                // Add widget
                let widgetProperties: z.infer<typeof propertiesSchema> = {
                    markdown: widgetHtml
                };
                let widget: z.infer<typeof widgetSchema> = {
                    type: "text",
                    x: 0,
                    y: 0,
                    width: widgetWidth,
                    height: widgetHeight,
                    properties: widgetProperties
                };

                widgetBody?.widgets.push(widget);
                logsProcessed++;
            }
        };

        // Arrange widgets
        if(widgetBody?.widgets.length > 0) {
            let x = 0;
            let y = 0;

            if(logsProcessed > 0) {
                widgetBody?.widgets.forEach(w => {
                    w.x = x,
                    w.y = y,
                    x += widgetWidth
                    if(x > widgetBackgroundWidth) {
                        x = 0;
                        y += widgetHeight;
                    };
                });
            }
        
            // Update CloudWatch Dashboard body
            await PutDashboard(dashboardName, widgetBody, cloudWatchClient)
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `${logsProcessed} logs processed succesfully, ${logsUnprocessed} processed unsuccessfully`
            }),
        }
        
    }
    catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err,
            }),
        };
    }
};
