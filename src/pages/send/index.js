// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Icon from '@material-ui/core/Icon';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import InputAdornment from '@mui/material/InputAdornment'
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import { styled } from '@mui/material/styles'
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import * as nearAPI from 'near-api-js';
import {generateSeedPhrase, parseSeedPhrase} from 'near-seed-phrase';
import sha256 from 'js-sha256';
import BN from 'bn.js';

import { green } from '@mui/material/colors';

// ** Icons Imports
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {decode} from 'src/@core/utils/cypher'

import {encode} from 'src/@core/utils/cypher'


import { useRouter } from 'next/router'

import {getWalletConnection, getNearConfig, getCurrentUser} from 'src/@core/configs/wallet'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};
const { utils } = nearAPI;

const DEFAULT_FUNCTION_CALL_GAS = new BN('30000000000000');

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

const BlessingSendPage = () => {

    const router = useRouter()
    const [tx, setTx] = useState(null)
    const [nearConfig, setNearConfig] = useState(null)
    const [currentUser, setCurrentUser] = useState('')
    useEffect (() => {
        const { blessing, transactionHashes, callbackBlessingID, errorCode } = router.query
        if (!errorCode && transactionHashes) {
            setTx(transactionHashes)
            setSendSuccessOpen(true)
            setBlessingID(callbackBlessingID)
        }
        if (blessing) {
            fetch(`/api/items/fetchOneItem?image=${encodeURIComponent(decode(blessing))}`)
                .then((res) => res.json())
                .then((data) => {
                setBlessingInDB(data)
                })
        }
    }, [router.query])


    const [blessingInDB, setBlessingInDB] = useState({})
    const [open, setOpen] = useState(false);
    const [tokenAmount, setTokenAmount] = useState(0);
    const [claimQuantity, setClaimQuantity] = useState(0);
    const [blessingCaption, setBlessingCaption] = useState('');
    const [claimType, setClaimType] = useState(-1);
    const handleOpen = () => setOpen(true);

    const [alertMsg, setAlertMsg] = useState('');
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertSeverity, setAlertSeverity] = useState('info');


    const [sending, setSending] = useState(false);
    const [approving, setApproving] = useState(false);
    const [sendSuccessOpen, setSendSuccessOpen] = useState(false);
    const [blessingID, setBlessingID] = useState('');

    const handleClose = () => {
        setOpen(false)
        setBlessingCaption('')
        setTokenAmount(0)
        setClaimQuantity(0)
        setClaimType(-1)
        setSending(false)
        setApproving(false)
    }

    const handleTokenAmountChange = (event) => {
        setTokenAmount(event.target.value);
        handleBlessingCaption(event.target.value, claimQuantity, claimType)
    }

    const handleClaimQuantityChange = (event) => {
        setClaimQuantity(event.target.value);
        handleBlessingCaption(tokenAmount, event.target.value, claimType)
    }

    const handleClaimTypeChange = (event) => {
        let localClaimType = -1
        switch (event.target.value) {
        case 'AVERAGE':
            localClaimType = 0
            break;
        case 'RANDOM':
            localClaimType = 1
            break;
        }
        setClaimType(localClaimType)
        handleBlessingCaption(tokenAmount, claimQuantity, localClaimType)
    }

    const handleBlessingCaption = (tokenAmount, claimQuantity, claimType) => {
        let payCaption = '', claimCaption = '';
        if (tokenAmount > 0 && claimQuantity > 0) {
        let totalPay = (claimQuantity * blessingInDB.price) + parseFloat(tokenAmount)
        payCaption = `You will pay ${totalPay} ⓃNear. `
        } else {
        payCaption = ''
        }
        if (payCaption !== '') {
        if (claimType > -1) {
            if (claimType === 0) {
            claimCaption = `Your friends will claim ${(tokenAmount / claimQuantity).toFixed(2)}(tax in) ⓃNear and one more NFT. `
            } else if (claimType === 1) {
            claimCaption = `Your friends will claim a random amount and one more NFT.`
            }
        } else {
            claimCaption = ''
        }
        }
        setBlessingCaption(payCaption + claimCaption)
    }

    const checkFormValidate = () => {
        const totalAmount = claimQuantity * blessingInDB.near_price + parseFloat(tokenAmount)
        if (tokenAmount <= 0 || totalAmount > nearAmount) {
          setAlertMsg('You have insufficient ⓃNEAR balance.')
          setAlertOpen(true);
          setAlertSeverity('error');

          return false
        }
        if (claimQuantity <= 0 || claimQuantity > 13) {
          setAlertMsg('You only have up to 13 friends to collect your ⓃNEAR')
          setAlertOpen(true);
          setAlertSeverity('error');
    
          return false
        }
        if (claimType === -1) {
          setAlertMsg('Pls choose the way your friend will claim your ⓃNEAR')
          setAlertOpen(true);
          setAlertSeverity('error');
    
          return false
        }
    
        return true
      }
    
      async function storeKeys(blessingID, blessingSec, claimKeys) {
        fetch('/api/blessing-sended', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: blessingInDB.image,
            blessing: {
              blessing_id: blessingID,
              private_key: blessingSec
            },
            claimKeys: claimKeys
          }),
        }).then(res => {
          console.log(res)
        } ).catch(err => {
          console.log(err)
    
        })
      }
    
      async function submitSendBlessing() {
        setSending(true)
        if (!checkFormValidate()) {
            setSending(false)
            
            return
        }
        const totalAmount = claimQuantity * blessingInDB.near_price + parseFloat(tokenAmount)
        const totalAmountInYocto = utils.format.parseNearAmount(totalAmount + "")
        
        // start to send blessing
        const walletConnection = await getWalletConnection()
        try {
          let hexes = []
          let claimKeys = []
          const blessingKeypair = generateSeedPhrase();
          const blessingSec = blessingKeypair.secretKey;
          const blessingID = blessingKeypair.publicKey;
    
          // claim keys gen
          for (let i = 0; i < claimQuantity; i++) {
            let seedPhrase = generateSeedPhrase();
            hexes.push(sha256.sha256(seedPhrase.publicKey))
            claimKeys.push({
              pubkey: seedPhrase.publicKey,
              private_key: sha256.sha256(seedPhrase.publicKey)
            })
          }
    
          await storeKeys(blessingID, blessingSec, claimKeys)
          localStorage.setItem('my_blessing_claim_key_' + blessingID, blessingSec)

          let functionCallResult = await walletConnection.account().functionCall({
            contractId: nearConfig.contractName,
            methodName: 'send_blessing',
            args: {
              blessing_image: blessingInDB.image, 
              blessing_id: blessingID,
              claim_quantity: parseInt(claimQuantity),
              claim_type: claimType === 0 ? 'Average' : 'Random',
              hexex: hexes
            },
            gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
            attachedDeposit: totalAmountInYocto, 
            walletMeta: '', // optional param, by the way
            walletCallbackUrl: document.location.toString() + '&callbackBlessingID=' + blessingID // optional param, by the way
          });
          if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
            console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
          }
        } catch (e) {
          console.log(e)
          setAlertMsg('Something went wrong. Please contact admin in telegram.')
          setAlertOpen(true);
          setAlertSeverity('error');
          setSending(false)
        }
        
      }

    const copyClaimLink = () => {
        const privateKey = localStorage.getItem('my_blessing_claim_key_' + blessingID)
        navigator.clipboard.writeText(`[CryptoBlessing] ${blessingInDB.title} | ${blessingInDB.description}. Claim your ⓃNear & blessing NFT here: https://near.cryptoblessing.app/claim?sender=${encode(currentUser)}&blessing=${encode(blessingID)}&key=${encode(privateKey)}`)
        setAlertMsg('Claim Link Copied.')
        setAlertOpen(true);
    }

    const handleSendSuccessClose = () => {
        setSendSuccessOpen(false)
    }



    const handleAlertClose = () => {
        setAlertMsg('')
        setAlertOpen(false)
    }

    const [nearAmount, setNearAmount] = useState(0)

    async function fetchNearAmount() {
        const walletConnection = await getWalletConnection()
        walletConnection.account().getAccountBalance().then(async (balance) => {
          setNearAmount(parseFloat(utils.format.formatNearAmount(balance.available)).toFixed(2))
        })
          
    }

    useEffect(() => {
        fetchNearAmount()
    }, [])

    useEffect(() => {
        const connectWalletOnPageLoad = async () => {
            setNearConfig(await getNearConfig())
            setCurrentUser(await getCurrentUser())
        }
        connectWalletOnPageLoad()
    }, [])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12} sm={6} md={2}>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
                <Card>
                    <CardHeader title='Send Blessing' titleTypographyProps={{ variant: 'h6' }} />
                    <Grid container spacing={6}>
                    <StyledGrid item md={5} xs={12}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img width={137} alt='CryptoBlessing' src={blessingInDB.cdn_path + blessingInDB.image} />
                        </CardContent>
                    </StyledGrid>
                    <Grid
                        item
                        xs={12}
                        md={7}
                        sx={{
                        paddingTop: ['0 !important', '0 !important', '1rem !important'],
                        paddingLeft: ['1rem !important', '1rem !important', '0 !important']
                        }}
                    >
                        <CardContent>
                        <Typography variant='h6' sx={{ marginBottom: 2 }}>
                        {blessingInDB.title}
                        </Typography>
                        <Typography variant='body2' sx={{ marginBottom: 3.5 }}>
                        {blessingInDB.description}
                        </Typography>
                        <Typography sx={{ fontWeight: 500, marginBottom: 3 }}>
                            Designer:{' '}
                            <Box component='span' sx={{ fontWeight: 'bold' }}>
                            {blessingInDB.near_owner}
                            </Box>
                        </Typography>
                        </CardContent>
                        <CardActions className='card-action-dense'>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Chip variant="outlined" avatar={<Avatar>Ⓝ</Avatar>} color="secondary" label={blessingInDB.near_price} />
                        </Box>
                        </CardActions>
                    </Grid>
                    </Grid>
                </Card>
                <Card>
                    <CardContent>
                    <form onSubmit={e => e.preventDefault()}>
                        <Grid container spacing={5}>
                        <Grid item xs={12}>
                            <TextField
                                onChange={handleTokenAmountChange}
                                fullWidth
                                label={'How much ⓃNEAR do you want to send?(wallet: ' + nearAmount + ' ⓃNEAR)'}
                                placeholder='10'
                                type='number'
                                InputProps={{
                                    startAdornment: (
                                    <InputAdornment position='start'>
                                        <Avatar sx={{ width: 20, height: 20 }}>Ⓝ</Avatar>
                                    </InputAdornment>
                                    )
                                }}
                                />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                            onChange={handleClaimQuantityChange}
                            fullWidth
                            label={'How many friends are expected to claim?'}
                            placeholder='2'
                            type='number'
                            InputProps={{
                                startAdornment: (
                                <InputAdornment position='start'>
                                    <AccountCircleIcon />
                                </InputAdornment>
                                )
                            }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl>
                            <FormLabel id="demo-row-radio-buttons-group-label">The way they claim your ⓃNear?</FormLabel>
                            <RadioGroup
                                onChange={handleClaimTypeChange}
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                            >
                                <FormControlLabel value="AVERAGE" control={<Radio />} label="AVERAGE"/>
                                <FormControlLabel value="RANDOM" control={<Radio />} label="RANDOM" />
                            </RadioGroup>
                            </FormControl>
                            
                        </Grid>
                        </Grid>
                    </form>
                    <Typography variant="caption" display="block" gutterBottom color='error'>
                        {blessingCaption}
                    </Typography>
                    </CardContent>
                    <Divider sx={{ margin: 0 }} />
                    <CardActions
                    sx={{
                    gap: 5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                    }}
                    >
                    <Button onClick={handleClose} size='large' color='secondary' variant='outlined'>
                        Cancel
                    </Button>
                    <Box sx={{ m: 1, position: 'relative' }}>
                        <Button onClick={submitSendBlessing} disabled={sending} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                        {sending ? 'Waiting for send transaction...' : 'Send Blessing'}
                        </Button>
                        {sending && (
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
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
            </Grid>
            <Modal
                open={sendSuccessOpen}
                onClose={handleSendSuccessClose}
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
                            You have already sended this blessing successfully. Pls copy the claim link and share it with your friends.
                        </Typography>
                        <Typography variant='caption' color='error'>
                            FYI, only use this claim link can claim your blessing!
                        </Typography>
                        <br />
                        <Typography variant='caption'>
                            <Link target='_blank' href={nearConfig?.explorerUrl + '/transactions/' + tx}>See the transaction on Near</Link>
                        </Typography>
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
                    <Button onClick={handleSendSuccessClose} size='large' color='secondary' variant='outlined'>
                        Cancel
                    </Button>
                    <Button onClick={copyClaimLink} size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                        Copy Claim Link
                    </Button>
                    </CardActions>
                </Card>
                </Box>
            </Modal>

            <Snackbar 
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={alertOpen} 
                onClose={handleAlertClose}
                autoHideDuration={4000}>
                <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%', bgcolor: 'white' }}>
                {alertMsg}
                <Link target='_blank' href="https://t.me/crypto_blessing_eng" underline="always">Find admin in telegram</Link>
                </Alert>
            </Snackbar>
        </Grid>
    )
}

export default BlessingSendPage
