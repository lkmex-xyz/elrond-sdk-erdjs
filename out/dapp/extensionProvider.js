"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionProvider = void 0;
const signableMessage_1 = require("../signableMessage");
const signature_1 = require("../signature");
const transaction_1 = require("../transaction");
class ExtensionProvider {
    constructor() {
        this.popupName = "connectPopup";
        this.extensionId = "";
        this.extensionURL = "";
        this.initialized = false;
        if (ExtensionProvider._instance) {
            throw new Error("Error: Instantiation failed: Use ExtensionProvider.getInstance() instead of new.");
        }
        this.account = { address: "" };
        ExtensionProvider._instance = this;
        this.extensionPopupWindow = null;
    }
    static getInstance() {
        return ExtensionProvider._instance;
    }
    setAddress(address) {
        this.account.address = address;
        return ExtensionProvider._instance;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (window && window.elrondWallet) {
                this.extensionId = window.elrondWallet.extensionId;
                this.extensionURL = `chrome-extension://${this.extensionId}/index.html`;
                this.initialized = true;
            }
            return this.initialized;
        });
    }
    login(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error("Extension provider is not initialised, call init() first");
            }
            this.openExtensionPopup();
            const { token } = options;
            const data = token ? token : "";
            yield this.startExtMsgChannel("connect", data);
            return this.account.address;
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error("Extension provider is not initialised, call init() first");
            }
            try {
                yield this.startBgrMsgChannel("logout", this.account.address);
            }
            catch (error) {
                console.warn("Extension origin url is already cleared!", error);
            }
            return true;
        });
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error("Extension provider is not initialised, call init() first");
            }
            return this.account ? this.account.address : "";
        });
    }
    isInitialized() {
        return this.initialized;
    }
    isConnected() {
        return __awaiter(this, void 0, void 0, function* () {
            return !!this.account;
        });
    }
    sendTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.openExtensionPopup();
            const txResponse = yield this.startExtMsgChannel("sendTransactions", {
                from: this.account.address,
                transactions: [transaction.toPlainObject()],
            });
            return transaction_1.Transaction.fromPlainObject(txResponse[0]);
        });
    }
    sendTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.openExtensionPopup();
            return yield this.startExtMsgChannel("sendTransactions", {
                from: this.account.address,
                transactions,
            });
        });
    }
    signTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.openExtensionPopup();
            const txResponse = yield this.startExtMsgChannel("signTransactions", {
                from: this.account.address,
                transactions: [transaction.toPlainObject()],
            });
            return transaction_1.Transaction.fromPlainObject(txResponse[0]);
        });
    }
    signTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.openExtensionPopup();
            transactions = transactions.map((transaction) => transaction.toPlainObject());
            let txResponse = yield this.startExtMsgChannel("signTransactions", {
                from: this.account.address,
                transactions: transactions,
            });
            txResponse = txResponse.map((transaction) => transaction_1.Transaction.fromPlainObject(transaction));
            return txResponse;
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.openExtensionPopup();
            const data = {
                account: this.account.address,
                message: message.message.toString(),
            };
            const signResponse = yield this.startExtMsgChannel("signMessage", data);
            const signedMsg = new signableMessage_1.SignableMessage({
                address: message.address,
                message: Buffer.from(signResponse.message),
                signature: new signature_1.Signature(signResponse.signature),
            });
            return signedMsg;
        });
    }
    openExtensionPopup() {
        if (!this.initialized) {
            throw new Error("Extension provider is not initialised, call init() first");
        }
        const popupOptions = `directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,left=${window.screenX +
            window.outerWidth -
            375},screenY=${window.screenY}resizable=no,width=375,height=569`;
        this.extensionPopupWindow = window.open(this.extensionURL, this.popupName, popupOptions);
    }
    startBgrMsgChannel(operation, connectData) {
        return new Promise((resolve, reject) => {
            window.postMessage({
                target: "erdw-inpage",
                type: operation,
                data: connectData,
            }, window.origin);
            const eventHandler = (event) => {
                if (event.isTrusted &&
                    event.data.type &&
                    event.data.target === "erdw-contentScript") {
                    switch (event.data.type) {
                        case "logoutResponse":
                            window.removeEventListener("message", eventHandler);
                            resolve(true);
                            break;
                    }
                }
            };
            setTimeout(() => {
                reject("Extension logout response timeout. No response from extension.");
            }, 3000);
            window.addEventListener("message", eventHandler, false);
        });
    }
    startExtMsgChannel(operation, connectData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield new Promise((resolve, reject) => {
                let isResolved = false;
                const eventHandler = (event) => {
                    var _a, _b;
                    if (event.isTrusted &&
                        event.data.type &&
                        event.data.target === "erdw-extension") {
                        switch (event.data.type) {
                            case "popupReady":
                                event.ports[0].postMessage({
                                    target: "erdw-inpage",
                                    type: operation,
                                    data: connectData,
                                });
                                break;
                            case "connectResult":
                                this.account = event.data.data;
                                window.removeEventListener("message", eventHandler);
                                isResolved = true;
                                (_a = this.extensionPopupWindow) === null || _a === void 0 ? void 0 : _a.close();
                                resolve(event.data.data);
                                break;
                            default:
                                try {
                                    this.handleExtResponseErr(event);
                                }
                                catch (err) {
                                    reject(err.message);
                                }
                                window.removeEventListener("message", eventHandler);
                                isResolved = true;
                                (_b = this.extensionPopupWindow) === null || _b === void 0 ? void 0 : _b.close();
                                resolve(event.data.data);
                                break;
                        }
                    }
                };
                const windowCloseInterval = setInterval(() => {
                    var _a;
                    if ((_a = this.extensionPopupWindow) === null || _a === void 0 ? void 0 : _a.closed) {
                        clearInterval(windowCloseInterval);
                        if (!isResolved) {
                            window.removeEventListener("message", eventHandler);
                            reject("Extension window was closed without response.");
                        }
                    }
                }, 500);
                window.addEventListener("message", eventHandler, false);
            });
            return response;
        });
    }
    handleExtResponseErr(event) {
        if (!event.data && !event.data.data) {
            throw new Error("Extension response is empty.");
        }
        if (event.data.error) {
            throw new Error(event.data.error);
        }
        if (event.data.type === "transactionComplete" &&
            event.data.data.length === 0) {
            throw new Error("Transactions list response is empty.");
        }
    }
}
exports.ExtensionProvider = ExtensionProvider;
ExtensionProvider._instance = new ExtensionProvider();
//# sourceMappingURL=extensionProvider.js.map