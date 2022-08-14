// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Twitter from 'mdi-material-ui/Twitter'
import Telegram from '@mui/icons-material/Telegram';
import Menu2 from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';


import {getWalletConnection, getNearConfig, getCurrentUser} from 'src/@core/configs/wallet'

import { useEffect, useState } from "react"

// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'

import LogoutIcon from '@mui/icons-material/Logout';

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




const AppBarContent = props => {

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBSCClose = () => {
    setAnchorEl(null);
    window.open("https://cryptoblessing.app/","_blank");
  }

  const handleSolanaClose = () => {
    setAnchorEl(null);
    window.open("https://solana.cryptoblessing.app/","_blank");
  }

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')

  const [currentUser, setCurrentUser] = useState('')
  const [nearConfig, setNearConfig] = useState({})

  async function connect() {
    const walletConnection = await getWalletConnection()
    walletConnection.requestSignIn(
      nearConfig.contractName,
      '', // title. Optional, by the way
      '', // successUrl. Optional, by the way
      '', // failureUrl. Optional, by the way
    ).then(async (response) => {
      localStorage.setItem('isWalletConnected', true)
    }).catch(async (error) => {
      console.log("not authorized")
    });
  }

  async function disconnect() {
    const walletConnection = await getWalletConnection()
    walletConnection.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  }

  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const hiddenSm = useMediaQuery(theme => theme.breakpoints.down('sm'))
  
  

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      setNearConfig(await getNearConfig())
      setCurrentUser(await getCurrentUser())
    }
    connectWalletOnPageLoad()
  }, [])

  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  }

  useEffect(() => {
    const loadBeforeOp = async () => {
      fetch('/api/security/block')
          .then((res) => res.json())
          .then((data) => {
            if (data.block) {
              setAlertTitle("Security Detected")
              setAlertMessage("Service is not available in your area, please leave.💗💗💗")
              setAlertOpen(true)
            }
          })
    }
    loadBeforeOp()
  }, [])

  return (

    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden ? (
          <IconButton
            color='inherit'
            onClick={toggleNavVisibility}
            sx={{ ml: -2.75, ...(hiddenSm ? {} : { mr: 3.5 }) }}
          >
            <Menu />
          </IconButton>
        ) : null}
        {/* <TextField
          size='small'
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Magnify fontSize='small' />
              </InputAdornment>
            )
          }}
        /> */}
        <div>
          <Button
            id="basic-button"
            onClick={handleClick}
            aria-controls={menuOpen ? 'demo-customized-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
            variant="contained"
            disableElevation
            endIcon={<KeyboardArrowDownIcon />}
          >
            Other Chains
          </Button>
          <Menu2
            id="basic-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={handleBSCClose}>Binance Smart Chain</MenuItem>
            <MenuItem onClick={handleSolanaClose}>Solana Chain</MenuItem>
          </Menu2>
        </div>
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>

        {currentUser ? 
        <ButtonGroup variant="contained" aria-label="outlined primary button group">
          <Button variant="outlined">{'near-' + nearConfig.networkId}</Button>
          <Button sx={{
            textTransform: 'none'
          }}>{currentUser}</Button>
          <IconButton onClick={disconnect} color="primary" aria-label="add to shopping cart">
            <LogoutIcon />
          </IconButton>
        </ButtonGroup>  
        : 
        <Button onClick={connect} size='large' variant='outlined'>
          Near Log in
        </Button>
        }
        <Box sx={{ ml: 2 }} />
        <ModeToggler settings={settings} saveSettings={saveSettings} />
      </Box>
      <Snackbar 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open} 
        onClose={handleClose}
        autoHideDuration={4000}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%', bgcolor: 'white' }}>
          Only support BSC network!
        </Alert>
      </Snackbar>

      {/** System maintenance in progress */}

      <Dialog
        open={alertOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {alertTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          {alertMessage}
          </DialogContentText>
          <Divider />
          <DialogContentText id="alert-dialog-description" align='right'>
            Follow us on: 
            <Link target='_blank' href='https://twitter.com/cryptoblessing4'>
              <IconButton>
                <Twitter sx={{ color: '#1da1f2' }} />
              </IconButton>
            </Link>
            <Link target='_blank' href='https://t.me/crypto_blessing_eng'>
              <IconButton>
                <Telegram sx={{ color: '#1da1f2' }} />
              </IconButton>
            </Link>
          </DialogContentText>
        </DialogContent>
      </Dialog>

      {/** System maintenance in progress */}
    </Box>
  )
}

export default AppBarContent
