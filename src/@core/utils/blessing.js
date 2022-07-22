import { ethers } from 'ethers';
import {toLocaleDateFromBigInt} from 'src/@core/utils/date'
import {simpleShow, cryptoBlessingAdreess} from 'src/@core/components/wallet/address'
import {encode} from 'src/@core/utils/cypher'

export const getBlessingTitle = (description) => {
    if (description != undefined && description.length > 0) {
        return description.split('#')[0]
    }
}

export const getBlessingDesc = (description, omit = false) => {
    if (description != undefined && description.length > 0) {
        const apadteLength = 40
        let desc = description.split('#')[1]
        if (omit && desc.length > apadteLength) {
            return desc.substring(0, apadteLength) + '...'
        }
        
        return desc
    }
}

export const transBlesingsFromWalletBlessings = (sender, blessings) => {
    let newBlessings = []
    blessings.forEach(blessing => {
        newBlessings.push({
            code: blessing.blessingID,
            blessing: blessing.blessingImage,
            time: toLocaleDateFromBigInt(blessing.sendTimestamp.toString()),
            amount: parseFloat(ethers.utils.formatEther(blessing.tokenAmount)).toFixed(2),
            quantity: blessing.claimQuantity.toString(),
            type: blessing.claimType === 0 ? 'AVERAGE' : 'RANDOM',
            progress: '/claim?sender=' + encode(sender) + '&blessing=' + encode(blessing.blessingID),
            revoked: blessing.revoked
        })
    })

    return newBlessings.reverse()
}

export const transClaimBlesingsFromWalletBlessings = (blessings) => {
    let newBlessings = []
    blessings.forEach(blessing => {
        newBlessings.push({
            code: blessing.blessingID,
            blessing: blessing.blessingImage,
            sender: simpleShow(blessing.sender),
            time: toLocaleDateFromBigInt(blessing.claimTimestamp.toString()),
            amount: parseFloat(ethers.utils.formatEther(blessing.claimAmount)).toFixed(2),
            tax: parseFloat(ethers.utils.formatEther(blessing.taxAmount)).toFixed(2),
            progress: '/claim?sender=' + encode(blessing.sender) + '&blessing=' + encode(blessing.blessingID)
        })
    })

    return newBlessings.reverse()
}

export const transClaimListFromWalletClaims = (claims) => {
    let newClaims = []
    let claimedAmount = 0
    let luckyClaimer = {}
    let maxClaimAmount = 0.0
    claims.forEach(claim => {
        claimedAmount += parseFloat(ethers.utils.formatEther(claim.distributedAmount))
        if (parseFloat(ethers.utils.formatEther(claim.distributedAmount)) > maxClaimAmount) {
            maxClaimAmount = parseFloat(ethers.utils.formatEther(claim.distributedAmount))
            luckyClaimer = {
                claimer: simpleShow(claim.claimer),
                amount: ethers.utils.formatEther(claim.distributedAmount),
            }
        }
        newClaims.push({
            claimer: simpleShow(claim.claimer),
            time: toLocaleDateFromBigInt(claim.claimTimestamp.toString()),
            amount: ethers.utils.formatEther(claim.distributedAmount),
            CBTokenAwardToSenderAmount: claim.CBTokenAwardToSenderAmount.toString(),
        })
    })

    return {
        "claims": newClaims.reverse(),
        "claimedAmount": claimedAmount.toFixed(2),
        "luckyClaimer": luckyClaimer
    }
}
