const AWS = require("aws-sdk");

const TABLE_NAME = process.env.TABLE_NAME;

const client = new AWS.DynamoDB.DocumentClient();

exports.query = async function (event) {
  if (event.body) {
    const body = JSON.parse(event.body);
    const result = await client
      .query({
        TableName: TABLE_NAME,
        ExpressionAttributeNames: { "#column": "name" },
        KeyConditionExpression: "#column = :name",
        ExpressionAttributeValues: { ":name": body.name, },
      })
      .promise();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.Items),
    };
  } else {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "No Fighter Name Provided.",
      }),
    };
  }
};
