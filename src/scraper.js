const AWS = require("aws-sdk");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const TABLE_NAME = process.env.TABLE_NAME;
const SCAPER_URL = "http://statleaders.ufc.com/";

const client = new AWS.DynamoDB.DocumentClient();

exports.scrape = async function (event, context) {
  const response = await fetch(SCAPER_URL);
  const html = await response.text();
  const $ = cheerio.load(html);

  const resultsGroup = $(".results-group");

  const fighterStatistics = [];

  resultsGroup.each(function (i, result) {
    const statistic = $(result).find("header > h3").text();

    $(result)
      .find(".results-table--tr")
      .each(function (i, row) {
        const result = $(row)
          .find("span")
          .map((i, el) => $(el).text())
          .get();

        const [position, name, value] = result;
        const isHeaderRow = result.length > 3;

        if (!isHeaderRow) {
          fighterStatistics.push({
            name,
            statistic,
            value,
            position
          });
        }
      });
  });

  
  try {
    await Promise.all(fighterStatistics.map((result) =>
      client
        .put({
          TableName: TABLE_NAME,
          Item: result,
        })
        .promise()
    ));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        results: fighterStatistics,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
