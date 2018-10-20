
# webpay-nodejs

Módulo no oficial para integrar la API de WebPay, Anulaciones y OneClick de Transbank en 
Node.js, con soporte para promesas.

# Instalación

```
npm install webpay-nodejs
```

# Transacción normal

La explicación detallada de los ejemplos de código está en /showcase

1)  Instanciar

```js
const WebPay = require('webpay-nodejs');

let wp = new WebPay({
    commerceCode: youCommerceCode,
    publicKey: youPublicKey,
    privateKey: youPrivateKey,
    webpayKey: youWebpayKey,
    env: WebPay.ENV.INTEGRACION
});
```

2) Iniciar Transacción

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

3) Obtener datos de la transacción

```js
wp.getTransactionResult(token).then((transaccion) => {
    // datos de la transaccion
})
```

4) Aceptar la transacción

```js
wp.acknowledgeTransaction(token)
```


Opcionalmente; Anular
```js
wp.nullify({
authorizationCode: '123',
authorizedAmount: 2000,
buyOrder: buyOrder
})
```

Para los métodos de OneClick, usar `wp.oneclick.*`

# Versiones

## v1.2.0

* Se agregó soporte para WebPay OneClick
* Gracias a la observación de [Joaquin Gumucio L.](https://github.com/jjgumucio), se reemplazó
la dependencia de "ursa" por una versión pura en js "ursa-purejs", solucionando de esta forma
problemas en algunos equipos productos de usar una librería nativa. Ahora el código es 100% js.
* Se actualizaron los ejemplos, ahora están en el directorio showcase

## v1.0.0 (Breaking Changes)

* getTransactionResult retornaba transaction.detailOutput como un array con un único objeto
las propiedades, ahora transaction.detailOutput retorna directamente dicho objeto.

  * Ejemplo antes: transaction.detailOutput[0].amount
  * Ejemplo ahora: transaction.detailOutput.amount


# Legalidades

Agradecimientos a [FabianBravoA](https://github.com/FabianBravoA/tbk_node) por el algoritmo de verificación especial 
de Transbank.

Agradecimientos a [Leonardo Gatica](https://github.com/lgaticaq/tbk-oneclick) por descubrir el significado de
los códigos de respuesta de WebPay OneClick desde el número -8 al -1.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Licencia LGPL.

