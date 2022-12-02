const AWS = require("aws-sdk");
const https = require("https");
const dynamodb = new AWS.DynamoDB();
const s3Bucket = new AWS.S3();

const url =
  "https://newsdata.io/api/1/news?apikey=pub_140888f82804297aefb0dc55784b085daa3d8&language=en&category=technology&page=1";

const fetchNews = () => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          reject(new Error(err));
        }
      });
    });
    req.on("error", (err) => {
      reject(new Error(err));
    });
  });
};

const fetchImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const req = https.get(imageUrl, (res) => {
      let rawData = [];
      res.on("data", (chunk) => {
        rawData.push(chunk);
      });
      console.log("rawData", rawData);
      res.on("end", () => {
        try {
          let buffer = Buffer.concat(rawData);
          resolve(buffer);
        } catch (err) {
          reject(new Error(err));
        }
      });
    });
    req.on("error", (err) => {
      reject(new Error(err));
    });
  });
};

// const fetchDynamodbArr = async () => {
//   const params = {
//     TableName: "imagebucket-alimansour",
//     Limit: 50,
//   };

//   const scanResults = [];
//   var items;
//   do {
//     items = await documentClient.scan(params).promise();
//     items.Items.forEach((item) => scanResults.push(item));
//     params.ExclusiveStartKey = items.LastEvaluatedKey;
//   } while (typeof items.LastEvaluatedKey !== "undefined");

//   return scanResults;
// };

const generateId = () => {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};
module.exports.handler = async () => {
  const array = await fetchNews();
  // const dynamodbArr = await fetchDynamodbArr();
  //console.log("dynamodbArr", dynamodbArr);

  for (let i = 0; i < array.results.length; i++) {
    let post = array.results[i];
    const id = generateId().toString();

    if (post.image_url) {
      let image = await fetchImage(post.image_url);
      console.log("image", image);
      const data = {
        Key: id,
        Bucket: "imagebucket-alimansour",
        Body: image,
        ContentType: "image/png",
        ContentEncoding: "base64",
      };
      console.log("data", data);

      const selectedTags = ["javascript"];
      const readTime = "1";
      const params = {
        Item: {
          url: { S: post.link },
          title: { S: post.title },
          id: { S: id },
          image: { S: `https://imagebucket-alimansour.s3.amazonaws.com/${id}` },
          uploadDate: { N: new Date().getTime().toString() },
          upVote: { S: "0" },
          tags: { SS: selectedTags },
          readTime: { S: readTime },
        },
        TableName: "postsTable",
        ConditionExpression: "attribute_not_exists(#url)",
        ExpressionAttributeNames: { "#url": post.link },
      };

      const s3Data = await s3Bucket.putObject(data).promise();
      const dynamoData = await dynamodb.putItem(params).promise();
    }
  }
};
