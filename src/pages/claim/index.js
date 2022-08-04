// ** React Imports
import { useEffect, useState } from "react"

// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { styled } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Icon from '@material-ui/core/Icon';
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import {BUSD_ICON, CBT_ICON} from 'src/@core/components/wallet/crypto-icons'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';
import CardMedia from '@mui/material/CardMedia'
import CircularProgress from '@mui/material/CircularProgress';
import Badge from '@mui/material/Badge';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { green } from '@mui/material/colors';

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import {decode, toEthSignedMessageHash} from 'src/@core/utils/cypher'

import CryptoBlessing from 'src/artifacts/contracts/CryptoBlessing.sol/CryptoBlessing.json'
import {transClaimListFromWalletClaims } from 'src/@core/utils/blessing'
import {getProviderUrl, simpleShowNear, cryptoBlessingAdreess} from 'src/@core/components/wallet/address'
import {toLocaleDateFromBigInt} from 'src/@core/utils/date'

import {getWalletConnection, getNearConfig, getCurrentUser} from 'src/@core/configs/wallet'

import{ viewMethodOnContract } from 'src/@core/configs/utils'
import {encode} from 'src/@core/utils/cypher'
import * as nearAPI from 'near-api-js';
import { generateSeedPhrase } from 'near-seed-phrase';

const { utils } = nearAPI;
import BN from 'bn.js';

// ** Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '40rem' }
}))

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  [theme.breakpoints.up('md')]: {
    borderRight: `1px solid ${theme.palette.divider}`
  }
}))

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
const DEFAULT_FUNCTION_CALL_GAS = new BN('300000000000000');

