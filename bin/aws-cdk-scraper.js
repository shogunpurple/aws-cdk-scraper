#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { AwsCdkScraperStack } = require('../lib/aws-cdk-scraper-stack');

const app = new cdk.App();
new AwsCdkScraperStack(app, 'AwsCdkScraperStack');
