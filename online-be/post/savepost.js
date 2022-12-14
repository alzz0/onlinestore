const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();

module.exports.handler = async (event) => {
  const parsedEvent = JSON.parse(event.body);
  console.log(parsedEvent.user);
  try {
    const { user_table } = process.env;

    const updateParams = {
      TableName: user_table,
      Key: {
        email: { S: parsedEvent.user },
        username: { S: parsedEvent.user },
      },

      UpdateExpression: "ADD bookmarks :bookmarks",
      ExpressionAttributeValues: {
        ":bookmarks": {
          SS: [parsedEvent.post],
        },
      },
      ReturnValues: "UPDATED_NEW",
    };
    const updatedUser = await dynamodb.updateItem(updateParams).promise();
    console.log(updatedUser);

    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: "success",
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
