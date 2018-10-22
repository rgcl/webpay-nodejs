
module.exports = (res) => {

  return function (err) {
    console.log('ERROR', err)
    res.send(`
      <html>
          <head><meta charset="utf-8"></head>
          <body>
            <h1>ERROR</h1>
            <pre>
            ${err.stack}
            </pre>
          </body>
      </html>
    `)
  }

};
