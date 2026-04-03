import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";
import { exnihiloPoolAbi } from "./EXNIHILOPool.js";

const FACTORY_ADDRESS = "0xDba4FCd283365Ecc773017c6EECbfd7525424211" as const;
const START_BLOCK = 53_595_718;

export default createConfig({
  networks: {
    avalancheFuji: {
      chainId: 43113,
      transport: http(process.env.PONDER_RPC_URL_43113),
    },
  },
  contracts: {
    EXNIHILOPool: {
      network: "avalancheFuji",
      abi: exnihiloPoolAbi,
      address: factory({
        address: FACTORY_ADDRESS,
        event: parseAbiItem(
          "event MarketCreated(address indexed pool, address indexed tokenAddress, address indexed creator, uint256 lpNftId)"
        ),
        parameter: "pool",
      }),
      startBlock: START_BLOCK,
    },
  },
});
