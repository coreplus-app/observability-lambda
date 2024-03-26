<p align="center">
  <a href="" rel="noopener">
 <img src="https://assets-global.website-files.com/651cefcf48b2738217b0d3cf/656805fa4b5f48427bf94bde_28989_logo_main%20-%20horizontal%20(1)-p-500.png" alt="Project logo"></a>
</p>

<h3 align="center">Deployment Observability Dashboard</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/kylelobo/The-Documentation-Compendium.svg)](https://github.com/coreplus-app/observability-lambda/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/kylelobo/The-Documentation-Compendium.svg)](https://github.com/coreplus-app/observability-lambda/pulls)
[![License](https://img.shields.io/badge/license-GPL3.0-blue.svg)](/LICENSE)

</div>

---

<p align="center"> Automate Deployment Observability using AWS CloudWatch Dashboards (for almost any pipeline)
    <br> 
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About ](#about-)
- [Lambda Usage \& Configuration ](#lambda-usage--configuration-)
- [Pipeline Configuration ](#pipeline-configuration-)
- [Authors ](#authors-)

## About <a name = "about"></a>

If you have multiple pipelines deploying multiple services in multiple regions, then there's a good chance you're a victim to deployment observability fragmentation.

Deployment observability fragmentation contributes towards developer cognitive overhead and detracts from developer productivity.

Wouldn't it be nice if you could see what version of a service is deployed in each region and environment - regardless of what pipeline deployed it?

This solution aims to solve this problem in a very simply and effective way, using a simple Lambda AWS function with CloudWatch.

To date, there are no easy and effective ways to create this level of observability without implementing a full blown logging solution, or, rebuilding all your CI/CD deployments into a new singular pipeline.

This Lambda function will automatically generate CloudWatch Dashboards and Widgets, per region and environment.

Below is an example of a generated CloudWatch Dashboard for au-prod and au-qa.

![alt text](image.png)

Green tick === Deployment was successful

Red cross === Deployment failed

Orange warning === Deployment was successful, but a service dependancy failed.

## Lambda Usage & Configuration <a name="usage"></a>

Once you've deployed this Lambda function, attach a trigger to a CloudWatch log stream, so the function will execute each time the log stream is written to. This is the same log stream where all your CI/CD pipelines will push logs to.

To build the deployment package, run the following command, to produce a deployable zip file.
```
npm run build
```

## Pipeline Configuration <a name="usage"></a>

Please review [Tutorial and Sample configuration](pipeline-configuration-reference/pipeline-configuration.md)


## Authors <a name = "authors"></a>

- [@mark_pirotta](https://github.com/mark_pirotta) - Idea & Initial work
- [@MirandaDora](https://github.com/MirandaDora) - Expansion on the initial work, and taking this internally to Amazon.

See also the list of [contributors](https://github.com/coreplus-app/observability-lambda/contributors) who participated in this project.

