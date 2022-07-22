// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import Twitter from 'mdi-material-ui/Twitter'
import Telegram from '@mui/icons-material/Telegram';
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button';

const FooterContent = () => {
  // ** Var
  const hidden = useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ mr: 2 }}>
        {`© ${new Date().getFullYear()} from `}
        {/* <Box component='span' sx={{ color: 'error.main' }}>
          ❤️
        </Box> */}
        {/* {` by `} */}
        <Link href='/'>
          CryptoBlessing
        </Link>
        <Button href="https://whitepaper.cryptoblessing.app/" target='_blank'>White Paper</Button>
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      </Box>
      {/* {hidden ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& :not(:last-child)': { mr: 4 } }}>
          <Link
            target='_blank'
            href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free/blob/main/LICENSE'
          >
            MIT License
          </Link>
          <Link target='_blank' href='https://themeselection.com/'>
            More Themes
          </Link>
          <Link
            target='_blank'
            href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free/blob/main/README.md'
          >
            Documentation
          </Link>
          <Link
            target='_blank'
            href='https://github.com/themeselection/materio-mui-react-nextjs-admin-template-free/issues'
          >
            Support
          </Link>
        </Box>
      )} */}
    </Box>
  )
}

export default FooterContent
