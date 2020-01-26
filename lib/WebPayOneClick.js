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

class WebPayOneClick {

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
   * transacción de inscripción y una URL (UrlWebpay), que corresponde a la
   * URL de inscripción de One Click.
   * Una vez que se llama a este servicio Web, el usuario debe ser
   * redireccionado vía POST a urlWebpay con parámetro TBK_TOKEN igual al
   * token obtenido.
   *
   * @param {object} props
   * @param {string} props.username
   * @param {string} props.email
   * @param {string} props.responseUrl
   *
   * @return {Promise<{token, urlWebpay}>}
   */
  initInscription(props) {
    this.verbose && console.log('oneclick.initInscription:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclick').then((client) => {

        client.initInscription({
          arg0: {
            username: props.username,
            email: props.email,
            responseURL: props.responseUrl
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclick.initInscription:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclick.initInscription:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclick.initInscription: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        })
      }).catch(reject);
    });
  }

  /**
   * Permite finalizar el proceso de inscripción del tarjetahabiente en
   * Oneclick. Entre otras cosas, retorna el identificador del usuario en
   * Oneclick, el cual será utilizado para realizar las transacciones de pago.
   * Una vez terminado el flujo de inscripción en Transbank el usuario es
   * enviado a la URL de fin de inscripción que definió el comercio. En ese
   * instante el comercio debe llamar a finishInscription.
   *
   * @param {string} token el token TBK_TOKEN (post)
   *
   * @return {Promise<{responseCode, authCode, creditCardType, last4CardDigits, tbkUser}>}
   *
   * responseCode: Código de retorno del proceso de inscripción, donde 0 (cero) es aprobado.
   * authCode: Código que identifica la autorización de la inscripción.
   * creditCardType: Indica el tipo de tarjeta que fue inscrita por el cliente ( Visa, AmericanExpress, MasterCard, Diners, Magna)
   * last4CardDigits: Los últimos 4 dígitos de la tarjeta ingresada por el cliente en la inscripción.
   * tbkUser: Identificador único de la inscripción del cliente, este debe ser usado para realizar pagos, o borrar la inscripción.
   */
  finishInscription(token) {
    this.verbose && console.log('oneclick.finishInscription:parameters', token);
    if(!token) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclick').then((client) => {

        client.finishInscription({
          arg0: {
            token: token
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclick.finishInscription:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclick.finishInscription:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclick.finishInscription: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        })
      }).catch(reject);
    });
  }

  /**
   * En el caso que el comercio requiera eliminar la inscripción de un usuario en Webpay OneClick ya sea
   * por la eliminación de un cliente en su sistema o por la solicitud de este para no operar con esta
   * forma de pago, el comercio deberá consumir un servicio web de Transbank con el identificador de
   * usuario entregado en la inscripción.
   *
   * @param {object} props
   * @param {string} props.tbkUser Identificador único de la inscripción del cliente.
   * @param {string} props.username Nombre de usuario, del cliente, en el sistema del comercio.
   *
   * @return {Promise<boolean>} Retorno verdadero, si fue posible eliminar la inscripción. Falso de lo contrario.
   */
  removeUser(props) {
    this.verbose && console.log('oneclick.removeUser:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclick').then((client) => {

        client.removeUser({
          arg0: {
            tbkUser: props.tbkUser,
            username: props.username
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclick.removeUser:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclick.removeUser:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclick.removeUser: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

  /**
   * Permite realizar transacciones de pago. Retorna el resultado de la
   * autorización. Este método que debe ser ejecutado, cada vez que el
   * usuario selecciona pagar con Oneclick.
   *
   * @param {object} props
   * @param {number} props.amount Monto del pago en pesos.
   * @param {string} props.tbkUser
   * @param {string} props.username
   * @param {int} props.buyOrder Identificador único de la compra generado por el comercio. Debe ser
   *      timestamp [yyyymmddhhMMss] + un correlativo de tres dígitos.
   *      Ej: Para la tercera transacción realizada el día 15 de julio de 2011 a las
   *      11:55:50 la orden de compra sería: 20110715115550003. (.... lo sé ¬¬*)
   *
   * @return {Promise<{responseCode, authCode, last4CardDigits, creditCardType, transactionId}>}
   *
   * responseCode: Código de retorno del proceso de pago, donde:
   *          0 (cero) es aprobado.
   *          -1 Rechazo
   *          -2 Rechazo
   *          -3 Rechazo
   *          -4 Rechazo
   *          -5 Rechazo
   *          -6 Rechazo
   *          -7 Rechazo
   *          -8 Rechazo
   *          -97 limites Oneclick, máximo monto diario de pago excedido
   *          -98 limites Oneclick, máximo monto de pago excedido
   *          -99 limites Oneclick, máxima cantidad de pagos diarios excedido
   * responseCodeLocaleSpanish: lo mismo que lo anterior, pero en palabras
   * authCode: Código de autorización de la transacción de pago.
   * last4CardDigits: Los últimos 4 dígitos de la tarjeta ingresada por el cliente en la inscripción.
   * creditCardType: Indica el tipo de tarjeta que fue inscrita por el cliente ( Visa, AmericanExpress, MasterCard, Diners, Magna)
   * transactionId: Identificador único de la transacción de pago, se utiliza para la reversa, si fuera necesario.
   */
  authorize(props) {
    this.verbose && console.log('oneclick.authorize:parameters', props);
    if(!props) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclick').then((client) => {

        client.authorize({
          arg0: {
            amount: props.amount,
            tbkUser: props.tbkUser,
            username: props.username,
            buyOrder: props.buyOrder
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclick.authorize:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclick.authorize:result:', result);
          if(this.webpay._verifySignature(raw)) {
            result.return.responseCodeLocaleSpanish = AUTHORIZE_RESULT_CODE[result.return.responseCode];
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclick.authorize: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

  /**
   *
   * Este proceso permite reversar una venta cuando esta no pudo concretarse, dentro del mismo día
   * contable, con la finalidad de anular un cargo realizado al cliente.
   * El comercio, en caso de requerir reversar un pago, debe consumir un servicio web publicado por
   * Transbank con el identificador del pago entregado en la respuesta de la autorización de la transacción
   *
   * Permite reversar una transacción de venta autorizada con anterioridad.
   * Este método retorna como respuesta un identificador único de la
   * transacción de reversa.
   *
   * @param {int} buyOrder
   *
   * @return {Promise<{reverseCode, reversed}>}
   * reverseCode: el código de la reversa. El código regresado por este método, es un identificador único de la transacción de reversa.
   * reversa: true si se hizo, false si no se hizo
   */
  codeReverseOneClick(buyOrder) {
    this.verbose && console.log('oneclick.codeReverseOneClick:parameters', buyOrder);
    if(!buyOrder) {
      return Promise.reject(new Error('props param missing'));
    }

    return new Promise((resolve, reject) => {
      this.webpay._getClient('oneclick').then((client) => {

        client.codeReverseOneClick({
          arg0: {
            buyorder: buyOrder
          }
        }, (err, result, raw, soapHeader) => {
          if(err) {
            this.verbose && console.log('oneclick.codeReverseOneClick:error!', err);
            return reject(err);
          }
          this.verbose && console.log('oneclick.codeReverseOneClick:result:', result);
          if(this.webpay._verifySignature(raw)) {
            resolve(result.return);
          } else {
            this.verbose && console.log('oneclick.codeReverseOneClick: result doesn\'t have a valid signature!');
            reject(new Error('Invalid signature response'));
          }
        });
      }).catch(reject);
    });
  }

}

module.exports = WebPayOneClick;