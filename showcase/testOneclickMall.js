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

const cert = require('./cert/oneClickMall');

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
        <title>Test webpay-nodejs:OneClickMall</title>
    </head>
    <body>
        <h1>Test webpay-nodejs OneClickMall</h1>
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
  wp.oneclickmall.initInscription({
    username: req.body.username,
    email: req.body.email,
    returnUrl: url + '/inscripcion-result'
  }).then((data) => {
    res.end(`
        <html><head><meta charset="UTF-8"><style>*{font-family: sans-serif;}</style>
        </head><body onload="document.getElementById('form').submit()">
        <form action="${data.urlInscriptionForm}" id="form" method="post">
        <input type="hidden" name="TBK_TOKEN" value="${data.token}">
        </form>
        <p>Cargando...</p>
        </body></html>
        `);
  }).catch(onError(res));

});

app.post('/inscripcion-result', (req, res) => {

  let url = 'http://' + req.get('host');
  let token = req.body.TBK_TOKEN;

  wp.oneclickmall.finishInscription(token).then((data) => {

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
        <hr/>
        <form action="/eliminarTarjeta" method="post">
            <input type="hidden" name="username" value=${username}>
            <input type="hidden" name="tbkUser" value=${data.tbkUser}>
            <input type="submit" value="Eliminar tarjeta">
        </form>
        <hr/>
        <form action="/pagar" method="post">
            <input type="number" min="10" placeholder="Monto a pagar en tienda 1" name="amount1">
            <input type="number" min="10" placeholder="Monto a pagar en tienda 2" name="amount2">
            <input type="hidden" name="tbkUser" value=${data.tbkUser}>
            <input type="submit" value="Pagar">
        </form>
    </body>
</html>`);
  }).catch(onError(res));

});

app.post('/eliminarTarjeta', (req, res) => {

  wp.oneclickmall.removeInscription({
    username: req.body.username,
    tbkUser: req.body.tbkUser
  }).then((data) => {
    res.end(JSON.stringify(data));
  }).catch(onError(res));

});

app.post('/pagar', (req, res) => {

  let buyOrderBase = new Date().toISOString().slice(0,19).replace(/[^0-9]/g, "");
  let buyOrder = buyOrderBase + "000";
  let subBuyOrder1 = buyOrderBase + "001";
  let subBuyOrder2 = buyOrderBase + "002";

  wp.oneclickmall.authorize({
    tbkUser: req.body.tbkUser,
    username: username,
    buyOrder: buyOrder,
    storesInput: [{
      commerceId: 597020000585,
      buyOrder: subBuyOrder1,
      amount: parseInt(req.body.amount1),
      sharesNumber: 0
    }, {
      commerceId: 597020000586,
      buyOrder: subBuyOrder2,
      amount: parseInt(req.body.amount2),
      sharesNumber: 0
    }]
  }).then((data) => {
    // Por simplicidad del ejemplo se estan pasando los parametros a
    // traves del cliente de usando inputs, lo correcto es manejar estos
    // datos solo en backend
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
                <hr/>
                <form action="/anular" method="post">
                    Monto a anular de compra en tienda 1:
                    <input type="number" min="10" placeholder="Monto a anular" name="amount">
                    <input type="hidden" name="commerceId" value="${data.storesOutput[0].commerceId}">
                    <input type="hidden" name="buyOrder" value="${data.storesOutput[0].buyOrder}">
                    <input type="hidden" name="authorizedAmount" value="${data.storesOutput[0].amount}">
                    <input type="hidden" name="authorizationCode" value="${data.storesOutput[0].authorizationCode}">
                    <input type="submit" value="Anular pago en tienda 1">
                </form>
                <hr/>
                <form action="/anular" method="post">
                    Monto a anular de compra en tienda 2:
                    <input type="number" min="10" placeholder="Monto a anular" name="amount">
                    <input type="hidden" name="commerceId" value="${data.storesOutput[1].commerceId}">
                    <input type="hidden" name="buyOrder" value="${data.storesOutput[1].buyOrder}">
                    <input type="hidden" name="authorizedAmount" value="${data.storesOutput[1].amount}">
                    <input type="hidden" name="authorizationCode" value="${data.storesOutput[1].authorizationCode}">
                    <input type="submit" value="Anular pago en tienda 2">
                </form>
                <hr/>
                <form action="/reversar" method="post">
                    <input type="hidden" name="buyOrder" value="${buyOrder}">
                    <input type="submit" value="Reversar toda la transacción">
                </form>
            </body>
        </html>`);
  }).catch(onError(res));
});

app.post('/reversar', (req, res) => {
  wp.oneclickmall.reverse(req.body.buyOrder).then((result) => {
    return res.send('Transacción reversada:' + JSON.stringify(result));
  }).catch(onError(res));
});

app.post('/anular', (req, res) => {
  wp.oneclickmall.nullify({
    commerceId: req.body.commerceId,
    buyOrder: req.body.buyOrder,
    authorizedAmount: parseInt(req.body.authorizedAmount),
    authorizationCode: req.body.authorizationCode,
    nullifyAmount: parseInt(req.body.amount)
  }).then((data) => {
    const dataStr = JSON.stringify(data);
    return res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Test webpay-nodejs</title>
            </head>
            <body>
                <h1>Test webpay-nodejs: Pago Anulado:</h1>
                <p>${dataStr}</p>
                <hr/>
                <form action="/deshacerAnular" method="post">
                    <input type="hidden" name="nullifyAmount" value="${data.nullifiedAmount}">
                    <input type="hidden" name="buyOrder" value="${data.buyOrder}">
                    <input type="hidden" name="commerceId" value="${data.commerceId}">
                    <input type="submit" value="Deshacer anulacion">
                </form>
            </body>
        </html>`);
  }).catch(onError(res));
});

app.post('/deshacerAnular', (req, res) => {
  wp.oneclickmall.reverseNullification({
    buyOrder: req.body.buyOrder,
    commerceId: req.body.commerceId,
    nullifyAmount: parseInt(req.body.nullifyAmount)
  }).then((result) => {
    return res.send('Pago anulado revalidado:' + JSON.stringify(result));
  }).catch(onError(res));
});


app.listen(3000, () => {
  console.log('Server OK in http://localhost:3000');
});
