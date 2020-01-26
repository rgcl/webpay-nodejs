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
"use strict";

const WebPay = require('../lib/WebPay');
const express = require('express');
const bodyParser = require('body-parser');
const onError = require('./onError');

let app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const cert = require('./cert/oneClick');

/**
 * 1. Instanciamos la clase WebPay.
 *
 * Notar que los certificados son simples strings, no buffer de archivos ni nada esotérico o místico.
 *
 * @type {WebPay}
 */
let wp = new WebPay({
  commerceCode: cert.commerceCode,
  publicKey: cert.publicKey,
  privateKey: cert.privateKey,
  webpayKey: cert.webpayKey,
  verbose: true,
  env: WebPay.ENV.INTEGRACION
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
    <head>
        <title>Test webpay-nodejs:OneClick</title>
    </head>
    <body>
        <h1>Test webpay-nodejs OneClick</h1>
        <form action="/inscripcion" method="post">
            <h1>Inscripción de tarjetahabiente</h1>
            <input type="text" name="username" placeholder="username">
            <input type="email" name="email" placeholder="email">
            <input type="submit" value="Inscribir mi tarjeta">
        </form>
    </body>
</html>`);
});

let username;
app.post('/inscripcion', (req, res) => {

  let url = 'http://' + req.get('host');

  // Esto es un ejemplo. Obviamente en la vida real se usan bases de datos o alguna forma de persistencia
  username = req.body.username;

  /**
   *
   */
  wp.oneclick.initInscription({
    username: req.body.username,
    email: req.body.email,
    responseUrl: url + '/inscripcion-result'
  }).then((data) => {
    res.end(`
        <html><head><meta charset="UTF-8"><style>*{font-family: sans-serif;}</style> 
        </head><body onload="document.getElementById('form').submit()">
        <form action="${data.urlWebpay}" id="form" method="post">
        <input type="hidden" name="TBK_TOKEN" value="${data.token}">
        </form>
        <p>Cargando...</p>
        </body></html>
        `);
  });

});

app.post('/inscripcion-result', (req, res) => {

  let url = 'http://' + req.get('host');
  let token = req.body.TBK_TOKEN;

  wp.oneclick.finishInscription(token).then((data) => {

    let dataStr = JSON.stringify(data);

    res.send(`
<!DOCTYPE html>
<html>
    <head>
        <title>Test webpay-nodejs</title>
    </head>
    <body>
        <h1>Test webpay-nodejs: Tarjeta registrada</h1>
        <p>${dataStr}</p>
        <form action="/eliminarTarjeta" method="post">
            <input type="hidden" name="username" value=${username}>
            <input type="hidden" name="tbkUser" value=${data.tbkUser}>
            <input type="submit" value="Eliminar tarjeta">
        </form>
        <hr>
        <form action="/pagar" method="post">
            <input type="number" min="10" placeholder="Monto a pagar" name="amount">
            <input type="hidden" name="tbkUser" value=${data.tbkUser}>
            <input type="submit" value="Pagar">
        </form>
    </body>
</html>`);
  }).catch(onError(res));

});

app.post('/eliminarTarjeta', (req, res) => {

  wp.oneclick.removeUser({
    username: req.body.username,
    tbkUser: req.body.tbkUser
  }).then((data) => {
    res.end(JSON.stringify(data));
  }).catch(onError(res));

});

app.post('/pagar', (req, res) => {

  let amount = parseInt(req.body.amount);
  const buyOrder = Date.now(); // <-- no sigue el formato, no aseguro que funcione así en producción.

  wp.oneclick.authorize({
    tbkUser: req.body.tbkUser,
    username: username,
    buyOrder: buyOrder,
    amount: amount
  }).then((data) => {
    // Al ser un ejemplo, se está usando GET.
    // Transbank recomienda POST, el cual se debe hacer por el lado del cliente, obteniendo
    // esta info por AJAX... al final es lo mismo, así que no estresarse.
    const dataStr = JSON.stringify(data);
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Test webpay-nodejs</title>
            </head>
            <body>
                <h1>Test webpay-nodejs: Resultado de pago</h1>
                <p>${dataStr}</p>
                <form action="/anular" method="post">
                    <input type="hidden" name="buyOrder" value="${buyOrder}">
                    <input type="submit" value="Anular pago">
                </form>
            </body>
        </html>`);
  }).catch(onError(res));

});

app.post('/anular', (req, res) => {

  wp.oneclick.codeReverseOneClick(parseInt(req.body.buyOrder)).then((result) => {
    return res.send('Pago reversado:' + JSON.stringify(result));
  }).catch(onError(res));
});


app.listen(3000, () => {
  console.log('Server OK in http://localhost:3000');
});