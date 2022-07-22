// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import { styled } from '@mui/material/styles'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box'
import {BUSD_ICON, CBT_ICON} from 'src/@core/components/wallet/crypto-icons'

import {amountShow} from 'src/@core/utils/amount'


import { useEffect, useState } from "react"

import { ethers } from 'ethers';
import { useWeb3React } from "@web3-react/core"
import BUSDContract from 'src/artifacts/contracts/TestBUSD.sol/BUSD.json'
import CBTContract from 'src/artifacts/contracts/CryptoBlessingToken.sol/CryptoBlessingToken.json'
import CBNFTContract from 'src/artifacts/contracts/CryptoBlessingNFT.sol/CryptoBlessingNFT.json'
import {BUSDContractAddress, CBTContractAddress, CBNFTContractAddress} from 'src/@core/components/wallet/address'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      color: theme.palette.common.black,
      backgroundColor: '#ede3ff'
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14
    }
  }))
  
const StyledTableRow = styled(TableRow)(({ theme }) => ({
'&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover
},

// hide last border
'&:last-of-type td, &:last-of-type th': {
    border: 0
}
}))


const Wallet = () => {

    const { active, account, chainId } = useWeb3React()

    const [BNBAmount, setBNBAmount] = useState(0)
    const [BUSDAmount, setBUSDAmount] = useState(0)
    const [CBTAmount, setCBAmount] = useState('')
    const [CBNFTItems, setCBNFTItems] = useState([])

    async function fetchERC20Amount() {
        if (active && chainId != 'undefined' && typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const busdContract = new ethers.Contract(BUSDContractAddress(chainId), BUSDContract.abi, provider.getSigner())
            const cbtContract = new ethers.Contract(CBTContractAddress(chainId), CBTContract.abi, provider.getSigner())
            const cbNFTContract = new ethers.Contract(CBNFTContractAddress(chainId), CBNFTContract.abi, provider.getSigner())
            provider.getSigner().getAddress().then(async (address) => {
                try {
                    setBNBAmount(amountShow(await provider.getBalance(address)))
                    setBUSDAmount(amountShow(await busdContract.balanceOf(address)))
                    setCBAmount(await cbtContract.balanceOf(address) + '')
                    setCBNFTItems(await cbNFTContract.getMyBlessingsURI())
                } catch (err) {
                    console.log("Error: ", err)
                }
            })
            
        }    
      }
    
      useEffect(() => {
        fetchERC20Amount()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [chainId, account])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12} sx={{ paddingBottom: 4 }}>
                <Typography variant='h5'>My Assets</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Card>
                    <CardHeader title='ERC-20 Tokens' titleTypographyProps={{ variant: 'h6' }} />
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 500 }} aria-label='customized table'>
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Assets</StyledTableCell>
                                    <StyledTableCell align='right'>Balance</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <StyledTableRow key='BNB'>
                                    <StyledTableCell component='th' scope='row'>
                                        <Chip variant="outlined" icon={<BUSD_ICON />} label="BNB" />
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>{BNBAmount}</StyledTableCell>
                                </StyledTableRow>
                                <StyledTableRow key='BUSD'>
                                    <StyledTableCell component='th' scope='row'>
                                        <Chip variant="outlined" icon={<BUSD_ICON />} label="BUSD" />
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>{BUSDAmount}</StyledTableCell>
                                </StyledTableRow>
                                <StyledTableRow key='CBT'>
                                    <StyledTableCell component='th' scope='row'>
                                        <Chip variant="outlined" icon={<CBT_ICON />} label="CBT" />
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>{CBTAmount}</StyledTableCell>
                                </StyledTableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
                <Card>
                    <CardContent>
                        <Typography variant='caption'>You can buy BNB on <Link target='_blank' href='https://www.binance.com/en/buy-BNB'>Binance</Link></Typography>
                        <Typography variant='caption'>, or exchange BUSD on <Link target='_blank' href='https://pancakeswap.finance/swap?outputCurrency=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'>PancakeSwap</Link></Typography>
                    </CardContent>
                </Card>
                
            </Grid>
            <Grid item xs={12} sm={6}>
                <Card>
                    <CardHeader title='ERC-721 Tokens' titleTypographyProps={{ variant: 'h6' }} />
                    <CardContent>
                        { CBNFTItems.length > 0 ?
                        <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
                        {CBNFTItems.map((item, index) => (
                            <ImageListItem key={item + '-' + index}>
                            <img
                                src={`${process.env.vultr_cdn_path + item}?w=164&h=164&fit=crop&auto=format`}
                                srcSet={`${process.env.vultr_cdn_path + item}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                alt={item}
                                loading="lazy"
                            />
                            </ImageListItem>
                        ))}
                        </ImageList>
                        :
                        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Typography  variant="overline" display="block" gutterBottom>
                                You don't have claimed any CryptoBlessing NFT yet!
                            </Typography>
                        </Box>
                        }

                    </CardContent>
                    
                </Card>
            </Grid>
        </Grid>
    )
}

export default Wallet
