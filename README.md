
# webpay-nodejs

Módulo no oficial para integrar la API de WebPay, Anulaciones y OneClick de Transbank en 
Node.js, con soporte para promesas.

# Instalación

```
npm install webpay-nodejs
```

# Transacción normal

> Revisa el directorio /showcase para ver ejemplos funcionando
> `$ node showcase/test<DesiredTest>`

1)  Instanciar

```js
const WebPay = require('webpay-nodejs');

let wp = new WebPay({
    commerceCode: youCommerceCode,
    publicKey: youPublicKey, // .cert file
    privateKey: youPrivateKey, // .key file
    webpayKey: youWebpayKey, // .pem file
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


Opcionalmente, anular
```js
wp.nullify({
    authorizationCode: '123',
    authorizedAmount: 2000,
    buyOrder: buyOrder
})
```

Para los métodos de OneClick, usar `wp.oneclick.*` y `wp.onclickmall.*` respectivamente.

# Changelog

# v1.4.0
> Las versiones anteriores tienen problemas de seguridad en sus dependencias. Se recomienda actualizar 
> a ésta versión como punto mínimo.

* Se agregaron dependencias faltantes (ejs). Notificado por [ffflabs](https://github.com/ffflabs) (#15).
* Se agregó una versión propia de ursa, y actualización de soap. Ahora la instalación no tiene problemas de 
seguridad. Gracias [nicolaslopezj](https://github.com/nicolaslopezj) (#20).
* Se corrigieron problemas en los ejemplos. Gracias [DiruzCode](https://github.com/DiruzCode) (#17), 
[Rubenazo](https://github.com/DiruzCode) (#9).
* Agregado soporte parcial para pagos diferidos (Falta documentación). [BluebambooSRL](https://github.com/BluebambooSRL) (#11).
* Se agregó más formalismo en la licencia (archivos COPYING, COPYING.LESEER). La licencia sigue siendo la misma, LGPL.

## v1.3.0

* Se agregó soporte para WebPay OneClick Mall. Gracias [Alonso Gaete](https://github.com/alogaete)! (#6).
* Correcciones menores internas al manejo de errores (no implica cambios en la API).
* Los ejemplos ahora manejan los errores (solo a modo de demostración).
* Se actualizaron los certificados de WebPay Normal.
* Se eliminaron dependencias sin uso. 

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

Éste código se distribuye con la licencia libre LGPL. Revisar COPYING.LESSER para detalles.
