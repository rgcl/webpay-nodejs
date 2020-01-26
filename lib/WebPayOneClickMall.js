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
const WebPay = require('./WebPay');

// Gracias a https://github.com/lgaticaq/tbk-oneclick/blob/master/src/response.js#L8-L21 por ahorrar tipeo <3
const AUTHORIZE_RESULT_CODE = {
  '0': 'Aprobado.',
  '-1': 'La transacción ha sido rechazada.',
  '-2': 'La transacción ha sido rechazada, por favor intente nuevamente.',
  '-3': 'Ha ocurrido un error al hacer la transacción.',
  '-4': 'La transacción ha sido rechazada.',
  '-5': 'La transacción ha sido rechazada porque la tasa es inválida.',
  '-6': 'Ha alcanzado el límite de transacciones mensuales.',
  '-7': 'Ha alcanzado el límite de transacciones diarias.',
  '-8': 'La transacción ha sido rechazada, el rubro es inválido.',
  '-97': 'Ha alcanzado el máximo monto diario de pagos.',
  '-98': 'La transacción ha sido rechazada porque ha excedido el máximo monto de pago.',
  '-99': 'La transacción ha sido rechazada porque ha excedido la máxima cantidad de pagos diarias.'
};

class WebPayOneClickMall {

  /**
   *
   * @param {WebPay} webpay
   */
  constructor(webpay) {
    this.webpay = webpay;
    this.verbose = webpay.verbose;
  }

