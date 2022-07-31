import { ethers } from 'ethers';
import {toLocaleDateFromBigInt} from 'src/@core/utils/date'
import {simpleShowNear, cryptoBlessingAdreess} from 'src/@core/components/wallet/address'
import {encode} from 'src/@core/utils/cypher'
import * as nearAPI from 'near-api-js';

const { utils } = nearAPI;

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
    console.log('transBlesingsFromWalletBlessings', blessings)
    let newBlessings = []
    blessings.forEach(blessing => {
        newBlessings.push({
            code: blessing.blessing_id,
            blessing: blessing.blessing_image,
            time: toLocaleDateFromBigInt(blessing.send_timestamp/1000000000),
            amount: parseFloat(utils.format.formatNearAmount(blessing.token_amount)).toFixed(2),
            quantity: blessing.claim_quantity.toString(),
            type: blessing.claim_type,
            progress: '/claim?sender=' + encode(sender) + '&blessing=' + encode(blessing.blessing_id),
            revoked: blessing.revoked
        })
    })

    return newBlessings.reverse()
}

export const transClaimBlesingsFromWalletBlessings = (blessings) => {
    let newBlessings = []
    blessings.forEach(blessing => {
        newBlessings.push({
            code: blessing.blessing_id,
            blessing: blessing.blessing_image,
            sender: blessing.sender,
            time: toLocaleDateFromBigInt(blessing.claim_timestamp/1000000000),
            amount: parseFloat(utils.format.formatNearAmount(blessing.claim_amount)).toFixed(2),
            tax: parseFloat(utils.format.formatNearAmount(blessing.tax_amount)).toFixed(2),
            progress: '/claim?sender=' + encode(blessing.sender) + '&blessing=' + encode(blessing.blessing_id)
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
        claimedAmount += parseFloat(utils.format.formatNearAmount(claim.distributed_amount))
        if (parseFloat(utils.format.formatNearAmount(claim.distributed_amount)) > maxClaimAmount) {
            maxClaimAmount = parseFloat(utils.format.formatNearAmount(claim.distributed_amount))
            luckyClaimer = {
                claimer: claim.claimer,
                amount: utils.format.formatNearAmount(claim.distributed_amount),
            }
        }
        newClaims.push({
            claimer: claim.claimer,
            time: toLocaleDateFromBigInt(claim.claim_timestamp/1000000000),
            amount: utils.format.formatNearAmount(claim.distributed_amount),
            CBTokenAwardToSenderAmount: parseFloat(utils.format.formatNearAmount(claim.cbt_token_reward_to_sender_amount)).toFixed(2),
        })
    })

    return {
        "claims": newClaims.reverse(),
        "claimedAmount": claimedAmount.toFixed(2),
        "luckyClaimer": luckyClaimer
    }
}
