process.chdir(__dirname);

require('dotenv').config();

const fs = require('fs');
const aws = require ('aws-sdk');

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new aws.S3();

async function uploadFileToS3(fileName)
{

    const fileContent = await fs.promises.readFile(fileName);

    const params =
    {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: 'image/jpg',
        ACL: 'public-read'
    }

    try
    {
        const data = await s3.upload(params).promise()
        console.log('File uploaded successfully')
        return data
    }
    catch (err)
    {
        console.error('Error uploading file:', err)
        throw err;
    }
}

async function deleteFileFromS3(fileName)
{
    const params =
    {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName
    }

    try
    {
        const data = await s3.deleteObject(params).promise()
        console.log('File deleted successfully')
        return data
    }
    catch (err)
    {
        console.error('Error deleting file:', err)
        throw err;
    }
}

module.exports =
{
    uploadFileToS3: uploadFileToS3,
    deleteFileFromS3:deleteFileFromS3
};