const ClaimPage = () => {

  const [nearConfig, setNearConfig] = useState(null)
  const [currentUser, setCurrentUser] = useState('')


  const [sender, setSender] = useState('')
  const [blessingID, setBlessingID] = useState('')
  const [claimKey, setClaimKey] = useState('')
  const router = useRouter()

  // ** Hook
  useEffect (() => {
    const {sender, blessing, key} = router.query
      setSender(decode(sender))
      setBlessingID(decode(blessing))
      if (key) {
        setClaimKey(decode(key))
      }
      if (localStorage.getItem('my_claimed_' + decode(blessing)) === '1' || localStorage.getItem('my_blessing_claim_key_' + decode(blessing)) != undefined) {
        setAlreadyClaimed(true)
      }
      if (blessing) {
        fetch(`/api/items/fetchOneItem?blessing_id=${decode(blessing)}`)
          .then((res) => res.json())
          .then((data) => {
            setBlessingInDB(data)
          })
      }
      
  }, [router.query])
  

  const [blessing, setBlessing] = useState({})

  const [blessingInDB, setBlessingInDB] = useState({
    cdn_path: 'https://ewr1.vultrobjects.com/crypto-blessing/',
    image: 'logo_200_200.gif'
  })
  const [blessingSended, setBlessingSended] = useState({})
  const [claimList, setClaimList] = useState([])
  const [claimedAmount, setClaimedAmount] = useState(0)
  const [luckyClaimer, setLuckyClaimer] = useState({})

  const [alertMsg, setAlertMsg] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('error');

  const [claiming, setClaiming] = useState(false);
  const [claimSuccessOpen, setClaimSuccessOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [revoking, setRevoking] = useState(false)

  const [alreadyClaimed, setAlreadyClaimed] = useState(false)

  const [claimBlessingWithoutLoginOpen, setClaimBlessingWithoutLoginOpen] = useState(false)
  const [newAccountID, setNewAccountID] = useState('')
  const [claimerSeedPhrase, setClaimerSeedPhrase] = useState('')
  const [tx, setTx] = useState(null)
  const [lastGenKeyPair, setLastGenKeyPair] = useState(null)

  const handleClaimSuccessOpen = () => {
    setClaimSuccessOpen(true)
  }

  const handleClaimSuccessClose = () => {
    setClaimSuccessOpen(false)
  }

  const handleAlertOpen = (msg) => {
    setAlertMsg(msg)
    setAlertOpen(true)
  }

  const handleAlertClose = () => {
    setAlertMsg('')
    setAlertOpen(false)
  }

  const handleClaimBlessingWithoutLoginOpen = () => {
    setClaimBlessingWithoutLoginOpen(true)
  }

  const handleClaimBlessingWithoutLoginClose = () => {
    setClaimBlessingWithoutLoginOpen(false)
  }

  const handleNewAccountIDChange = (event) => {
    setNewAccountID(event.target.value)
  }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function featchAllInfoOfBlessing() {
    try {
      console.log('start to fetching info of blessing on chain')
      const chainData = await viewMethodOnContract(nearConfig, 'get_all_info_of_blessing', '{"sender": "' + sender + '","blessing_id": "' + blessingID + '"}');
      setBlessing(chainData.blessing)
      setBlessingSended(chainData.sender_blessing)
      console.log(chainData.blessing_claim_status)
      const claimResp = transClaimListFromWalletClaims(chainData.blessing_claim_status)
      setClaimList(claimResp.claims)
      setClaimedAmount(claimResp.claimedAmount)
      setLuckyClaimer(claimResp.luckyClaimer)
      setLoading(false);
    } catch (err) {
      console.log("Error: ", err)

      // window.location.replace("/pages/404")
    }
  }

  const revokeBlessing = async () => {
    setRevoking(true)
    const walletConnection = await getWalletConnection()
    try {
      let functionCallResult = await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'revoke_blessing',
        args: {
          blessing_id: blessingID
        },
        gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
        attachedDeposit: 0, 
        walletMeta: '', // optional param, by the way
        walletCallbackUrl: document.location.toString() + '&callbackBlessingID=' + blessingID // optional param, by the way
      });
      if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
        console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
        setRevoking(false)
        await featchAllInfoOfBlessing()
      }
    } catch (e) {
      console.log(e)
      setRevoking(false)
    }

  }

  const copyClaimLink = () => {
    const privateKey = localStorage.getItem('my_blessing_claim_key_' + blessingID)

    navigator.clipboard.writeText(`[CryptoBlessing] ${blessingInDB.title} | ${blessingInDB.description}. Claim your BUSD & blessing NFT here: https://near.cryptoblessing.app/claim?sender=${encode(sender)}&blessing=${encode(blessingID)}&key=${encode(privateKey)}`)
    handleAlertOpen('Claim Link Copied!')
    setAlertSeverity('info')
  }

  const claimBlessing = async () => {
    setClaiming(true)
    
    try {
      const chainData = await viewMethodOnContract(nearConfig, 'get_blessing_pubkey_status', '{"blessing_id": "' + blessingID + '"}');

      const unusedKeys = chainData.filter(key => !key.used)
      const unusedPrivateKeyRes = await fetch(`/api/blessing-sended/public_key?blessing_id=${blessingSended.blessing_id}&private_key=${claimKey}&unusedPrivateKey=${unusedKeys[Math.floor(Math.random() * unusedKeys.length)].hex}`)
      const unusedPrivateKeyJson = await unusedPrivateKeyRes.json()

      // localStorage.setItem('my_claimed_' + blessingSended.blessingID, 1)
      const walletConnection = await getWalletConnection()

      let functionCallResult = await walletConnection.account().functionCall({
        contractId: nearConfig.contractName,
        methodName: 'claim_blessing',
        args: {
          sender: sender, 
          claimer: currentUser,
          blessing_id: blessingID,
          claim_key: unusedPrivateKeyJson.data.pubkey,
          title: blessingInDB.title,
          description: blessingInDB.description
        },
        gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
        attachedDeposit: 0, 
        walletMeta: '', // optional param, by the way
        walletCallbackUrl: document.location.toString() + '&callbackBlessingID=' + blessingID // optional param, by the way
      });
      if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
        console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
        setClaiming(false)
        localStorage.setItem('my_claimed_' + blessingID, 1)
        setAlreadyClaimed(true)
        featchAllInfoOfBlessing()
      }
      
    } catch (e) {
      console.log(e)
      setAlertMsg('Something went wrong. Please contact admin in telegram.')
      setAlertMsg(e.MESSAGE)
      setAlertOpen(true);
      setClaiming(false)
    }
  }

  const claimBlessingNewAccount = async () => {
    setClaiming(true)
    
    try {
      const chainData = await viewMethodOnContract(nearConfig, 'get_blessing_pubkey_status', '{"blessing_id": "' + blessingID + '"}');

      const unusedKeys = chainData.filter(key => !key.used)
      const unusedPrivateKeyRes = await fetch(`/api/blessing-sended/public_key?blessing_id=${blessingSended.blessing_id}&private_key=${claimKey}&unusedPrivateKey=${unusedKeys[Math.floor(Math.random() * unusedKeys.length)].hex}`)
      const unusedPrivateKeyJson = await unusedPrivateKeyRes.json()

      const nearKeyPair = await fetch(`/api/near-key-pair`)
      const nearKeyPairJson = await nearKeyPair.json()
      
      const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
      const keyPair = nearAPI.utils.key_pair.KeyPair.fromString(nearKeyPairJson.secret_key);
      await keyStore.setKey(nearConfig.networkId, nearConfig.contractName, keyPair);
      nearConfig.keyStore = keyStore;
      const near = await nearAPI.connect(nearConfig);
      const cryptoBlessingAccount = await near.account(nearConfig.contractName);

      const tempClaimerKeyPair = JSON.parse(localStorage.getItem('temp_claimer_' + blessingID));

      let functionCallResult = await cryptoBlessingAccount.functionCall({
        contractId: nearConfig.contractName,
        methodName: 'claim_blessing_new_account',
        args: {
          sender: sender, 
          new_acc_id  : 'crypto_blessing_' + newAccountID + nearConfig.accountSuffix,
          new_pk      : tempClaimerKeyPair.publicKey,
          blessing_id: blessingID,
          claim_key: unusedPrivateKeyJson.data.pubkey,
          title: blessingInDB.title,
          description: blessingInDB.description
        },
        gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
        attachedDeposit: 0, 
        walletMeta: '', // optional param, by the way
      });
      if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
        console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
        setTx(functionCallResult.transaction.hash)
        setClaiming(false)
        localStorage.setItem('my_claimed_' + blessingID, 1)
        setAlreadyClaimed(true)
        setClaimerSeedPhrase(tempClaimerKeyPair.seedPhrase)
        setClaimSuccessOpen(true)
        setClaimBlessingWithoutLoginOpen(false)
        tempClaimerKeyPair.account = 'crypto_blessing_' + newAccountID + nearConfig.accountSuffix
        localStorage.setItem('temp_claimer_keypair_' + blessingID, JSON.stringify(tempClaimerKeyPair))
        setLastGenKeyPair(tempClaimerKeyPair)
        featchAllInfoOfBlessing()
        
      }
      
    } catch (e) {
      console.log(e)
      setAlertMsg('Something went wrong. Please contact admin in telegram.')
      setAlertMsg(e.MESSAGE)
      setAlertOpen(true);
      setClaiming(false)
    }
  }

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      setCurrentUser(await getCurrentUser())
      setNearConfig(await getNearConfig())
    }
    connectWalletOnPageLoad()
  }, [])

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      try {
          if (!currentUser && blessingID) {
            let existingKey = localStorage.getItem('temp_claimer_' + blessingID);

            if (!existingKey) {
              // Create a random key in here
              let seedPhrase = generateSeedPhrase();
              localStorage.setItem('temp_claimer_' + blessingID, JSON.stringify(seedPhrase));
            }
          }
          let lastGenKeyPair = localStorage.getItem('temp_claimer_keypair_' + blessingID)
          if (lastGenKeyPair) {
            setClaimerSeedPhrase(JSON.parse(lastGenKeyPair).seedPhrase)
            setLastGenKeyPair(JSON.parse(lastGenKeyPair))
          }
          if (sender && nearConfig && nearConfig.nodeUrl) {
            await featchAllInfoOfBlessing()
          }
      } catch (err) {
          console.log("Error: ", err)
      }
    }
    connectWalletOnPageLoad()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sender, currentUser, nearConfig])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={2}>
      </Grid>
      <Grid item xs={12} sm={6} md={8}>
        <Card sx={{ zIndex: 1 }}>
          <CardContent
            sx={{
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              padding: theme => `${theme.spacing(9.75, 5, 9.25)} !important`
            }}
          >
            <Avatar
              sx={{ width: 150, height: 150, marginBottom: 2.25, color: 'common.white', backgroundColor: 'primary.main',
              '-webkit-box-shadow': '0px 0px 20px 0px rgba(146,90,248,0.75)', filter: 'drop-shadow(0px 0px 20px 0px rgba(146,90,248,0.75))', margin: '15px' }}
            >
              <img width={150} alt='CryptoBlessing' src={blessingInDB.cdn_path + blessingInDB.image} />
            </Avatar>
            <Typography variant='h6' sx={{ marginBottom: 2.75 }}>
            {blessingInDB.title}
            </Typography>
            <Typography variant='body2' sx={{ marginBottom: 6 }}>
            {blessingInDB.description}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip variant="outlined" color="secondary" icon={<Avatar sx={{ width: 24, height: 24 }}>Ⓝ</Avatar>} label={claimedAmount + '/' + (blessingSended && blessingSended.token_amount ? parseFloat(utils.format.formatNearAmount(blessingSended.token_amount)).toFixed(2) : 0) + ' NEAR'} />
              <Chip variant="outlined" color="primary" label={claimList.length + '/' + (blessingSended && blessingSended.claim_quantity ? blessingSended?.claim_quantity?.toString() : 0) + ' Blessings'} icon={<AccountCircleIcon />} />
            </Stack>
          </CardContent>

          <Divider sx={{ my: 3 }}>sended at {blessingSended.send_timestamp ? toLocaleDateFromBigInt(blessingSended.send_timestamp/1000000000) : '1970'}  by {sender ? sender : 'CryptoBlessing'}</Divider>
          
          <CardContent>
            {claimList.length > 0 ?
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 500 }} aria-label='customized table'>
                  <TableHead>
                      <TableRow>
                          <StyledTableCell>Claimer</StyledTableCell>
                          <StyledTableCell>Time</StyledTableCell>
                          <StyledTableCell>Amount</StyledTableCell>
                          <StyledTableCell>CBT Reward</StyledTableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                  {claimList.map(row => (
                    <StyledTableRow key={row.claimer}>

                      <StyledTableCell component='th' scope='row'>
                        <Stack direction="row" spacing={1}>
                          {row.claimer == lastGenKeyPair?.account && !currentUser ? 
                          <IconButton size="small" color="secondary" aria-label="Your local wallet" onClick={handleClaimSuccessOpen}>
                            <AccountBalanceWalletIcon fontSize="inherit" />
                          </IconButton>
                          : ''}
                          {row.claimer === luckyClaimer.claimer ?
                          <Badge badgeContent='lucky' color="primary">
                            {simpleShowNear(row.claimer)}
                          </Badge>
                          :
                          <Typography variant="body2" >
                            {simpleShowNear(row.claimer)} 
                          </Typography>
                          }
                        </Stack>
                        
                      </StyledTableCell>
                      <StyledTableCell>{row.time}</StyledTableCell>
                      <StyledTableCell align='right'>
                        <Stack direction="row" spacing={1}>
                          <Chip variant="outlined" color="secondary" icon={<Avatar sx={{ width: 24, height: 24 }}>Ⓝ</Avatar>} label={parseFloat(row.amount).toFixed(2)} />
                          <Chip
                            avatar={<Avatar alt="CryptoBlessing" src={blessingInDB.cdn_path + blessingInDB.image} />}
                            label="1"
                            variant="outlined"
                          />
                        </Stack>  
                      </StyledTableCell>
                      <StyledTableCell align='right'>
                        <Tooltip disableFocusListener disableTouchListener title="The CBT tokens will reward to the sender of this blessing.">
                          <Chip variant="outlined" color="primary" label={row.CBTokenAwardToSenderAmount} icon={<CBT_ICON />} />
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  </TableBody>
              </Table>
            </TableContainer>
            :
            <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Typography  variant="overline" display="block" gutterBottom>
                There is no one claimed yet!
              </Typography>
            </Box>
            }
            
            {
              claimList.length > 0 && claimList.length == blessingSended.claim_quantity ?
              <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Typography  variant="overline" display="block" gutterBottom>
                  All the blessings have already been claimed!
                </Typography>
              </Box>
            : ''
            }
            
          </CardContent>

          <CardActions
            sx={{
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
            >
            { !currentUser ?
            <Button disabled={claimList.length == blessingSended.claim_quantity || alreadyClaimed} onClick={handleClaimBlessingWithoutLoginOpen} variant='contained' sx={{ py: 2.5, width: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              Claim Blessing Without Login
            </Button>
            :
            ''
            }
            { currentUser && sender === currentUser && !blessingSended.revoked ?
              <Stack direction="row" spacing={1}>
                <Tooltip title="You can only revoke the amount you sended and need there is no one claimed it yet.">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>

                <Box sx={{ m: 1, position: 'relative' }}>
                  <Button disabled={claimList.length > 0 || revoking} onClick={revokeBlessing} size='large' color='error' variant='outlined'>
                    {revoking ? 'Waiting for revoke transaction...' : 'Revoke'}
                  </Button>
                  {revoking && (
                    <CircularProgress
                      color="secondary"
                      size={24}
                      sx={{
                        color: green[500],
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px',
                      }}
                    />
                  )}
                </Box>
                
                <Button disabled={claimList.length > 0 && claimList.length == blessingSended.claimQuantity} onClick={copyClaimLink} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                  Copy Claim Link
                </Button>
              </Stack>
            :
            ''
            }

            { currentUser && sender === currentUser && blessingSended.revoked ?
              <Stack direction="row" spacing={1}>
                <Tooltip title="You can only revoke the amount you sended and need there is no one claimed it yet.">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Button disabled size='large' color='error' variant='outlined'>
                  Revoked
                </Button>
                
                <Button disabled onClick={copyClaimLink} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                  Copy Claim Link
                </Button>
              </Stack>
            :
            ''
            }



            { currentUser && sender !== currentUser ?
            <Stack direction="row" spacing={1}>
              <Box sx={{ m: 1, position: 'relative' }}>
                <Button disabled={claiming || claimKey == '' || alreadyClaimed || claimList.length == blessingSended.claim_quantity} onClick={claimBlessing} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                  {claiming ? 'Waiting for claim transaction...' : 'Claim Blessing'}
                </Button>
                {claiming && (
                  <CircularProgress
                    color="secondary"
                    size={24}
                    sx={{
                      color: green[500],
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                )}
              </Box>
             
            </Stack>
              :
              ''
            }
            
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
      </Grid>

      <Modal
        open={claimSuccessOpen}
        onClose={handleClaimSuccessClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Card>
            <CardMedia sx={{ height: '14.5625rem' }} image='/images/blessings/congrats.webp' />
            <CardContent>
              <Typography variant='h6' sx={{ marginBottom: 2 }}>
                Congratulations!
              </Typography>
              <Typography variant='body2'>
                Congrats!!! You have already claimed this blessing successfully. 
              </Typography>
              <Typography variant='caption' color='error'>
                You just claimed your NEAR and one more NFT, You can check out in your wallet.
              </Typography>
              <Divider />
              <Card sx={{maxWidth: 600}}>
                <CardContent>
                  <Typography variant="subtitle2">
                    {claimerSeedPhrase}
                  </Typography>
                </CardContent>
              </Card>
              <Typography variant='caption' color='info'>
                Please copy the seed phrase above and store it in a safe place. You can restore your account on NEAR WALLET with it.
              </Typography>
              {tx ?
              <Typography variant='caption'>
                <Link target='_blank' href={nearConfig?.explorerUrl + '/transactions/' + tx}>See the transaction on Near</Link>
              </Typography>
              : ''}
              
            </CardContent>
            <CardActions
              sx={{
                gap: 5,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              >
              <Button onClick={handleClaimSuccessClose} size='large' color='secondary' variant='outlined'>
                Cancel
              </Button>
              <Button href={nearConfig?.walletUrl} target='_blank' size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                To NEAR Wallet
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Modal>


      <Modal
        open={claimBlessingWithoutLoginOpen}
        onClose={handleClaimBlessingWithoutLoginClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Card>
            <CardContent>
              <form onSubmit={e => e.preventDefault()}>
                <Grid container spacing={5}>
                  <Grid item xs={12}>
                      <TextField
                      onChange={handleNewAccountIDChange}
                      fullWidth
                      label={"What's your name? This account will be created on NEAR chain."}
                      placeholder='my_near_account'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                           crypto_blessing_
                          </InputAdornment>
                          ),
                        endAdornment: (
                          <InputAdornment position='end'>
                           {nearConfig?.accountSuffix}
                          </InputAdornment>
                          )
                      }}
                      />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
            <CardActions
              sx={{
                gap: 5,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              >
              <Button onClick={handleClaimBlessingWithoutLoginClose} size='large' color='secondary' variant='outlined'>
                Cancel
              </Button>

              <Box sx={{ m: 1, position: 'relative' }}>
                <Button disabled={claiming || claimKey == '' || alreadyClaimed || newAccountID.length == 0} onClick={claimBlessingNewAccount} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                  {claiming ? 'Waiting for claim transaction...' : 'Confirm And Start Claiming'}
                </Button>
                {claiming && (
                  <CircularProgress
                    color="secondary"
                    size={24}
                    sx={{
                      color: green[500],
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                )}
              </Box>
            </CardActions>
          </Card>
        </Box>
      </Modal>

      <Snackbar 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={alertOpen} 
        onClose={handleAlertClose}
        autoHideDuration={3000}>
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%', bgcolor: 'white' }}>
          {alertMsg}
        </Alert>
      </Snackbar>
    </Grid>
  )
}


export default ClaimPage
