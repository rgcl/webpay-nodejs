//Unofficial WebPay SDK for Node.js
//Copyright (C) 2017-2020  Rodrigo González Castillo <r.gnzlz.cstll@gmail.com>, et al.
//
//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
