"use strict";

const soap = require('soap');
const select = require('xml-crypto').xpath;
const SignedXml = require('xml-crypto').SignedXml;
const DOMParser 				= require('xmldom').DOMParser;

const WebPayUniqueAndSpecialNonStandardWSSecurityCert = require('./WebPayUniqueAndSpecialNonStandardWSSecurityCert');


class WebPay {

    /**
     * Página de transición según dicta Transbank.
     * @param gifUrl? la url del gif de Transbank
     * @returns {string}
     */
    static getHtmlTransitionPage(gifUrl) {
        gifUrl = gifUrl || 'https://webpay3g.transbank.cl/webpayserver/imagenes/background.gif';
        return `<html><head><style>
        html,body { margin: 0; padding: 0; height: 100%; width: 100%; background: url(${gifUrl}); }
        </style></head><body></body></html>`;
    }

    /**
     *
     * @param {number} props.commerceCode
     * @param {string} props.publicKey
     * @param {string} props.privateKey
     * @param {string} props.webpayKey
     * @param {number} props.commerceCode el código del comercio
     */
    constructor(props) {
        this.wsdlUrl = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';
        this.commerceCode = props.commerceCode;
        this.publicKey = props.publicKey;
        this.privateKey = props.privateKey;
        this.webpayKey = props.webpayKey;

        let wsSecurity = new WebPayUniqueAndSpecialNonStandardWSSecurityCert(this.privateKey, this.publicKey, '', 'utf8', true);

        this._instantiatePromise = new Promise((resolve, reject) => {
            let options = {
                ignoredNamespaces: {
                    namespaces: [],
                    override: true
                }
            };
            soap.createClient(this.wsdlUrl, options, (err, client) => {
                if(err) {
                    return reject(err);
                }
                this._client = client;
                wsSecurity.promise().then(() => {
                    this._client.setSecurity(wsSecurity);
                    resolve();
                });
            });
        });
    }

    /**
     * Inicia ina transacción en WebPay
     *
     * @param {string} props.buyOrder Orden de compra de la tienda.
     * @param {string} props.sessionId Identificador de sesión, uso interno de comercio, este valor es
     * devuelto al final de la transacción.
     * @param {string} props.returnURL URL del comercio, a la cual Webpay redireccionará posterior al
     * proceso de autorización.
     * @param props.finalURL URL del comercio a la cual Webpay redireccionará posterior al
     * voucher de éxito de Webpay.
     * @param props.amount
     * @returns {Promise} { token, url }
     */
    initTransaction(props) {
        if(!props) {
            return Promise.reject(new Error('props param missing'));
        }
        let wsInitTransactionInput = {
            wSTransactionType: props.wsTransactionType || 'TR_NORMAL_WS',
            sessionId: props.sessionId,
            returnURL: props.returnURL,
            finalURL: props.finalURL,
            buyOrder: props.buyOrder,
            transactionDetails: {
                amount: props.amount,
                buyOrder: props.buyOrder,
                commerceCode: this.commerceCode
            }
        };

        return new Promise((resolve, reject) => {
            this._instantiatePromise.then(() => {
                this._client.WSWebpayServiceImplService.WSWebpayServiceImplPort.initTransaction({
                    wsInitTransactionInput: wsInitTransactionInput
                }, (err, result, raw, soapHeader) => {
                    if(err) {
                        return reject(err);
                    }
                    if(this._verifySignature(raw)) {
                        resolve(result.return);
                    } else {
                        reject(new Error('Invalid signature response'));
                    }
                });
            });
        });

    }

