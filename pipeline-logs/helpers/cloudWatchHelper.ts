import { CloudWatchClient, GetDashboardCommand, GetDashboardInput, PutDashboardCommandInput, PutDashboardCommand } from "@aws-sdk/client-cloudwatch";
import { widgetMarkdownSchema, widgetSchema } from '../types'
import { z } from 'zod';

type WidgetMarkdown = z.infer<typeof widgetMarkdownSchema>;

export const PutDashboard = async (dashboardName: string, dashboardBody: WidgetMarkdown, cloudWatchClient: CloudWatchClient): Promise<boolean> => {
    
    let putDashboardCommandInput: PutDashboardCommandInput = {
        DashboardName: dashboardName,
        DashboardBody: JSON.stringify(dashboardBody)
    }

    const putDashboardCommand = new PutDashboardCommand(putDashboardCommandInput);
    try {
        const putDashboardCommandResponse = await cloudWatchClient.send(putDashboardCommand);
        if(putDashboardCommandResponse.$metadata.httpStatusCode == 200) {
            console.log("Dashboard " + dashboardName + " updated successfully");
            return Promise.resolve(true)
        }
        else {
            console.log("Error updating dashboard " + dashboardName);
            return Promise.reject(false)
        }
    }
    catch(err) {
        console.log("Error updating dashboard " + dashboardName);
        console.log("Error: " + (err as Error).name);
        return Promise.reject(false);
    }
}

export const GetDashboardWidgets = async (dashboardName: string, cloudWatchClient: CloudWatchClient): Promise<WidgetMarkdown> => {

    let getDashboardCommandInput: GetDashboardInput = {
        DashboardName: dashboardName
    };

    const getDashboardCommand = new GetDashboardCommand(getDashboardCommandInput);
    let DashboardBody: WidgetMarkdown;

    try {
          const getDashboardCommandResponse = await cloudWatchClient.send(getDashboardCommand)

          if(getDashboardCommandResponse?.$metadata?.httpStatusCode == 200) {
            let widgetResponse = widgetMarkdownSchema.safeParse(JSON.parse(getDashboardCommandResponse?.DashboardBody ?? "")); 
            if(!widgetResponse.success) {
                console.log("Couldn't parse the body of dashboard " + dashboardName);
                console.error(JSON.parse(widgetResponse.error.message)[0].message)
                return Promise.reject("Error");
            }
            else {
                DashboardBody = widgetResponse.data;
                return Promise.resolve(DashboardBody);
            }
        }
        else {
            return Promise.reject("Error");
        }
    }
    catch(err) {
        console.log("Error getting dashboard " + dashboardName);
        console.log("Error: " + (err as Error).name);
        if((err as Error).name === "DashboardNotFoundError") {
            let widgetBody: z.infer<typeof widgetMarkdownSchema> = { widgets: [] };
            return Promise.resolve(widgetBody);
        }
        return Promise.reject("Error");
    };       
};
