import {
  BuiltInAddressInfoFetcher,
  ContextAddressInfoFetcher,
  GenericAddressListEntry,
  GenericAddressListInfoFetcher,
  getAbiFetchersForChainId,
  NETWORKS,
  Parser,
  TokenListAddressInfoFetcher,
} from "no-yolo-signatures";
import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useState,
} from "react";
import { useOnboard } from "./use-onboard";

export const USER_SOURCE = "user_source";
const CUSTOM_ADDRESSES_PERSIST_KEY = "/noYoloSignatures/customAddresses";
type NoYoloParserContextProps = {
  parser: Parser;
  addressInfoFetchers: BuiltInAddressInfoFetcher[];
  customAddresses: GenericAddressListEntry[];
  addCustomAddress: (entry: GenericAddressListEntry) => void;
  removeCustomAddress: (index: number) => void;
};

const NoYoloParserContext = createContext<NoYoloParserContextProps>({
  parser: new Parser({}),
  addressInfoFetchers: [],
  customAddresses: [],
  addCustomAddress: () => {},
  removeCustomAddress: () => {},
});

export const NoYoloContextProvider: FC = ({ children }) => {
  const { chainId } = useOnboard();
  const [addressInfoFetchers, setAddressInfoFetchers] = useState<
    BuiltInAddressInfoFetcher[]
  >([]);

  const [customAddresses, setCustomAddresses] = useState<
    GenericAddressListEntry[]
  >([]);
  const [parser, setParser] = useState<Parser>(new Parser({}));

  useEffect(() => {
    const persistedCustomAddresses =
      window.localStorage.getItem(CUSTOM_ADDRESSES_PERSIST_KEY) || "[]";
    setCustomAddresses(JSON.parse(persistedCustomAddresses));
  }, []);

  const setAndPersistCustomAddresses = (
    action: (oldEntries: GenericAddressListEntry[]) => GenericAddressListEntry[]
  ) => {
    setCustomAddresses((customAddresses) => {
      const newCustomAddresses = action(customAddresses);
      window.localStorage.setItem(
        CUSTOM_ADDRESSES_PERSIST_KEY,
        JSON.stringify(newCustomAddresses)
      );
      return newCustomAddresses;
    });
  };

  useEffect(() => {
    async function fetch() {
      const contextFetcher = new ContextAddressInfoFetcher();
      const network = NETWORKS[chainId];
      if (!network) {
        setAddressInfoFetchers([contextFetcher]);
      }
      setAddressInfoFetchers(
        [
          network.genericAddressListUrl
            ? [
                await GenericAddressListInfoFetcher.fromURL(
                  network.genericAddressListUrl
                ),
              ]
            : [],
          network.tokenListUrl
            ? [await TokenListAddressInfoFetcher.fromURL(network.tokenListUrl)]
            : [],
          [contextFetcher],
        ].flat()
      );
    }

    fetch().catch(console.error);
  }, [chainId]);

  useEffect(() => {
    const abiFetchers = getAbiFetchersForChainId(chainId);
    setParser(
      new Parser({
        abiFetchers,
        addressInfoFetchers: [
          ...addressInfoFetchers,
          new GenericAddressListInfoFetcher(
            { addresses: customAddresses },
            USER_SOURCE
          ),
        ],
      })
    );
  }, [chainId, addressInfoFetchers, customAddresses]);

  const addCustomAddress = (entry: GenericAddressListEntry) =>
    setAndPersistCustomAddresses((_) => [..._, entry]);
  const removeCustomAddress = (index: number) =>
    setAndPersistCustomAddresses((_) => {
      const ret = [..._];
      ret.splice(index, 1);
      return ret;
    });

  return (
    <NoYoloParserContext.Provider
      value={{
        parser,
        addressInfoFetchers,
        customAddresses,
        addCustomAddress,
        removeCustomAddress,
      }}
    >
      {children}
    </NoYoloParserContext.Provider>
  );
};

export const useNoYoloParser = () => useContext(NoYoloParserContext);