    /**
     *
     * @param {string} token token de la transacción, viene como token_ws tipo POST
     * @returns {Promise} promesa con la siguiente información:
     * - buyOrder Orden de compra de la tienda.
     * - sessionId Identificador de sesión, uso interno de comercio, este valor es devuelto al
     * final de la transacción.
     * - cardDetails Objeto que representa los datos de la tarjeta de crédito del tarjeta habiente.
     * - cardDetails.cardNumber 4 últimos números de la tarjeta de crédito del tarjeta habiente.
     * Solo para comercios autorizados por Transbank se envía el número completo
     * - cardDetails.cardExpirationDate (Opcional) Fecha de expiración de la tarjeta de crédito del tarjetahabiente.
     * Formato YYMM Solo para comercios autorizados por Transbank.
     * - accoutingDate Fecha de la autorización.
     * - transactionDate Fecha y hora de la autorización.
     * - VCI Resultado de la autenticación para comercios Webpay Plus y/o 3D Secure,
     * los valores posibles son los siguientes:
     * -- TSY: Autenticación exitosa
     * -- TSN: autenticación fallida.
     * -- TO: Tiempo máximo excedido para autenticación.
     * -- ABO: Autenticación abortada por tarjetahabiente.
     * -- U3: Error interno en la autenticación.
     * -- Puede ser vacío si la transacción no se autentico.
     * - urlRedirection URL de redirección para visualización de voucher.
     * - detailsOutput detailsOutput Objeto que contiene el detalle de la transacción financiera.
     * - detailsOutput.authorizationCode Código de autorización de la transacción
     * - detailsOutput.paymentTypeCode Tipo de pago de la transacción.
     * -- VD = Venta Debito
     * -- VN = Venta Normal
     * -- VC = Venta en cuotas
     * -- SI = 3 cuotas sin interés
     * -- S2=2 cuotas sin interés
     * -- NC = N Cuotas sin interés
     * - detailsOutput.responseCode Código de respuesta de la autorización. Valores posibles:
     * -- 0 Transacción aprobada.
     * -- -1 Rechazo de transacción.
     * -- -2 Transacción debe reintentarse.
     * -- -3 Error en transacción.
     * -- -4 Rechazo de transacción.
     * -- -5 Rechazo por error de tasa.
     * --  -6 Excede cupo máximo mensual.
     * -- -7 Excede límite diario por transacción.
     * -- -8 Rubro no autorizado.
     * - Amount Monto de la transacción
     * - sharesNumber Cantidad de cuotas
     * - commerceCode Código comercio de la tienda
     * - buyOrder Orden de compra de la tienda.
     */
    getTransactionResult(token) {
        if(!token) {
            return Promise.reject(new Error('token missing'));
        }
        return new Promise((resolve, reject) => {
            this._instantiatePromise.then(() => {
                this._client.WSWebpayServiceImplService.WSWebpayServiceImplPort.getTransactionResult({
                    tokenInput: token
                }, (err, result, raw, soapHeader) => {
                    if(err) {
                        return reject(err);
                    }
                    if(this._verifySignature(raw)) {
                        resolve(result.return);
                    } else {
                        reject(new Error('Invalid signature response'));
                    }
                });
            });
        });
    }

    /**
     * Luego de recibir getTransactionResult, se debe llamar en no más de 30 segundos.
     * @param token Token de la transacción.
     * @returns {Promise}
     */
    acknowledgeTransaction(token) {
        return new Promise((resolve, reject) => {
            this._instantiatePromise.then(() => {
                this._client.WSWebpayServiceImplService.WSWebpayServiceImplPort.acknowledgeTransaction({
                    tokenInput: token
                }, (err, result, raw, soapHeader) => {
                    if (err) {
                        return reject(err);
                    }
                    if (this._verifySignature(raw)) {
                        resolve(result);
                    } else {
                        reject(new Error('Invalid signature response'));
                    }
                });
            });
        });
    }

    _verifySignature(xml) {
        let doc = new DOMParser().parseFromString(xml)
        let signature 	= select(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0];
        let sig = new SignedXml();
        //Hack to check non-standard transbank SignedInfo node
        sig.validateSignatureValue = function() {
            let signedInfo = select(doc, "//*[local-name(.)='SignedInfo']");
            if (signedInfo.length==0) throw new Error("could not find SignedInfo element in the message");
            let signedInfoCanon = this.getCanonXml([this.canonicalizationAlgorithm], signedInfo[0]);
            signedInfoCanon   = signedInfoCanon.toString().replace("xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"", "xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"");
            let signer = this.findSignatureAlgorithm(this.signatureAlgorithm);
            let res = signer.verifySignature(signedInfoCanon, this.signingKey, this.signatureValue);
            if (!res) this.validationErrors.push("invalid signature: the signature value " + this.signatureValue + " is incorrect");
            return res
        };
        let webpayKey = this.webpayKey;
        sig.keyInfoProvider = {
            getKeyInfo: function(key, prefix) {
                prefix = prefix || '';
                prefix = prefix ? prefix + ':' : prefix;
                return "<" + prefix + "X509Data></" + prefix + "X509Data>";
            },
            getKey: function(keyInfo) {
                return webpayKey
            }
        };
        sig.loadSignature(signature);
        let res = sig.checkSignature(xml);
        if (!res) {
            throw new Error(sig.validationErrors.join('; '));
        }
        return res;
    }

}

module.exports = WebPay;