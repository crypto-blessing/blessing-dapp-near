// ** Icon imports
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import SendAndArchiveIcon from '@mui/icons-material/SendAndArchive';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StorefrontIcon from '@mui/icons-material/Storefront';

const navigation = () => {
  
  return [
    {
      title: 'Blessings',
      icon: CurrencyBitcoinIcon,
      path: '/'
    },

    // {
    //   title: 'Market',
    //   icon: StorefrontIcon,
    //   path: '/market'
    // },
    {
      sectionTitle: 'Mine'
    },
    {
      title: 'Sent',
      icon: SendAndArchiveIcon,
      path: '/sended',
    },
    {
      title: 'Claimed',
      icon: ArrowCircleLeftIcon,
      path: '/claimed',
    },
    {
      title: 'Wallet',  
      icon: AccountBalanceWalletIcon,
      path: '/wallet',
    },

    // {
    //   sectionTitle: 'Pages'
    // },
    // {
    //   title: 'Login',
    //   icon: Login,
    //   path: '/pages/login',
    //   openInNewTab: true
    // },
    // {
    //   title: 'Register',
    //   icon: AccountPlusOutline,
    //   path: '/pages/register',
    //   openInNewTab: true
    // },
    // {
    //   title: 'Error',
    //   icon: AlertCircleOutline,
    //   path: '/pages/error',
    //   openInNewTab: true
    // },
    // {
    //   sectionTitle: 'User Interface'
    // },
    // {
    //   title: 'Typography',
    //   icon: FormatLetterCase,
    //   path: '/typography'
    // },
    // {
    //   title: 'Icons',
    //   path: '/icons',
    //   icon: GoogleCirclesExtended
    // },
    // {
    //   title: 'Cards',
    //   icon: CreditCardOutline,
    //   path: '/cards'
    // },
    // {
    //   title: 'Tables',
    //   icon: Table,
    //   path: '/tables'
    // },
    // {
    //   icon: CubeOutline,
    //   title: 'Form Layouts',
    //   path: '/form-layouts'
    // }
  ]
}

export default navigation
