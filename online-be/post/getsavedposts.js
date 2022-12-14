const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();

module.exports.handler = async (event) => {
  const parsedEvent = JSON.parse(event.body);
  console.log(parsedEvent.user);
  try {
    const { user_table } = process.env;

    console.log(user_table);

    const params = {
      TableName: user_table,
      Key: {
        email: { S: parsedEvent.user },
        username: { S: parsedEvent.user },
      },
      ProjectionExpression: "bookmarks",
    };

    const user = await dynamodb.getItem(params).promise();
    console.log("user", user.Item.bookmarks);
    const formatBatchKeys = () => {
      return user.Item.bookmarks.SS.map((elm) => {
        return {
          type: { S: "posts" },
          url: { S: elm },
        };
      });
    };
    console.log(formatBatchKeys());

    const batchParams = {
      RequestItems: {
        postsTable1: {
          Keys: formatBatchKeys(),
        },
      },
    };
    const posts = await dynamodb.batchGetItem(batchParams).promise();
    console.log("posts", posts.Responses.postsTable1);
    const Items = posts.Responses.postsTable1;
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(Items),
      isBase64Encoded: false,
    };
    console.log("response: ", response);

    return response;
  } catch (error) {
    console.log(error);
    const response = {
      statusCode: 400,

      body: JSON.stringify(error),
    };
    console.log("response: ", response);

    return response;
  }
};
