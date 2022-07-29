// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal';
import CardActions from '@mui/material/CardActions'
import { useRouter } from 'next/router'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import {decode, encode} from 'src/@core/utils/cypher'
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// ** Demo Components Imports
import BlessingCard2 from 'src/views/cards/BlessingCard2'
import {getWalletConnection, getNearConfig, getCurrentUser} from 'src/@core/configs/wallet'

import { useEffect, useState } from "react"
import { Divider, Slider } from '@mui/material'


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


const Market = () => {
    const router = useRouter()
    const [categoriesWithItems, setCategoriesWithItems] = useState([])
    const [sendSuccessOpen, setSendSuccessOpen] = useState(false);
    const [tx, setTx] = useState(null)
    const [callbackBlessingID, setCallbackBlessingID] = useState(null)
    const [blessingInDB, setBlessingInDB] = useState(null)
    const [nearConfig, setNearConfig] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)

    const [alertMsg, setAlertMsg] = useState('');
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertSeverity, setAlertSeverity] = useState('info');   
    useEffect(() => {
        const connectWalletOnPageLoad = async () => {
          setNearConfig(await getNearConfig())
          setCurrentUser(await getCurrentUser())
        }
        connectWalletOnPageLoad()
      }, [])
    useEffect (() => {
        const { transactionHashes, callbackBlessingID, errorCode } = router.query
        if (!errorCode && transactionHashes) {
            fetch(`/api/items/fetchOneItem?blessing_id=${callbackBlessingID}`)
            .then((res) => res.json())
            .then((data) => {
                setBlessingInDB(data)
            })
            setTx(transactionHashes)
            setCallbackBlessingID(callbackBlessingID)
            setSendSuccessOpen(true)
        }
    }, [router.query])


    const copyClaimLink = () => {
        const privateKey = localStorage.getItem('my_blessing_claim_key_' + callbackBlessingID)
        navigator.clipboard.writeText(`[CryptoBlessing] ${blessingInDB.title} | ${blessingInDB.description}. Claim your ⓃNear & blessing NFT here: https://near.cryptoblessing.app/claim?sender=${encode(currentUser)}&blessing=${encode(callbackBlessingID)}&key=${encode(privateKey)}`)
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

    useEffect(() => {
        fetch('/api/items')
          .then((res) => res.json())
          .then((data) => {
            setCategoriesWithItems(data)
          })
      }, [])

    return (
        <Box>
        {categoriesWithItems?.map((item) => (
            <Box key={item.type}>
                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <Typography variant='h5'>
                        <Link href={'/category?category=' + item.type}>
                            {item.type}
                        </Link>
                        </Typography>
                        <Typography variant='body2' className='mui-ellipsis'>{item.description}</Typography>
                    </Grid>
                    {item.items?.map((blessing) => (
                        <Grid key={blessing.image} item xs={12} md={2}>
                            <BlessingCard2 blessing={blessing} />
                        </Grid>
                    ))}
                    
                </Grid>
                <Divider sx={{marginTop: 5}}/>
            </Box>
        ))}

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
                </Alert>
            </Snackbar>
        
        </Box>
    )
}

export default Market
