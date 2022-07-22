// ** Next Imports
import Head from 'next/head'
import { Router } from 'next/router'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'

// ** Config Imports
import themeConfig from 'src/configs/themeConfig'

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import ThemeComponent from 'src/@core/theme/ThemeComponent'

// ** Contexts
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

// ** Global css styles
import '../../styles/globals.css'

// ** Web3 React Injector
import { Web3ReactProvider } from '@web3-react/core'
import Web3 from 'web3'


const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

const getLibrary = provider => {
  return new Web3(provider)
}

// ** Configure JSS & ClassName
const App = props => {

  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  // Variables
  const getLayout = Component.getLayout ?? (page => <UserLayout>{page}</UserLayout>)

  return (
    
    <CacheProvider value={emotionCache}>
      
        <Head>
          <title>{`${themeConfig.templateName} - Blessing is the most universal human expression of emotion, and we are NFTizing it.`}</title>
          <meta
            name='description'
            content={`${themeConfig.templateName} – Blessing is the most universal human expression of emotion, and we are NFTizing it.`}
          />
          <meta name='keywords' content='crypto, blessing, coins, web3, lucky, bag, red' />
          <meta name='viewport' content='initial-scale=1, width=device-width' />
        </Head>
        <Web3ReactProvider getLibrary={getLibrary}>
          <SettingsProvider>
            <SettingsConsumer>
              {({ settings }) => {
                return <ThemeComponent settings={settings}>{getLayout(
                        <Component {...pageProps} />
                    )}</ThemeComponent>
              }}
            </SettingsConsumer>
          </SettingsProvider>
        </Web3ReactProvider>
        
    </CacheProvider>
  )
}

export default App
