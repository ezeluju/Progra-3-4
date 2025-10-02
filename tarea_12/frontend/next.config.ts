import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false, // arrastra MetaMask SDK
      'pino-pretty': false,                               // arrastra WalletConnect logger
      'pino-abstract-transport': false
    }
    return config
  },
}

export default nextConfig
