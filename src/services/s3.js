const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "ap-southeast-2",
});

const s3 = new AWS.S3();
const bucketName = "datacraft-bucket";

async function bucketExists() {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

function determineContentType(fileExtension) {
  switch (fileExtension) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'avif':
      return 'image/avif';
    case 'tiff':
      return 'image/tiff';
    case 'svg':
      return 'image/svg+xml';
    case 'json':
    return 'application/json';
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

async function generateUploadUrl(key) {
  const fileExtension = key.split('.').pop().toLowerCase();
  const contentType = determineContentType(fileExtension);

  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Expires: 3600, 
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('putObject', params);
    return signedUrl;
  } catch (err) {
    console.error("Error generating signed URL:", err);
    return null;
  }
}

async function generateDownloadUrl(key) {

  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 3600, 
    ResponseContentDisposition: `attachment; filename="${key}"` 
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (err) {
    console.error("Error generating signed download URL:", err);
    return null;
  }
}

async function searchImagesByPrefix(prefix) {
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map(item => item.Key);
  } catch (err) {
    console.error("Error searching images by prefix:", err);
    return [];
  }
}

(async () => {
  const exists = await bucketExists();

  if (!exists) {
    await s3.createBucket({Bucket: bucketName}).promise();
    console.log("New bucket has been created ", bucketName);
  }
})();


module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  searchImagesByPrefix
};

