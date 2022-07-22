import { ethers } from 'ethers';

export const amountShow = (amount) => {
    if (amount == undefined) {
        return ''
    }

    return parseFloat(ethers.utils.formatEther(amount)).toFixed(2)
}