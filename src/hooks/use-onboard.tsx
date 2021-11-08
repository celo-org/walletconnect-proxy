import { useState, useEffect, createContext, useContext, FC } from 'react'
import Onboard from 'bnc-onboard'
import { API, Initialization, Wallet } from 'bnc-onboard/dist/src/interfaces'
import { Web3Provider } from '@ethersproject/providers'

type OnboardContextProps = {
  address: string | undefined,
  selectWallet: () => void,
  disconnectWallet: () => void
}
const OnboardContext = createContext<OnboardContextProps>({
  address: undefined,
  selectWallet: () => {},
  disconnectWallet: () => {}
})

/**
 * A React Web3 wallet hook for [Onboard.js](https://blocknative.com/onboard) library.
 */
export const OnboardContextProvider: FC = ({ children }) => {
  const [onboard, setOnboard] = useState<API>()
  const [wallet, setWallet] = useState<Wallet>()
  const [address, setAdress] = useState<string>()
  const [balance, setBalance] = useState<string>()
  const [isWalletSelected, setWalletSelected] = useState<boolean>()
  const [provider, setProvider] = useState<Web3Provider>()

  useEffect(() => {
    setOnboard(
      Onboard({
        networkId: 42220,
        subscriptions: {
          wallet: wallet => {
            if (wallet.provider && wallet.name) {
              setWallet(wallet)

              const ethersProvider = new Web3Provider(wallet.provider)

              window.localStorage.setItem('selectedWallet', wallet.name)

              setProvider(ethersProvider)
            } else {
              setProvider(undefined)
              setWallet(undefined)
              window.localStorage.removeItem('selectedWallet')
            }
          },
          address: address => {
            if (address) setAdress(address)
          },
          balance: balance => {
            if (isWalletSelected) setBalance(balance)
          }
        }
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet')

    if (previouslySelectedWallet && onboard) {
      onboard.walletSelect(previouslySelectedWallet).then(() => {
        setWalletSelected(true)
      })
    }
  }, [onboard])

  const selectWallet = async () => {
    if (!isWalletSelected && onboard) {
      await onboard.walletSelect()

      await onboard.walletCheck()

      setWalletSelected(true)

      onboard.config({ darkMode: true, networkId: 1 })
    }
  }

  const disconnectWallet = () => {
    if (onboard) {
      onboard.walletReset()

      setWalletSelected(false)
      setBalance('')
      setAdress('')

      window.localStorage.removeItem('selectedWallet')
    }
  }

  return (
    <OnboardContext.Provider value={{
      address, selectWallet, disconnectWallet
    }}>
      {children}
    </OnboardContext.Provider>
  )
}

export const useOnboard = () => useContext(OnboardContext)