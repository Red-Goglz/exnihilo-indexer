import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";
import { exnihiloPoolAbi } from "./EXNIHILOPool.js";
import { exnihiloFactoryAbi } from "./EXNIHILOFactory.js";
import { positionNftAbi } from "./PositionNFT.js";
import { lpNftAbi } from "./LpNFT.js";

const FACTORY_ADDRESS = "0xA07e1d24a2df2284210e44A01C95EB471C0EC7a7" as const;
const POSITION_NFT_ADDRESS = "0x6818a4c71E8271CFD765900F10A24a46aF7fB88a" as const;
const LP_NFT_ADDRESS = "0x770960d23C6fa38dA748AFcDbE1865CEC4f74C9d" as const;
const START_BLOCK = 54_312_537;

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
