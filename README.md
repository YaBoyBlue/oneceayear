# Once a Year

Simple website that allows for users to login via Discord, and upload an image that is stored within an S3 Bucket.

## Programming Languages

- HTML - [Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)
- CSS - [Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- JS - [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- SQL - [Reference](https://www.w3schools.com/sql/)
- .env - [Reference](https://www.dotenv.org/docs/security/env.html)

## Products and Services

- Amazon Web Services - [Reference](https://aws.amazon.com/)
  - [Virtual Server (EC2)](#setting-up-ec2) - [Reference](https://aws.amazon.com/ec2/)
  - [Identity Access and Management (IAM)]() - [Reference](https://aws.amazon.com/iam/)
  - [Bucket (S3)]() - [Reference](https://aws.amazon.com/s3/)
- [Nginx]() - [Reference](https://nginx.org/en/)
- [Node.js]() - [Reference](https://nodejs.org/en)
  - [fs]() - [Reference](https://nodejs.org/api/fs.html)
  - [url]() - [Reference](https://nodejs.org/api/url.html)
  - [http]() - [Reference](https://nodejs.org/api/http.html)
  - [https]() - [Reference](https://nodejs.org/api/https.html)
  - [querystring]() - [Reference](https://nodejs.org/api/querystring.html)
  - [aws-sdk]() - [Reference](https://www.npmjs.com/package/aws-sdk)
  - [cookie-session]() - [Reference](https://www.npmjs.com/package/cookie-session)
  - [dotenv]() - [Reference](https://www.npmjs.com/package/dotenv)
  - [mysql]() - [Reference](https://www.npmjs.com/package/mysql)
  - [pm2]() - [Reference](https://www.npmjs.com/package/pm2)
- [MySQL]() - [Reference](https://www.mysql.com/)
- [Discord OAuth2](#discord-oauth2) - [Reference](https://discord.com/developers/docs/topics/oauth2)

## Installation of Products and Services

### Setting Up EC2
<details open>

1. Head over to your AWS console.
2. Click `Services` in the top left, navigate to `Compute` in the list, and then `EC2`.
3. In the `Launch Instance` section click `Launch Instance`.
4. Name your instance, such as `MyWebServer`.
5. Select Ubuntu.
6. `Amazon Machine Image (AMI)` should be Ubuntu Server and say `Free Tier Eligible`.
7. Architecture should be `64-bit (x86)`.
8. Instance type should be `t2.micro`, and should say `Free tier eligible`.
9. Click `Create key pair`.
10. Name the key pair, such as `MyWebServer`.
11. `Key pair type` should be `RSA`.
12. `Private key file format` should be `.pem`.
13. Click `Create key pair`.
14. Make sure to save this to a safe location of your choice.
15. Enable `Allow HTTPS traffic from the internet`.
16. Enable `Allow HTTP traffic from the internet`.
17. Set the `Root volume (Not encrypted)` to 30 in the left most field.
18. You can leave this section alone.
19. Click `Launch Instance`.
20. On the new page, within the `Connect to your instance` section, click `Connect to instance`.
21. Follow the instructions to connect to your instance, via SSH. 
22. Run `sudo apt update` to fetch the latest package lists, containing their information and dependancies.
23. Run `sudo apt upgrade` to upgrade the installed packages to their latest versions.

</details>

### Setting Up IAM

<details open>

1. Head over to your AWS console.
2. Click `Services` in the top left, navigate to `Security, Identiyy, & Compliance` in the list, and then `IAM`.
3. Click `Create bucket`.
4. On the left navigation list, click `Users`.
5. Click `Create user`.
6. Name your user, such as `mywebserveruser`.
7. Click `Next`.
8. Select `Attach policies directly`.
9. Type `AmazonS3FullAccess` into the search box.
10. Enable `AmazonS3FullAccess` with the checkbox.
11. Click `Next`.
12. Click `Create user`.
13. Click the user you just created, within your `Users` list.
14. In the `Summary` section, click `Create access key`.
15. Select `Application running outside AWS`.
16. Click `Next`.
17. Click `Create access key`.
18. Copy your `Access key` as well as your `Secret access key`, and save for later.

</details>

### Setting Up S3

<details open>

1. Head over to your AWS console.
2. Click `Services` in the top left, navigate to `Storage` in the list, and then `S3`.
3. Click `Create bucket`.
4. Choose your preferred `AWS Region`.
5. Name your bucker, such as `mywebserverbucket0`.
6. Select `ACLs enabled`.
7. Select `Bucket owner preferred`.
8. Disable `Block all public access`.
9. Acknowledge the warning.
10. Click `Create bucket`.
11. Click the bucket you just created, within your `Buckets` list.
12. Head to the `Permissions` tab.
13. Click `Edit` on the `Bucket policy`, and add the below text.
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowOnlySpecificUserToUpload",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::account_id:user/iam_name"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::bucket_name/*"
        }
    ]
}
```
>`account_id` is the id of your aws account, and can be found by clicking the drop down on your username in the top left.<br>
>`iam_name` is the name of your iam user.<br>
>`bucket_name` is the name of your bucket.<br>

</details>

### Installing and Configuring Nginx

<details open>

1. Run `sudo apt install nginx`.
2. Check version with `nginx -v`.
3. Check status with `sudo systemctl status nginx`. 
4. Edit a new file at `/etc/nginx/sites-available/new_file`.

```
server
{
        listen 80;
        server_name domain_name;

        location /
        {
                proxy_pass http://localhost:application_port;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }
}
```

>`domain_name`, is the actual domain name or internet protocal (IP) address of your server. <br>
>`application_port`, is the port of your node.js application.

5. This file needs to additionally be written to `/etc/nginx/sites-enabled/`.<br>
To do this via copying, run `sudo cp /etc/nginx/sites-available/new_file /etc/nginx/sites-enabled/`<br>
To do this via a symbolic link, run `sudo ln -s /etc/nginx/sites-available/new_file /etc/nginx/sites-enabled/`<br>
To check your symbolic link, run `ls -l /etc/nginx/sites-enabled/`.
6. Test the configuration, run `sudo nginx -t`.
7. Restart nginx, run `sudo systemctl reload nginx`.

Nginx can be configured to utilize `https` instead of `http`.<br>
An SSL certificate is needed, which can be selfsigned for testing purposes, or obtained through a certificate authority, such as [Let's Encrypt](https://letsencrypt.org/getting-started/).<br>

</details>

### Installing Node.js and Packages

<details open>

1. Run `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
2. Run `nvm install 20`
3. Run both `node -v` and `npm -v`.
4. Navigate to your desired directory, and run npm init.
5. Run `npm install aws-sdk`.
6. Run `npm install cookie-session`.
7. Run `npm install dotenv`.
8. Run `npm install mysql`.
9. Run `touch index.js`.

</details>

### Installing MySQL

<details open>

1. Run `sudo apt install mysql-server`.
2. Check version with `mysql --version`.
3. Check status with `sudo systemctl status mysql`.
2. Run `sudo mysql_secure_installation`, to setup mysql.

</details>

## Using Products and Services

### dotenv Package

<details open>

The dotenv package will help us keep various information out of production files.

To utilize dotenv, when in your application directory, run `touch .env`.<br>
Edit this file, and add your information to it.

#### Writing .end Contents

```python
# Web Server
SERVER_ADDRESS="127.0.0.1"
SERVER_CALLBACK="/callback"

# Session
SESSION_KEY="session_key"

# MySQL Database
DATABASE_HOST="127.0.0.1"
DATABASE_USER="username"
DATABASE_PASSWORD="password"
DATABASE_DATABASE="database"

# Discord Application
DISCORD_CLIENT_ID="client_id"
DISCORD_CLIENT_SECRET="client_secret"

# Amazon Web Services
AWS_BUCKET_NAME="bucket_name"
AWS_BUCKET_REGION="bucket_region"
AWS_IAM_ACCESS_KEY="iam_access_key"
AWS_IAM_SECRET_ACCESS_KEY="iam_secret_access_key"
```

#### Working with .env Contents

```JavaScript
process.chdir(__dirname) // Set process directory to application directory
                         // Which is also where our .env file is located
require('dotenv').config()

myFirstVariable = process.env.MY_VARIABLE

process.env.MY_VARIABLE = "new_value"
```

If your process directory is not where your `.env` file is stored, it will not work.

More about [Process here](https://nodejs.org/api/process.html).

</details>

### Node.js Web Server

<details open>

The entry point, set in our `package.json` is `index.js`.

#### Setting Up index.js Module

```JavaScript
process.chdir(__dirname)

require('dotenv').config()

const http = require('http')
const url = require('url')
const cookieSession = require('cookie-session')

function handleIndex(serverRequest, serverResponse)
{
    serverResponse.statusCode = 200;
    serverResponse.setHeader('Content-Type', 'text/plain')
    serverResponse.end('Hello World!')
}

function handleAnotherPage(serverRequest, serverResponse)
{
    serverResponse.statusCode = 200;
    serverResponse.setHeader('Content-Type', 'text/plain')
    serverResponse.end('Another Page!')
}

function handleError(serverRequest, serverResponse)
{
    serverResponse.statusCode = 200;
    serverResponse.setHeader('Content-Type', 'text/plain')
    serverResponse.end('Failed to resolve URL!')
}

const server = http.createServer((serverRequest, serverResponse) =>
{
    const sessionMiddleware = cookieSession
    ({
        name: 'session',
        keys: [`process.env.SESSION_KEY`], // Privately stored string, 32+ characters long.
        maxAge: 24 * 60 * 60 * 1000 // Hours * Minutes * Seconds * Miliseconds
    })

    sessionMiddleware(serverRequest, serverResponse, () =>
    {
        const requestParsed = url.parse(serverRequest.url, true)

        switch (requestParsed.pathname)
        {
            case '/': handleIndex(serverRequest, serverResponse); break
            case '/anotherPage': handleAnotherPage(serverRequest, serverResponse); break
            default: handleError(serverRequest, serverResponse)
        }
    })
})

server.listen(3000, '127.0.0.1', () =>
{
    console.log('Listening on 3000 at 127.0.0.1!')
})
```

</details>

### cookie-session Package

<details open>

The Cookie-session package will allow us to maintain information about the session of a user, while traversing multiple web pages, requests, and responses.

Handling requests and responses within `sessionManager()` will enable the use of `serverRequest.session.VARIABLE`.

#### Utilizing Cookie-session

```JavaScript
/* Additional Code */

const sessionMiddleware = cookieSession
({
    name: 'session',
    keys: [`process.env.SESSION_KEY`], // Privately stored string, 32+ characters long.
    maxAge: 24 * 60 * 60 * 1000 // Hours * Minutes * Seconds * Miliseconds
})

sessionMiddleware(serverRequest, serverResponse, () =>
{
    serverResponse.statusCode = 200
    serverResponse.setHeader('Content-Type', 'text/plain')

    if (serverRequest.session.cookieExists)
    {
        // Cookie holds some value.
        
        serverResponse.end('Cookie exists!')
    }
    else
    {   
        // Cookie does not hold a value, and is either undefined or null.

        serverRequest.session.cookieExists = 'I am a cookie!'
        serverResponse.end('Cookie does not exist!')
    }
})

/* Additional Code */
```

</details>





### mysql Package

<details open>

The mysql package will allow for us to store data we want to persist from session to session.

#### Setting Up mysql.js Module

```JavaScript
process.chdir(__dirname);

require('dotenv').config();

const mysql = require('mysql');

function fetchConnection()
{
  return mysql.createConnection
  ({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
  });
}
```

#### Query Function

```JavaScript
async function query(sql)
{
  const connection = fetchConnection();

  return new Promise((resolve, reject) =>
  {
    connection.query(sql, (error, result, fields) =>
    {
      if (error)
      {
        reject(error);
      }
      else
      {
        resolve(result);
      }
    });

    connection.end();
  });
}
```

#### Processing Queries

```JavaScript
/* Additional Code */

let insert = await query(`INSERT INTO table_name ${c1} VALUES (${v1})`)
let update = await query(`UPDATE table_name SET ${c2} = ${v2} WHERE ${c3} = ${v3}`)
let select = await query(`SELECT * FROM users WHERE ${c4} = ${v4}`)

console.log(insert)
console.log(update)
console.log(select)

/* Additional Code */
```

</details>

### aws-sdk Package

<details open>

The aws-sdk package will allow for us to upload our images to our S3 Bucket.

#### Setting Up aws-sdk.js Module

```JavaScript
process.chdir(__dirname);

require('dotenv').config();

const fileSystem = require('fs')
const aws = require('aws-sdk')

aws.config.update
({
    accessKeyID: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

const s3 = new aws.S3()
```
#### Uploading an Image

````JavaScript
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
````

#### Deleting an Image

````JavaScript
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
````

</details>

### Discord OAuth2

<details open>

Discord's OAuth2 authenticaion API components will be helpful in authenticating users.

#### Fetching Authorization Code

```JavaScript
function fetchCode(serverResponse)
{
  serverResponse.statusCode = 302;
  serverResponse.setHeader('Location', process.env.D_CODE_URL);
  serverResponse.end();
}
```

#### Fetching User Access Token

```JavaScript
function fetchToken(code)
{
  return new Promise((resolve, reject) =>
  {
    const tokenRequestData = querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.SERVER_CALLBACK,
      client_id: process.env.D_CLIENT_ID,
      client_secret: process.env.D_CLIENT_SECRET
    });
  
    const tokenRequestOptions = {
      hostname: 'discord.com',
      path: '/api/oauth2/token',
      method: 'POST',
      headers:
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': tokenRequestData.length
      }
    };
  
    const tokenRequest = https.request(tokenRequestOptions, (tokenResponse) =>
    {
      let tokenData = '';
  
      tokenResponse.on('data', (tokenChunk) =>
      {
        tokenData += tokenChunk;
      });
  
      tokenResponse.on('end', () =>
      {
        const tokenDataJSON = JSON.parse(tokenData);
  
        resolve(tokenDataJSON);
      });
    });
  
    tokenRequest.on('error', (tokenError) =>
    {
      reject(tokenError);
    });
  
    tokenRequest.write(tokenRequestData);
    tokenRequest.end();
    
  });
}
```

#### Fetching Client Credentials

```JavaScript
function fetchClient(access_token)
{
  return new Promise((resolve, reject) =>
  {
    const userRequestOptions =
    {
      hostname: 'discord.com',
      path: '/api/users/@me',
      method: 'GET',
      headers:
      {
        'Authorization': `Bearer ${access_token}`
      }
    };

    const userRequest = https.request(userRequestOptions, (userResponse) =>
    {
      let userData = '';

      userResponse.on('data', (userChunk) =>
      {
        userData += userChunk;
      });

      userResponse.on('end', async () =>
      {
        const userDataJSON = JSON.parse(userData);

        resolve(userDataJSON);
      });
    });

    userRequest.on('error', (userError) =>
    {
      reject(userError);
    });

    userRequest.end();
  });
}
```

</details>
