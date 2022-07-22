export const encode = (str) => {
    return Buffer.from(str).toString('base64')
}

export const decode = (str) => {
    if (str == undefined) {
        return ''
    }
    
    return Buffer.from(str, 'base64').toString('utf8')
}

export const toEthSignedMessageHash = (web3, messageHex) => {
    const messageBuffer = Buffer.from(messageHex.substring(2), 'hex');
    const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${messageBuffer.length}`);

    return web3.utils.sha3(Buffer.concat([prefix, messageBuffer]));
}