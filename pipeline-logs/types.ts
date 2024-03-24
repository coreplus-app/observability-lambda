import { z } from 'zod';

// Dashboard schema
export const propertiesSchema = z.object({
    markdown: z.string()
})

// Dashboard widget schema
export const widgetSchema = z.object({
    type: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    properties: propertiesSchema
})

// Dashboard widget 
export const widgetMarkdownSchema = z.object({
    widgets: z.array(widgetSchema)
})

// Pipeline log schema
export const pipelineMessage = z.object({
    app: z.string().min(1),
    time_stamp: z.coerce.number().nullish().transform( x => x ? x : undefined ),
    git_commit_hash: z.string(),
    deployments_url: z.string().optional(),
    pipeline_id: z.string(),
    repo_id: z.string(),
    build_step: z.string(),
    build_number: z.string(),
    build_exit_code: z.coerce.number().transform( x => x ? x : 0 ),
    region: z.string(),
    dependsOn: z.array(z.string()).optional(),
    env: z.string()
})