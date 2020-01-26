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

let transactions = {};
let transactionsByToken = {};
let app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const cert = require('./cert/normal');

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
        <title>Test webpay-nodejs</title>
    </head>
    <body>
        <h1>Test webpay-nodejs</h1>
        <form action="/pagar" method="post">
            <input type="number" min="10" placeholder="Monto a pagar" name="amount">
            <input type="submit" value="Pagar">
        </form>
    </body>
</html>`);
});

app.post('/pagar', (req, res) => {

  let buyOrden = Date.now();
  let amount = req.body.amount;
  transactions[buyOrden] = { amount: amount};
  let url = 'http://' + req.get('host');

  /**
   * 2. Enviamos una petición a Transbank para que genere
   * una transacción, como resultado tendremos un token y una url.
   *
   * Nuestra misión es redireccionar al usuario a dicha url y token.
   */
  wp.initTransaction({
    buyOrder: buyOrden,
    sessionId: req.sessionId,
    returnURL: url + '/verificar',
    finalURL: url + '/comprobante',
    amount: amount
  }).then((data) => {
    // Al ser un ejemplo, se está usando GET.
    // Transbank recomienda POST, el cual se debe hacer por el lado del cliente, obteniendo
    // esta info por AJAX... al final es lo mismo, así que no estresarse.
    res.redirect(data.url + '?token_ws=' + data.token);
  }).catch(onError(res));

});

app.post('/verificar', (req, res) => {

  let token = req.body.token_ws;
  let transaction;

  // Si toodo está ok, Transbank realizará esta petición para que le vuelvas a confirmar la transacción.

  /**
   * 3. Cuando el usuario ya haya pagado con el banco, Transbank realizará una petición a esta url,
   * porque así se definió en initTransaction
   */
  console.log('pre token', token);
  wp.getTransactionResult(token).then((transactionResult) => {
    transaction = transactionResult;
    transactions[transaction.buyOrder] = transaction;
    transactionsByToken[token] = transactions[transaction.buyOrder];

    console.log('transaction', transaction);
    /**
     * 4. Como resultado, obtendras transaction, que es un objeto con la información de la transacción.
     * Independiente de si la transacción fue correcta o errónea, debes siempre
     * hacer un llamado a acknowledgeTransaction con el token... Cosas de Transbank.
     *
     * Tienes 30 amplios segundos para hacer esto, sino la transacción se reversará.
     */
    console.log('re acknowledgeTransaction', token)
    return wp.acknowledgeTransaction(token);

  }).then((result2) => {
    console.log('pos acknowledgeTransaction', result2);
    // Si llegas aquí, entonces la transacción fue confirmada.
    // Este es un buen momento para guardar la información y actualizar tus registros (disminuir stock, etc).

    // Por reglamento de Transbank, debes retornar una página en blanco con el fondo
    // psicodélico de WebPay. Debes usar este gif: https://webpay3g.transbank.cl/webpayserver/imagenes/background.gif
    // o bien usar la librería.
    res.send(WebPay.getHtmlTransitionPage(transaction.urlRedirection, token));
  }).catch(onError(res));

});

app.post('/comprobante', (req, res) => {
    console.log('Mostrar el comprobante');
    const transaction = transactionsByToken[req.body.token_ws];
    let html;
    if (transaction) {
        // La transacción fue aprobada
        html = '<h1>Comprobante</h1>';
        html += JSON.stringify(transaction);
        html += '<hr>';
        html += '<form action="/anular" method="post">' +
                    '<input type="hidden" name="buyOrden" value="' + transaction.buyOrder + '">' +
                    '<input type="submit" value="Anular (Solo T. de Crédito)">' +
                '</form>';
    } else {
        // La transacción fue cancelada
        html = 'Transacción ' + req.body.TBK_ORDEN_COMPRA + ' cancelada';
    }
    return res.send(html);
});

app.post('/anular', (req, res) => { // Notar que WebPay no permite anular RedCompra. Solo tarjetas de crédito

  const transaction = transactions[req.body.buyOrden];

  wp.nullify({
    authorizationCode: transaction.detailOutput.authorizationCode,
    authorizedAmount: transaction.detailOutput.amount,
    nullifyAmount: transaction.detailOutput.amount,
    buyOrder: transaction.buyOrder
  }).then((result) => {
    console.log('anulación:', result);
    return res.send('Bla bla comprobante:' + JSON.stringify(transaction));
  }).catch(onError(res));
});


app.listen(3000, () => {
  console.log('Server OK in http://localhost:3000');
});