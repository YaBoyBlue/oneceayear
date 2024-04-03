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

function query(sql)
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
  })
}

function insertUser(identifier)
{
  const sql = `INSERT INTO users (identifier) VALUES ('${identifier}')`;

  return query(sql);
}

function updateLink(identifier, link)
{
  const sql = `UPDATE users SET link = '${link}' WHERE identifier = '${identifier}'`;

  return query(sql);
}

function updateDate(identifier)
{
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const sql = `UPDATE users SET date = '${date}' WHERE identifier = '${identifier}'`;

  return query(sql);
}

function updateUploaded(identifier, uploaded)
{
  const sql = `UPDATE users SET uploaded = '${uploaded}' WHERE identifier = '${identifier}'`;

  return query(sql);
}

function updateDeleted(identifier, deleted)
{
  const sql = `UPDATE users SET deleted = '${deleted}' WHERE identifier = '${identifier}'`;

  return query(sql);
}

function selectIdentifier(identifier)
{
  const sql = `SELECT * FROM users WHERE identifier = ${identifier}`;

  return query(sql);
}

function selectLink(identifier)
{
  const sql = `SELECT link FROM users WHERE identifier = ${identifier}`;

  return query(sql);
}

function selectDate(identifier)
{
  const sql = `SELECT date FROM users WHERE identifier = ${identifier}`;

  return query(sql);
}

function selectUploaded(identifier)
{
  const sql = `SELECT uploaded FROM users WHERE identifier = ${identifier}`;

  return query(sql);
}

function selectDeleted(identifier)
{
  const sql = `SELECT deleted FROM users WHERE identifier = ${identifier}`;

  return query(sql);
}

function selectRecentUploads()
{
  const sql = `SELECT link FROM users WHERE uploaded = 1 ORDER BY date DESC`;

  return query(sql);
}

module.exports =
{
  insertUser: insertUser,
  updateLink: updateLink,
  updateDate: updateDate,
  updateUploaded: updateUploaded,
  updateDeleted:updateDeleted,
  selectIdentifier: selectIdentifier,
  selectLink: selectLink,
  selectDate: selectDate,
  selectUploaded: selectUploaded,
  selectDeleted: selectDeleted,
  selectRecentUploads: selectRecentUploads
};