  /**
   * Permite realizar la inscripción del tarjetahabiente e información de su
   * tarjeta de crédito. Retorna como respuesta un token que representa la
   * transacción de inscripción y una URL (urlInscriptionForm), que corresponde a la
   * URL de inscripción de Oneclick Mall.
   * Una vez que se llama a este servicio Web, el usuario debe ser
   * redireccionado vía POST a urlInscriptionForm con parámetro TBK_TOKEN igual al
   * token obtenido.
   *
   * @param {object} props
   * @param {string} props.username
   * @param {string} props.email
   * @param {string} props.returnUrl
   *
   * @return {Promise<{token, urlInscriptionForm}>}
   *
   * token:
   * urlInscriptionForm:
   */
  initInscription(props) {
    this.verbose && console.log('oneclickmall.initInscription:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.initInscription({
          input: {
            username: props.username,
            email: props.email,
            returnUrl: props.returnUrl
          }
        }, (err, result, raw, soapHeader) => {
          //console.log('lastrequest initInscription: ', client.lastRequest);
          if(err) {
            this.verbose && console.log('oneclickmall.initInscription:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.initInscription:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.initInscription: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      });
    });
  }

  /**
   * Permite finalizar el proceso de inscripción del tarjetahabiente en
   * Oneclick Mall. Entre otras cosas, retorna el identificador del usuario en
   * Oneclick Mall, el cual será utilizado para realizar las transacciones de pago.
   * Una vez terminado el flujo de inscripción en Transbank el usuario es
   * enviado a la URL de fin de inscripción que definió el comercio. En ese
   * instante el comercio debe llamar a finishInscription.
   *
   * @param {string} token el token TBK_TOKEN (post)
   *
   * @return {Promise<{responseCode, authorizationCode, cardType, cardNumber, cardExpirationDate, cardOrigin, tbkUser}>}
   *
   * responseCode: Código de retorno del proceso de inscripción, donde 0 (cero) es aprobado.
   * authorizationCode: Código que identifica la autorización de la inscripción.
   * cardType: Indica la marca de la tarjeta de crédito que fue inscrita por el cliente (Visa, AmericanExpress, MasterCard, Diners, Magna).
   * cardNumber: Indica los últimos 4 dígitos y/o BIN de la tarjeta de crédito utilizada.
   * cardExpirationDate: Indica la fecha de expiración de la tarjeta de crédito utilizada.
   * cardOrigin: Indica si la tarjeta de crédito utilizada es nacional (NATIONAL_CARD) o extranjera (FOREIGN_CARD).
   * tbkUser: Identificador único de la inscripción del cliente, este debe ser usado para realizar pagos, o borrar la inscripción.
   */
  finishInscription(token) {
    this.verbose && console.log('oneclickmall.finishInscription:parameters', token);
    if(!token) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.finishInscription({
          input: {
            token: token
          }
        }, (err, result, raw, soapHeader) => {
          //console.log('lastrequest finishInscription: ', client.lastRequest);
          if(err) {
            this.verbose && console.log('oneclickmall.finishInscription:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.finishInscription:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.finishInscription: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

  /**
   * En el caso que el comercio requiera eliminar la inscripción de un usuario en Webpay Oneclick Mall, ya sea
   * por la eliminación de un cliente en su sistema o por la solicitud de este para no operar con esta
   * forma de pago, el comercio deberá consumir un servicio web de Transbank con el identificador de
   * usuario entregado en la inscripción.
   *
   * @param {object} props
   * @param {string} props.tbkUser Identificador único de la inscripción del cliente.
   * @param {string} props.username Nombre de usuario, del cliente, en el sistema del comercio.
   *
   * @return {Promise<{result}>}
   *
   * result: Es verdadero si fue posible eliminar la inscripción o falso en caso contrario.
   */
  removeInscription(props) {
    this.verbose && console.log('oneclickmall.removeInscription:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.removeInscription({
          input: {
            tbkUser: props.tbkUser,
            username: props.username
          }
        }, (err, result, raw, soapHeader) => {
          //console.log('lastrequest removeInscription: ', client.lastRequest);
          if(err) {
            this.verbose && console.log('oneclickmall.removeInscription:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.removeInscription:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.removeInscription: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

  /**
   * Permite realizar transacciones de pago. Retorna el resultado de la
   * autorización. Este método que debe ser ejecutado, cada vez que el
   * usuario selecciona pagar con Oneclick Mall.
   * Una autorización Webpay Oneclick Mall puede estar asociada a multiples comercios hijos.
   *
   * @param {object} props
   * @param {string} props.tbkUser
   * @param {string} props.username
   * @param {int} props.buyOrder Identificador único de la compra generado por el comercio padre. Debe ser
   *      timestamp [yyyymmddhhMMss] + un correlativo de tres dígitos.
   *      Ej: Para la tercera transacción realizada el día 15 de julio de 2011 a las
   *      11:55:50 la orden de compra sería: 20110715115550003. (.... lo sé ¬¬*)
   * @param {object} props.storesInput Lista de comercios hijos.
   * @param {number} props.storesInput.commerceId Código de comercio del comercio hijo.
   * @param {number} props.storesInput.buyOrder Identi cador único de la compra generado por el comercio
   *      hijo (tienda). Debe ser timestamp [yyyymmddhhMMss] + un correlativo de tres dígitos.
   * @param {number} props.storesInput.amount Monto de la sub-transacción de pago. En pesos o dólares según
   *      con guración comercio padre.
   * @param {number} props.storesInput.sharesNumber Cantidad de cuotas de la sub-transacción de pago.
   *      Cualquier valor distinto de número, incluyendo letras, inexistencia del campo o nulo, será asumido
   *      como cero, es decir “Sin cuotas”.
   *
   * @return {Promise<{commerceId, buyOrder, settlementDate, authorizationDate, storesOutput:[{commerceId, buyOrder, amount, paymentType, sharesNumber, shareAmount, authorizationCode, responseCode}, ... ]}>}
   *
   * commerceId: Código de comercio del comercio padre.
   * buyOrder: Orden de compra generada por el comercio padre.
   * settlementDate: Fecha contable de la autorización del pago.
   * authorizationDate: Fecha completa (timestamp) de la autorización del pago.
   * storesOutput: Lista de comercios hijos.
   * storesOutput.commerceId: Código de comercio del comercio hijo (tienda).
   * storesOutput.buyOrder: Orden de compra generada por el comercio hijo para la sub-transacción de pago.
   * storesOutput.amount: Monto de la sub-transacción de pago.
   * storesOutput.paymentType: Tipo (VC, NC, SI, etc.) de la sub-transacción de pago.
   * storesOutput.sharesNumber: Cantidad de cuotas de la sub-transacción de pago.
   * storesOutput.shareAmount: Monto por cuota de la sub-transacción de pago.
   * storesOutput.authorizationCode: Código de autorización de la sub-transacción de pago.
   * storesOutput.responseCode: Código de retorno del proceso de pago, donde:
   *          0 (cero) es aprobado.
   *          -1 Rechazo.
   *          -2 Rechazo.
   *          -3 Rechazo.
   *          -4 Rechazo.
   *          -5 Rechazo.
   *          -6 Rechazo.
   *          -7 Rechazo.
   *          -8 Rechazo.
   *          -97 limites OneClick Mall: máximo monto acumulado de pagos diarios excedido.
   *          -98 limites OneClick Mall: máximo monto unitario de pago excedido.
   *          -99 limites OneClick Mall: máxima cantidad de transacciones diarias excedida.
   */
  authorize(props) {
    this.verbose && console.log('oneclickmall.authorize:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }
    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.authorize({
          input: {
            username: props.username,
            tbkUser: props.tbkUser,
            buyOrder: props.buyOrder,
            storesInput: props.storesInput
          }
        }, (err, result, raw, soapHeader) => {
          //console.log('lastrequest authorize: ', client.lastRequest);
          if(err) {
            this.verbose && console.log('oneclickmall.authorize:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.authorize:result:', result);
          if(this.webpay._verifySignature(raw)) {
            for (let i = 0, len = result.return.storesOutput.length; i < len; i++) {
              result.return.storesOutput[i].responseCodeLocaleSpanish = AUTHORIZE_RESULT_CODE[result.return.storesOutput[i].responseCode];
            }
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.authorize: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

  /**
   *
   * Este proceso permitirá reversar un pago OneClick Mall cuando existan problemas operacionales
   * (lado comercio) o de comunicación entre comercio y Transbank que impidan recibir a tiempo la
   * respuesta de una autorización. Como en este último caso el comercio no conoce el resultado de
   * la autorización, debe intentar reversar la transacción de autorización para evitar un posible
   * descuadre entre comercio y Transbank.
   *
   * Para llevar a cabo la reversa, el comercio debe consumir un servicio web publicado por Transbank
   * con la orden de compra (generada por el comercio padre) del pago realizado.
   * Cabe destacar que la reversa siempre actuará sobre el listado completo bajo la orden de compra
   * padre.
   *
   * @param {int} buyOrder Orden de compra generada por el comercio padre, para la transacción de pago a reversar.
   *
   * @return {Promise<{storesReverse:[{commerceId, buyOrder, reversed, reverseCode}, ... ]}>}
   *
   * storesReverse: Lista de comercios hijos reversados.
   * storesReverse.commerceId: Código de comercio del comercio hijo (tienda).
   * storesReverse.buyOrder: Orden de compra generada por el comercio hijo para la sub-transacción de pago.
   * storesReverse.reversed: Boolean que indica si la reversa se realizó correctamente o no.
   * storesReverse.reverseCode: Identidficador único de la transacción de reversa.
   */
  reverse(buyOrder) {
    this.verbose && console.log('oneclickmall.reverse:parameters', buyOrder);
    if(!buyOrder) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.reverse({
          input: {
            buyOrder: buyOrder
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclickmall.reverse:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.reverse:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.reverse: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }


  /**
   *
   * Este proceso permitirá reversar un pago OneClick Mall cuando existan problemas operacionales
   *
   *
   * @param {int} buyOrder Orden de compra generada por el comercio hijo, para la sub-transacción de pago a anular.
   * @param {int} authorizedAmount Monto de la sub-transacción de pago a anular.
   * @param {int} authorizationCode Código de autorización de la sub-transacción de pago a anular.
   * @param {int} nullifyAmount Monto a anular de la sub-transacción de pago. Puede ser un monto parcial o monto total.
   *
   * @return {Promise<{token, buyOrder, commerceId, authorizationCode, authorizationDate, nullifiedAmount, balance}>}
   *
   * token: Identificador único de la transacción de anulación.
   * buyOrder: Orden de compra de la sub-transacción de pago anulada.
   * commerceId: Código de comercio del comercio hijo (tienda).
   * authorizationCode: Código de autorización de la transacción de anulación.
   * authorizationDate: Fecha de la autorización de la transacción de anulación.
   * nullifiedAmount: Monto anulado.
   * balance: Monto restante de la sub-transacción de pago original: monto inicial – monto anulado.
   */
  nullify(props) {
    this.verbose && console.log('oneclickmall.nullify:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.nullify({
          input: {
            commerceId: props.commerceId,
            buyOrder: props.buyOrder,
            authorizedAmount: props.authorizedAmount,
            authorizationCode: props.authorizationCode,
            nullifyAmount: props.nullifyAmount
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclickmall.reverse:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.reverse:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.reverse: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }


  /**
   *
   * Este proceso permitirá reversar un pago OneClick Mall cuando existan problemas operacionales
   *
   * @param {int} buyOrder Orden de compra generada por el comercio hijo, para la sub-transacción de pago anulada.
   * @param {int} commerceId Código de comercio del comercio hijo (tienda).
   * @param {int} nullifyAmount Monto anulado en la transacción de anulación que se intenta reversar.
   *
   * @return {Promise<{reversed, reverseCode}>}
   *
   * reversed: Boolean que indica si la reversa se realizó correctamente o no.
   * reverseCode: Identificador único de la transacción de reversa.
   */
  reverseNullification(props) {
    this.verbose && console.log('oneclickmall.reverseNullification:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclickmall').then((client) => {

        client.reverseNullification({
          input: {
            buyOrder: props.buyOrder,
            commerceId: props.commerceId,
            nullifyAmount: props.nullifyAmount
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclickmall.reverseNullification:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclickmall.reverseNullification:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclickmall.reverseNullification: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }
}

module.exports = WebPayOneClickMall;
