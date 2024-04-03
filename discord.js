process.chdir(__dirname);

require('dotenv').config();

const https = require('https');
const querystring = require('querystring');

function fetchCode(serverResponse)
{
  serverResponse.statusCode = 302;
  serverResponse.setHeader('Location', process.env.D_CODE_URL);
  serverResponse.end();
}

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

module.exports =
{
    fetchCode: fetchCode,
    fetchToken: fetchToken,
    fetchClient: fetchClient
};