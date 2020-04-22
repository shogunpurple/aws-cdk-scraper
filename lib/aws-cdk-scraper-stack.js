const cdk = require("@aws-cdk/core");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const apiGateway = require("@aws-cdk/aws-apigateway");

class AwsCdkScraperStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create our DynamoDB table
    const fighterStatsTable = new dynamodb.Table(this, "FighterStatsTable", {
      partitionKey: {
        name: "name",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "statistic",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Create our lambda
    const scraperLambda = new lambda.Function(this, "scraper", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("src"),
      handler: "scraper.scrape",
      timeout: cdk.Duration.seconds(20),
      environment: {
        TABLE_NAME: fighterStatsTable.tableName,
      },
    });

    const fighterApiLambda = new lambda.Function(this, "fighterApi", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("src"),
      handler: "queryStats.query",
      environment: {
        TABLE_NAME: fighterStatsTable.tableName,
      },
    });

    // Create API Gateway API
    const api = new apiGateway.RestApi(this, "ufc-scraper-api", {
      restApiName: "UFC Stats Scraper",
      description: "UFC Stats Scraper API.",
    });

    // call our lambda when someone makes a GET request to /scrape
    const scrape = api.root.addResource("scrape");
    const scraperIntegration = new apiGateway.LambdaIntegration(scraperLambda);
    scrape.addMethod("GET", scraperIntegration);

    const fighterApi = api.root.addResource("fighter");
    const apiIntegration = new apiGateway.LambdaIntegration(fighterApiLambda);
    fighterApi.addMethod("POST", apiIntegration);

    // allow the scraper lambda to write to dynamoDB
    fighterStatsTable.grantWriteData(scraperLambda);
    // allow the api lambda to read from dynamoDB
    fighterStatsTable.grantReadData(fighterApiLambda);
  }
}

module.exports = { AwsCdkScraperStack };
