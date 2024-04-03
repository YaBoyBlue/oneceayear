process.chdir(__dirname);

require('dotenv').config();

const http = require('http');
const url = require('url');
const fs = require('fs');
const cookieSession = require('cookie-session');

const mysql = require('./mysql.js');
const discord = require('./discord.js');
const amazon = require('./amazon.js');

const hostname = '127.0.0.1';
const port = 3000;

const html_index = process.env.HTML_INDEX;

const html_failedFetch = process.env.HTML_FAILED_FETCH;

function fetchHTML(pathToHTML)
{
  return new Promise((resolve) =>
  {
    fs.readFile(pathToHTML, 'utf-8', (err, html) =>
    {
      if (err)
      {
        resolve(html_failedFetch);
      }
      else
      {
        resolve(html);
      }
    });
  });
}

function sendResponse(response, code, header, type, content)
{
  response.statusCode = code;
  response.setHeader(header, type);
  response.end(content);
}

async function handleIndex(serverRequest, serverResponse)
{
  let html = await fetchHTML(html_index)

  const identifier = await serverRequest.session.identifier

  if (!identifier)
  {
    // Not logged in.

    html = html.replace('{{message}}', 'Login with your Discord account, to upload an image.')
    html = html.replace('{{login/logout}}', '<a class="center button font-landing-button" href="/login" class="button">LOGIN WITH DISCORD</a>')
    html = html.replace('{{image}}', '')
    html = html.replace('{{upload/delete}}', '')
    html = html.replace('{{script}}', '')
  }
  else
  {
    // Logged in.

    html = html.replace('{{login/logout}}', '<a class="center button font-landing-button" href="/logout" class="button">LOGOUT</a>')

    if ((await mysql.selectUploaded(identifier))[0].uploaded == 0)
    {
      // Not uploaded.

      html = html.replace('{{message}}', 'Select an image you would like to upload!<br>It must be under 200 kilobytes.')
      html = html.replace('{{image}}', '')
      html = html.replace('{{upload/delete}}', `
        <form class="center" action="/upload#upload" method="post" enctype="multipart/form-data">
          <label class="button" for="image">SELECT YOUR PHOTO</label>
          <input id="image" type="file" name="image" accept="image/jpg">
          <div class="center container-image">
              <img id="preview" class="center image" src="">
          </div>
          <button class="button" type="submit">UPLOAD</button>
        </form>
      `)
      html = html.replace('{{script}}', `
      <script>
        const fileInput = document.getElementById('image')
        const previewImage  = document.getElementById('preview')

        fileInput.addEventListener('change', event => {
            if (event.target.files.length > 0) {
                previewImage.src = URL.createObjectURL(event.target.files[0]);
            }
        })
      </script>
      `)
    }
    else
    {
      // Uploaded.

      if ((await mysql.selectDeleted(identifier))[0].deleted == 0)
      {
        // Not Deleted.

        let link = (await mysql.selectLink(identifier))[0].link

        html = html.replace('{{message}}', 'Your image is already uploaded.<br>If you delete your image you will not be able to upload again until the new year.')
        html = html.replace('{{image}}', `
        <div class="center container-image">
          <img id="preview" class="center image" src="${link}">
        </div>
        `)
        html = html.replace('{{upload/delete}}', '<a class="center button font-landing-button" href="/delete" class="button">DELETE IMAGE</a>')
        html = html.replace('{{script}}', '')
      }
      else
      {
        // Deleted.

        html = html.replace('{{message}}', 'You deleted your image.<br>You will not be able to upload again until the new year!')
        html = html.replace('{{image}}', '')
        html = html.replace('{{upload/delete}}', '<p class="center">You have deleted your uploaded image, and must wait until the new year to upload again.</p>')
        html = html.replace('{{script}}', '')
      }
    }
  }

  let recentUploads = await mysql.selectRecentUploads()

  for (let i = 0; i < recentUploads.length; i++)
  {
    html = await html.replace(`{{gallery_${i}}}`, `<img class="center image" src="${recentUploads[i].link}">` )
    console.log(recentUploads[i].link)
  }

  sendResponse(serverResponse, 200, 'Content-Type', 'text/html', html)
}

function handleLogin(serverResponse)
{
  discord.fetchCode(serverResponse)
}

async function handleLogout(serverRequest, serverResponse)
{
  serverRequest.session.identifier = undefined
  sendResponse(serverResponse, 302, 'Location', 'process.env.SERVER_ADDRESS', null)
}

