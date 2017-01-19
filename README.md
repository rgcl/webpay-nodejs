
#webpay-node

Módulo no oficial para integrar WebPay Plus en Node.js, con soporte para promesas.

#Instalación

```
npm install webpay-nodejs --save
```

#Transacción normal

La explicación detallada de los ejemplos de código está en /tests

1.  Instanciar

```js
const WebPay = require('webpay-nodejs');

let wp = new WebPay({
    commerceCode: youCommerceCode,
    publicKey: youPublicKey,
    privateKey: youPrivateKey,
    webpayKey: youWebpayKey
});
```

2. Iniciar Transacción

```js
wp.initTransaction({
    buyOrder: buyOrden,
    sessionId: req.sessionId,
    returnURL: url + '/verificar',
    finalURL: url + '/comprobante',
    amount: amount
}).then((data) => {
    res.redirect(data.url + '?token_ws=' + data.token);
})
```

3. Obtener datos de la transacción

```js
wp.getTransactionResult(token).then((transaccion) => {
    // datos de la transaccion
})
```

4. Aceptar la transacción

```js
wp.acknowledgeTransaction(token)
```

#Legalidades

La verificación del certificado único y especial de WebPay fue gracias a (FabianBravoA)[ttps://github.com/FabianBravoA/tbk_node].

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Licencia LGPL.