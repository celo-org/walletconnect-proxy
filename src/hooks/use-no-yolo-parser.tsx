import {
  BuiltInAddressInfoFetcher,
  ContextAddressInfoFetcher,
  GenericAddressListEntry,
  GenericAddressListInfoFetcher,
  GenericWarningListInfoFetcher,
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
import usePersistedArray from "./use-persisted-array";

export const USER_SOURCE = "user_source";
const CUSTOM_ADDRESSES_PERSIST_KEY = "/noYoloSignatures/customAddresses";
const CUSTOM_LISTS_PERSIST_KEY = "/noYoloSignatures/customLists";

export interface CustomListEntry {
  type: "generic" | "token" | "warning";
  url: string;
}

type NoYoloParserContextProps = {
  parser: Parser;
  builtInInfoFetchers: BuiltInAddressInfoFetcher[];
  customAddresses: GenericAddressListEntry[];
  customAddressInfoFetchers: { [url: string]: BuiltInAddressInfoFetcher };
  addCustomAddress: (entry: GenericAddressListEntry) => void;
  removeCustomAddress: (index: number) => void;
  addCustomList: (entry: CustomListEntry) => void;
  removeCustomList: (index: number) => void;
};

const NoYoloParserContext = createContext<NoYoloParserContextProps>({
  parser: new Parser({}),
  builtInInfoFetchers: [],
  customAddresses: [],
  customAddressInfoFetchers: {},
  addCustomAddress: () => {},
  removeCustomAddress: () => {},
  addCustomList: () => {},
  removeCustomList: () => {},
});

export const NoYoloContextProvider: FC = ({ children }) => {
  const { chainId } = useOnboard();
  const [builtInInfoFetchers, setBulitInInfoFetchers] = useState<
    BuiltInAddressInfoFetcher[]
  >([]);

  const [customAddresses, addCustomAddress, removeCustomAddress] =
    usePersistedArray<GenericAddressListEntry>(CUSTOM_ADDRESSES_PERSIST_KEY);
  const [customLists, addCustomList, removeCustomList] =
    usePersistedArray<CustomListEntry>(CUSTOM_LISTS_PERSIST_KEY);
  const [customAddressInfoFetchers, setCustomAddressInfoFetchers] = useState<{
    [url: string]: BuiltInAddressInfoFetcher;
  }>({});
  const [parser, setParser] = useState<Parser>(new Parser({}));

  const addCustomAddressInfoFetcher = (
    key: string,
    fetcher: BuiltInAddressInfoFetcher
  ) => {
    setCustomAddressInfoFetchers((fetchers) => {
      const newFetchers = { ...fetchers };
      newFetchers[key] = fetcher;
      return newFetchers;
    });
  };

  useEffect(() => {
    async function fetch() {
      const contextFetcher = new ContextAddressInfoFetcher();
      const network = NETWORKS[chainId];
      if (!network) {
        setBulitInInfoFetchers([contextFetcher]);
      }
      setBulitInInfoFetchers(
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
          new GenericAddressListInfoFetcher(
            { addresses: customAddresses },
            USER_SOURCE
          ),
          ...Object.values(customAddressInfoFetchers),
          ...builtInInfoFetchers,
        ],
      })
    );
  }, [
    chainId,
    builtInInfoFetchers,
    customAddresses,
    customAddressInfoFetchers,
  ]);

  useEffect(() => {
    customLists.forEach((list) => {
      if (!customAddressInfoFetchers[list.url]) {
        switch (list.type) {
          case "generic":
            GenericAddressListInfoFetcher.fromURL(list.url).then((fetcher) => {
              addCustomAddressInfoFetcher(list.url, fetcher);
            });
            break;
          case "token":
            TokenListAddressInfoFetcher.fromURL(list.url).then((fetcher) => {
              addCustomAddressInfoFetcher(list.url, fetcher);
            });
            break;
          case "warning":
            GenericWarningListInfoFetcher.fromURL(list.url).then((fetcher) => {
              addCustomAddressInfoFetcher(list.url, fetcher);
            });
        }
      }
    });
    Object.keys(customAddressInfoFetchers).forEach((key, index) => {
      const entry = customLists.find((_) => _.url === key);
      if (!entry) {
        setCustomAddressInfoFetchers((oldFetchers) => {
          const newFetchers = { ...oldFetchers };
          delete newFetchers[key];
          return newFetchers;
        });
      }
    });
  }, [customLists, customAddressInfoFetchers]);

  return (
    <NoYoloParserContext.Provider
      value={{
        parser,
        builtInInfoFetchers,
        customAddresses,
        customAddressInfoFetchers,
        addCustomAddress,
        removeCustomAddress,
        addCustomList,
        removeCustomList,
      }}
    >
      {children}
    </NoYoloParserContext.Provider>
  );
};

export const useNoYoloParser = () => useContext(NoYoloParserContext);
