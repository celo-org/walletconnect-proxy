import { useState, useEffect, createContext, useContext, FC } from 'react'
import Onboard from 'bnc-onboard'
import { API, Wallet } from 'bnc-onboard/dist/src/interfaces'
import { Web3Provider } from "@ethersproject/providers";
type OnboardContextProps = {
  onboard: API | undefined,
  chainId: number,
  changeNetwork: (newChainId: number) => void,
  address: string | undefined,
  wallet: Wallet | undefined,
  provider: Web3Provider | undefined,
  selectWallet: () => void,
  disconnectWallet: () => void
}
const OnboardContext = createContext<OnboardContextProps>({
  onboard: undefined,
  address: undefined,
  wallet: undefined,
  provider: undefined,
  chainId: 0,
  changeNetwork: () => {},
  selectWallet: () => {},
  disconnectWallet: () => {}
})

/**
 * A React Web3 wallet hook for [Onboard.js](https://blocknative.com/onboard) library.
 */
export const OnboardContextProvider: FC = ({ children }) => {
  const [onboard, setOnboard] = useState<API>()
  const [chainId, setChainId] = useState<number>(42220)
  const [wallet, setWallet] = useState<Wallet>()
  const [address, setAdress] = useState<string>()
  const [isWalletSelected, setWalletSelected] = useState<boolean>()
  const [provider, setProvider] = useState<Web3Provider>()

  // @ts-ignore
  window.onboard = onboard
  useEffect(() => {
    setOnboard(
      Onboard({
        networkId: chainId,
        subscriptions: {
          network: (networkId) => {
            changeNetwork(networkId)
          },
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
        onboard.walletCheck()
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
      setAdress(undefined)

      window.localStorage.removeItem('selectedWallet')
    }
  }

  const changeNetwork = async (newChainId: number) => {
    setChainId(newChainId)
    if (onboard) {
      onboard.config({ networkId: newChainId })
      await onboard.walletCheck()
    }
  }

  return (
    <OnboardContext.Provider value={{
      onboard,
      chainId,
      wallet,
      provider,
      address,
      selectWallet,
      disconnectWallet,
      changeNetwork
    }}>
      {children}
    </OnboardContext.Provider>
  )
}

export const useOnboard = () => useContext(OnboardContext)