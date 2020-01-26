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
/**
 * Clase basada en https://github.com/FabianBravoA/tbk_node
 */

const ursa = require('ursa-purejs2020');
const ejs = require('ejs');
const SignedXml = require('xml-crypto').SignedXml;
const uuid = require('uuid/v4');
const pem = require('pem');

const wsseSecurityHeader = `
<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" wsse:mustUnderstand="1">
  <KeyInfo>
    <X509Data>
      <X509IssuerSerial>
        <X509IssuerName><%-issuerName%></X509IssuerName>
        <X509SerialNumber><%-serialNumber%></X509SerialNumber>
      </X509IssuerSerial>
      <X509Certificate><%-cert%></X509Certificate>
    </X509Data>
  </KeyInfo>
</wsse:Security>
`;

const wsSecurituToken = `
<wsse:SecurityTokenReference>
    <X509Data xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <X509IssuerSerial>
        <X509IssuerName><%-issuerName%></X509IssuerName>
        <X509SerialNumber><%-serialNumber%></X509SerialNumber>
      </X509IssuerSerial>
      <X509Certificate><%-cert%></X509Certificate>
    </X509Data>
</wsse:SecurityTokenReference>
`;

const wsseSecurityHeaderTemplate = ejs.compile(wsseSecurityHeader);
const wsseSecurityTokenTemplate = ejs.compile(wsSecurituToken);

function insertStr(src, dst, pos) {
  return [dst.slice(0, pos), src, dst.slice(pos)].join('');
}

function generateId() {
  return uuid().replace(/-/gm, '');
}

class WebPayUniqueAndSpecialNonStandardWSSecurityCert {

  constructor(privatePEM, publicP12PEM,  encoding) {

    this._instantiatePromise = new Promise((resolve, reject) => {
      if (!ursa) {
        throw reject(new Error('Module ursa must be installed to use WebPayUniqueAndSpecialNonStandardWSSecurityCert'));
      }
      this.privateKey = ursa.createPrivateKey(privatePEM, null, encoding);
      this.publicP12PEM = publicP12PEM.toString().replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/(\r\n|\n|\r)/gm, '');

      this.signer = new SignedXml();
      this.signer.signingKey = this.privateKey.toPrivatePem();
      this.x509Id = "x509-" + generateId();

      pem.readCertificateInfo(publicP12PEM, (pemError, pemData) => {
        if(pemError) {
          return reject(pemError);
        }

        this.certSerial = "";
        if(!Number.isNaN(parseInt(pemData.serial.split(" ")[0])) && pemData.serial.indexOf(":") < 0) {
          this.certSerial = pemData.serial.split(" ")[0];
        } else {
          let tokens  = pemData.serial.split(":");
          for(let i = 0; i < tokens.length; ++i) {
            this.certSerial  += ""+parseInt("0x"+tokens[i]);
          }
        }
        this.issuer = "C="+pemData.issuer.country+",ST="+pemData.issuer.state+",O="+pemData.issuer.organization+",L="+pemData.issuer.locality+",CN="+pemData.commonName+",OU="+pemData.organizationUnit+",emailAddress="+pemData.emailAddress;

        let references = ["http://www.w3.org/2000/09/xmldsig#enveloped-signature",
          "http://www.w3.org/2001/10/xml-exc-c14n#"];

        this.signer.addReference("//*[local-name(.)='Body']", references);

        this.signer.keyInfoProvider = {};
        this.signer.keyInfoProvider.getKeyInfo = (key) => {
          return wsseSecurityTokenTemplate({
            cert: this.publicP12PEM,
            serialNumber: this.certSerial,
            issuerName: this.issuer
          });
        };
        resolve();
      });

    });
  }

  promise() {
    return this._instantiatePromise;
  }

  postProcess(xml) {

    let secHeader = wsseSecurityHeaderTemplate({
      cert: this.publicP12PEM,
      serialNumber: this.certSerial,
      issuerName: this.issuer
    });

    let xmlWithSec = insertStr(secHeader, xml, xml.indexOf('</soap:Header>'));

    this.signer.computeSignature(xmlWithSec);

    return insertStr(this.signer.getSignatureXml(), xmlWithSec, xmlWithSec.indexOf('</wsse:Security>'));
  }
}

module.exports = WebPayUniqueAndSpecialNonStandardWSSecurityCert;
