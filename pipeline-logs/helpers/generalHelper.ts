export const ReplaceInvalidCharacters = async (inputString: string, regexPattern: RegExp): Promise<string> => {
    
    if(inputString == "") {
        return Promise.resolve(inputString);
    }

    //var re = /[^:*]*/
    inputString = inputString.replace(regexPattern, ""); 
    return Promise.resolve(inputString);

}

export const GenerateWidgetMarkdown = async (image: string, appName: string, widgetTimeStamp: string | undefined, git_commit_hash: string, deploymentsUrl: string | undefined, logUrl: string, dependsOn: string[] | undefined ): Promise<string> => {

    let dependencyMarkdown;
    if(dependsOn != undefined) {
        dependsOn = dependsOn.filter(Boolean);
        if(dependsOn.length > 0) {
            dependencyMarkdown = "Dependencies: "
            for(let str of dependsOn) {
                dependencyMarkdown += `${str} `
            }
        }   
    }

    let widgetMarkdown = `${widgetTimeStamp}`
    if(!!dependencyMarkdown) {
        widgetMarkdown += `        
        
        ${dependencyMarkdown}`;
    }

return `# ${image} ${appName} 

${widgetMarkdown}

Hash: [${git_commit_hash}](${deploymentsUrl}) 

[Logs](${logUrl}) `;

}