async function handleCallback(serverRequest, serverResponse, requestParsed)
{
  let tokenJSON = await discord.fetchToken(requestParsed.query.code);
  let userJSON = await discord.fetchClient(tokenJSON.access_token);

  if ((await mysql.selectIdentifier(userJSON.id)).length == 0)
  {
    // User not in database.
    handleUser = await mysql.insertUser(userJSON.id)
  }

  serverRequest.session.identifier = userJSON.id
  sendResponse(serverResponse, 302, 'Location', `${process.env.SERVER_ADDRESS}#upload`, null)
}

async function handleUpload(serverRequest, serverResponse)
{
  const identifier = await serverRequest.session.identifier

  if (!identifier)
  {
    sendResponse(serverResponse, 302, 'Location', `process.env.SERVER_ADDRESS`, null)
    return
  }

  if ((await mysql.selectUploaded(identifier))[0].uploaded == 1)
  {
    sendResponse(serverResponse, 302, 'Location', `process.env.SERVER_ADDRESS`, null)
    return
  }

  const fileSizeMax = 1024 * 500
  let fileContent = Buffer.alloc(0)
  let fileSize = 0

  serverRequest.on('data', (chunk) =>
  {   
    fileContent = Buffer.concat([fileContent, chunk])
    fileSize += chunk.length
    
    if (fileSize > fileSizeMax)
    {
      return
    }
  })

  serverRequest.on('end', ()=>
  {
    if (fileSize > fileSizeMax)
    {
      return
    }

    const contentType = serverRequest.headers['content-type']
    const boundary = contentType.split('=')[1]
    const startBoundaryBuffer = Buffer.from('Content-Type: image/jpeg')
    const endBoundaryBuffer = Buffer.from('--' + boundary + '--')

    const startBoundaryIndex = fileContent.indexOf(startBoundaryBuffer) + startBoundaryBuffer.length + 4
    const endBoundaryIndex = fileContent.indexOf(endBoundaryBuffer) - 2

    fileContent = fileContent.slice(startBoundaryIndex, endBoundaryIndex)

    fs.writeFile(`${identifier}.jpg`, fileContent, async (err) =>
    {
      if (err)
      {
        console.error(err)
        sendResponse(serverResponse, 500, 'Content-Type', 'application/json', JSON.stringify({ error: msg }))
      }
      else
      {
        let uploadLocation = await amazon.uploadFileToS3(`${identifier}.jpg`)
        console.log(uploadLocation.Location)

        let handleLink = await mysql.updateLink(identifier, uploadLocation.Location)
        let handleDate = await mysql.updateDate(identifier)
        let handleUploaded = await mysql.updateUploaded(identifier, 1)

        sendResponse(serverResponse, 302, 'Location', `process.env.SERVER_ADDRESS`, null)
      }
    })
  })
}

async function handleDelete(serverRequest, serverResponse)
{
  const identifier = await serverRequest.session.identifier

  if (!identifier)
  {
    sendResponse(serverResponse, 302, 'Location', `process.env.SERVER_ADDRESS`, null)
    return
  }

  deleteData = await amazon.deleteFileFromS3(`${identifier}.jpg`)

  let handleLink = await mysql.updateLink(identifier, '')
  let handleDeleted = await mysql.updateDeleted(identifier, 1)

  sendResponse(serverResponse, 302, 'Location', `process.env.SERVER_ADDRESS`, null)
}

const server = http.createServer(async (serverRequest, serverResponse) =>
{
  const sessionMiddleware = cookieSession
  ({
    name: 'session',
    keys: [`${process.env.SESSION_KEY}`],
    maxAge: 5 * 60 * 1000
  })

  sessionMiddleware(serverRequest, serverResponse, async () =>
  {
    const requestParsed = url.parse(serverRequest.url, true)

    switch (requestParsed.pathname)
    {
      case '/': handleIndex(serverRequest, serverResponse); break
      case '/login': handleLogin(serverRequest, serverResponse); break
      case '/logout': handleLogout(serverRequest, serverResponse); break
      case '/callback': handleCallback(serverRequest, serverResponse, requestParsed); break
      case '/upload': handleUpload(serverRequest, serverResponse); break
      case '/delete': handleDelete(serverRequest, serverResponse); break
      default: handleIndex(serverRequest, serverResponse)
    }
  })
})

server.listen(port, hostname, () => { console.log(`Listening on ${port} at ${hostname}`)});