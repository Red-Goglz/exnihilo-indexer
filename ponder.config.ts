import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";
import { exnihiloPoolAbi } from "./EXNIHILOPool.js";
import { exnihiloFactoryAbi } from "./EXNIHILOFactory.js";
import { positionNftAbi } from "./PositionNFT.js";
import { lpNftAbi } from "./LpNFT.js";

const FACTORY_ADDRESS = "0xebeB3d8888e51027DddE6745BEBB633236533a18" as const;
const POSITION_NFT_ADDRESS = "0x9B3CE8FAF33ca6AAF998178344482d9d2ec4052E" as const;
const LP_NFT_ADDRESS = "0xF80CC21C7efed26D8f4f3195B70a9c13e74Cab7D" as const;
const START_BLOCK = 53_633_333;

export default createConfig({
  networks: {
    avalancheFuji: {
      chainId: 43113,
      transport: http(process.env.PONDER_RPC_URL_43113),
    },
  },
  contracts: {
    EXNIHILOFactory: {
      network: "avalancheFuji",
      abi: exnihiloFactoryAbi,
      address: FACTORY_ADDRESS,
      startBlock: START_BLOCK,
    },
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
    PositionNFT: {
      network: "avalancheFuji",
      abi: positionNftAbi,
      address: POSITION_NFT_ADDRESS,
      startBlock: START_BLOCK,
    },
    LpNFT: {
      network: "avalancheFuji",
      abi: lpNftAbi,
      address: LP_NFT_ADDRESS,
      startBlock: START_BLOCK,
    },
  },
});
