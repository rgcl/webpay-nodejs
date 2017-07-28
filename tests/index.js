"use strict";

const WebPay = require('../lib/webpay');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

let transactions = {};
let app = express();
app.use(bodyParser.urlencoded({ extended: true }))

let publicKey = fs.readFileSync(__dirname + '/cert/597020000541.crt');
let privateKey = fs.readFileSync(__dirname + '/cert/597020000541.key');
let webpayKey = fs.readFileSync(__dirname + '/cert/tbk.pem');

/**
 * 1. Instanciamos la clase WebPay.
 *
 * Notar que los certificados sin simples strings, no buffer de archivos ni nada esotérico o místico.
 *
 * @type {WebPay}
 */
let wp = new WebPay({
    commerceCode: 597020000541,
    publicKey: publicKey,
    privateKey: privateKey,
    webpayKey: webpayKey,
    verbose: true
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
    });

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
    });
    
});

app.post('/comprobante', (req, res) => {
    console.log('Mostrar el comprobante');
});


app.listen(3000, () => {
    console.log('Server OK')
});