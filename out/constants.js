"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.ESDT_TRANSFER_VALUE = exports.ESDT_TRANSFER_FUNCTION_NAME = exports.ESDT_TRANSFER_GAS_LIMIT = exports.TRANSACTION_VERSION_TX_HASH_SIGN = exports.TRANSACTION_VERSION_DEFAULT = exports.TRANSACTION_OPTIONS_TX_HASH_SIGN = exports.TRANSACTION_OPTIONS_DEFAULT = void 0;
const JSONbig = require("json-bigint");
exports.TRANSACTION_OPTIONS_DEFAULT = 0;
exports.TRANSACTION_OPTIONS_TX_HASH_SIGN = 1;
exports.TRANSACTION_VERSION_DEFAULT = 1;
exports.TRANSACTION_VERSION_TX_HASH_SIGN = 2;
exports.ESDT_TRANSFER_GAS_LIMIT = 500000;
exports.ESDT_TRANSFER_FUNCTION_NAME = "ESDTTransfer";
exports.ESDT_TRANSFER_VALUE = "0";
exports.defaultConfig = {
    timeout: 1000,
    // See: https://github.com/axios/axios/issues/983 regarding transformResponse
    transformResponse: [
        function (data) {
            return JSONbig.parse(data);
        },
    ],
};
//# sourceMappingURL=constants.js.map