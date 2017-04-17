"use strict";

const soap = require('soap');
const select = require('xml-crypto').xpath;
const SignedXml = require('xml-crypto').SignedXml;
const DOMParser = require('xmldom').DOMParser;
const Decimal = require('decimal.js-light');

const WebPayUniqueAndSpecialNonStandardWSSecurityCert = require('./WebPayUniqueAndSpecialNonStandardWSSecurityCert');


class WebPay {

    /**
     * Página de transición según dicta Transbank.
     * @param urlRedirection obtenido de detailOutput al hacer getTransactionResult
     * @param token_ws
     * @param gifUrl? la url del gif de Transbank
     * @returns {string}
     */
    static getHtmlTransitionPage(urlRedirection, token_ws, gifUrl) {
        gifUrl = gifUrl || 'data:image/gif;base64,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';
        return `<html><head><style>
        html,body { margin: 0; padding: 0; height: 100%; width: 100%; background-image: url(${gifUrl}); }
        form { display: none;}</style></head>
        <body onload="document.getElementById('form').submit();">
        <form action="${urlRedirection}" method="post" id="form"><input name="token_ws" value="${token_ws}"></form></body></html>`;
    }

    /**
     *
     * @param {number} props.commerceCode
     * @param {string} props.publicKey
     * @param {string} props.privateKey
     * @param {string} props.webpayKey
     * @param {number} props.commerceCode el código del comercio
     *
     * Las propiedades siguientes se ocupan para el método calcFees solamente:
     *
     * @param {number} props.creditFeePerc el porcentaje de comisión de transbank para ventas con crédito. Por defecto
     * es 2.95
     * @param {number} props.debitFeePerc el porcenaje de comisión de transbank para ventas con débito. Por defecto
     * es 1.49
     * @param {number} props.ivaFactor el factor a multiplicar la comisión para determinar el iva. Por defecto es 0.19
     */
    constructor(props) {
        this.wsdlUrl = 'https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl';
        this.commerceCode = props.commerceCode;
        this.publicKey = props.publicKey;
        this.privateKey = props.privateKey;
        this.webpayKey = props.webpayKey;
        this.creditFeePerc = props.creditFeePerc || 2.95;
        this.debitFeePerc = props.debitFeePerc || 1.49;
        this.ivaFactor = props.ivaFactor || 0.19;

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

    /**
     *
     * @param {number} transaction.amountClp el monto cobrado en la transaccion
     * @param {string} transaction.tbkTypeCode el valor depaymentTypeCode (al hacer getTransactionResult),
     * si es DV es redcompra (Débito).
     * @return {{clp: number, iva: number, total: number}}
     */
    calcFees(transaction) {

        const amount = new Decimal(transaction.amountClp);
        const feePerc = transaction.tbkTypeCode.toUpperCase() === 'DV' ? this.debitFeePerc : this.creditFeePerc;

        // el 2.95 por ciento.. es decir, amount * (2.95/100)
        let feeWebpay = amount.mul(feePerc).div(100).toDecimalPlaces(0);

        // No hay IVA para menos de 180 CLP https://www.chileatiende.gob.cl/fichas/ver/29234
        let iva = 0;
        if(feeWebpay.gte(180)) {
            iva = feeWebpay.mul(this.ivaFactor).toDecimalPlaces(0).toNumber();
        }

        const total = feeWebpay.plus(iva);

        return {
            clp: feeWebpay.toNumber(),
            iva: iva,
            total: total.toNumber()
        };

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