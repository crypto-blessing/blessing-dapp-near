const path = require('path')
const webpack = require('webpack')

const { parsed: myEnv } = require('dotenv').config({
  path: __dirname + '/.env'
})

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  experimental: {
    styledComponents: true,
    esmExternals: false,
    jsconfigPaths: true // enables it for both jsconfig.json and tsconfig.json
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }
    config.plugins.push(new webpack.EnvironmentPlugin(myEnv))

    return config
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ]
  },
  env: {
    vultr_cdn_path: 'https://ewr1.vultrobjects.com/crypto-blessing/items/',
  }
}
