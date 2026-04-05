import { ponder } from "ponder:registry";
import {
  position,
  lpOwnership,
  priceSnapshot,
  poolMetrics,
  protocolMetrics,
  userActivity,
  dailyMetrics,
} from "ponder:schema";
import { exnihiloPoolAbi } from "../EXNIHILOPool.js";
import { positionNftAbi } from "../PositionNFT.js";
import { lpNftAbi } from "../LpNFT.js";

// ── Constants ───────────────────────────────────────────────────────────────

const POSITION_NFT = "0x9B3CE8FAF33ca6AAF998178344482d9d2ec4052E" as const;
const LP_NFT = "0xF80CC21C7efed26D8f4f3195B70a9c13e74Cab7D" as const;

const PROTOCOL_FEE_BPS = 200n;
const LP_FEE_BPS = 300n;
const TOTAL_FEE_BPS = PROTOCOL_FEE_BPS + LP_FEE_BPS; // 500 = 5%

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function dayTimestamp(ts: bigint): bigint {
  return (ts / 86400n) * 86400n;
}

// ── Snapshot prices ─────────────────────────────────────────────────────────

async function snapshotPrices(
  context: any,
  poolAddress: `0x${string}`,
  event: any,
  eventType: string,
) {
  const [backedAirToken, backedAirUsd, longPriceVal, shortPriceVal] =
    await Promise.all([
      context.client.readContract({ abi: exnihiloPoolAbi, address: poolAddress, functionName: "backedAirToken" }),
      context.client.readContract({ abi: exnihiloPoolAbi, address: poolAddress, functionName: "backedAirUsd" }),
      context.client.readContract({ abi: exnihiloPoolAbi, address: poolAddress, functionName: "longPrice" }),
      context.client.readContract({ abi: exnihiloPoolAbi, address: poolAddress, functionName: "shortPrice" }),
    ]);

  const spotPrice = backedAirToken > 0n
    ? (backedAirUsd * 10n ** 18n) / backedAirToken
    : 0n;

  await context.db.insert(priceSnapshot).values({
    id: `${poolAddress}-${event.block.number}-${event.log.logIndex}`,
    pool: poolAddress,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    backedAirToken,
    backedAirUsd,
    spotPrice,
    longPrice: longPriceVal,
    shortPrice: shortPriceVal,
    eventType,
  });
}

// ── Update pool metrics ─────────────────────────────────────────────────────

async function updatePoolMetrics(
  context: any,
  pool: `0x${string}`,
  timestamp: bigint,
  updates: {
    positionVolume?: bigint;
    totalFees?: bigint;
    lpFees?: bigint;
    protocolFees?: bigint;
    longCount?: number;
    shortCount?: number;
    closeCount?: number;
    totalPayout?: bigint;
  },
) {
  await context.db
    .insert(poolMetrics)
    .values({
      address: pool,
      positionVolume: updates.positionVolume ?? 0n,
      totalFees: updates.totalFees ?? 0n,
      lpFees: updates.lpFees ?? 0n,
      protocolFees: updates.protocolFees ?? 0n,
      longCount: updates.longCount ?? 0,
      shortCount: updates.shortCount ?? 0,
      closeCount: updates.closeCount ?? 0,
      totalPayout: updates.totalPayout ?? 0n,
      lastUpdated: timestamp,
    })
    .onConflictDoUpdate((row: any) => ({
      positionVolume: row.positionVolume + (updates.positionVolume ?? 0n),
      totalFees: row.totalFees + (updates.totalFees ?? 0n),
      lpFees: row.lpFees + (updates.lpFees ?? 0n),
      protocolFees: row.protocolFees + (updates.protocolFees ?? 0n),
      longCount: row.longCount + (updates.longCount ?? 0),
      shortCount: row.shortCount + (updates.shortCount ?? 0),
      closeCount: row.closeCount + (updates.closeCount ?? 0),
      totalPayout: row.totalPayout + (updates.totalPayout ?? 0n),
      lastUpdated: timestamp,
    }));
}

// ── Update protocol metrics ─────────────────────────────────────────────────

async function updateProtocolMetrics(
  context: any,
  timestamp: bigint,
  updates: {
    positionVolume?: bigint;
    fees?: bigint;
    lpFees?: bigint;
    protocolFees?: bigint;
    positions?: number;
    closes?: number;
    totalPayout?: bigint;
    newPool?: boolean;
  },
) {
  await context.db
    .insert(protocolMetrics)
    .values({
      id: "global",
      totalPositionVolume: updates.positionVolume ?? 0n,
      totalFees: updates.fees ?? 0n,
      totalLpFees: updates.lpFees ?? 0n,
      totalProtocolFees: updates.protocolFees ?? 0n,
      totalPositions: updates.positions ?? 0,
      totalCloses: updates.closes ?? 0,
      totalPayout: updates.totalPayout ?? 0n,
      poolCount: updates.newPool ? 1 : 0,
      lastUpdated: timestamp,
    })
    .onConflictDoUpdate((row: any) => ({
      totalPositionVolume: row.totalPositionVolume + (updates.positionVolume ?? 0n),
      totalFees: row.totalFees + (updates.fees ?? 0n),
      totalLpFees: row.totalLpFees + (updates.lpFees ?? 0n),
      totalProtocolFees: row.totalProtocolFees + (updates.protocolFees ?? 0n),
      totalPositions: row.totalPositions + (updates.positions ?? 0),
      totalCloses: row.totalCloses + (updates.closes ?? 0),
      totalPayout: row.totalPayout + (updates.totalPayout ?? 0n),
      poolCount: row.poolCount + (updates.newPool ? 1 : 0),
      lastUpdated: timestamp,
    }));
}

// ── Track user activity ─────────────────────────────────────────────────────

async function trackUser(
  context: any,
  user: `0x${string}`,
  timestamp: bigint,
  updates: {
    longCount?: number;
    shortCount?: number;
    closeCount?: number;
    volume?: bigint;
    feesPaid?: bigint;
    totalPayout?: bigint;
  },
) {
  await context.db
    .insert(userActivity)
    .values({
      address: user,
      firstSeen: timestamp,
      lastSeen: timestamp,
      longCount: updates.longCount ?? 0,
      shortCount: updates.shortCount ?? 0,
      closeCount: updates.closeCount ?? 0,
      totalVolume: updates.volume ?? 0n,
      totalFeesPaid: updates.feesPaid ?? 0n,
      totalPayout: updates.totalPayout ?? 0n,
    })
    .onConflictDoUpdate((row: any) => ({
      lastSeen: timestamp,
      longCount: row.longCount + (updates.longCount ?? 0),
      shortCount: row.shortCount + (updates.shortCount ?? 0),
      closeCount: row.closeCount + (updates.closeCount ?? 0),
      totalVolume: row.totalVolume + (updates.volume ?? 0n),
      totalFeesPaid: row.totalFeesPaid + (updates.feesPaid ?? 0n),
      totalPayout: row.totalPayout + (updates.totalPayout ?? 0n),
    }));
}

// ── Update daily metrics ────────────────────────────────────────────────────

async function updateDaily(
  context: any,
  pool: `0x${string}`,
  timestamp: bigint,
  volume: bigint,
  fees: bigint,
  positions: number,
  closes: number,
  lpFees: bigint = 0n,
) {
  const day = dayTimestamp(timestamp);

  // Per-pool daily
  await context.db
    .insert(dailyMetrics)
    .values({
      id: `${pool}-${day}`,
      pool,
      dayTimestamp: day,
      volume,
      fees,
      lpFees,
      positionCount: positions,
      closeCount: closes,
      uniqueUsers: 1,
    })
    .onConflictDoUpdate((row: any) => ({
      volume: row.volume + volume,
      fees: row.fees + fees,
      lpFees: row.lpFees + lpFees,
      positionCount: row.positionCount + positions,
      closeCount: row.closeCount + closes,
      uniqueUsers: row.uniqueUsers + 1,
    }));

  // Global daily
  await context.db
    .insert(dailyMetrics)
    .values({
      id: `global-${day}`,
      pool: ZERO_ADDR,
      dayTimestamp: day,
      volume,
      fees,
      lpFees,
      positionCount: positions,
      closeCount: closes,
      uniqueUsers: 1,
    })
    .onConflictDoUpdate((row: any) => ({
      volume: row.volume + volume,
      fees: row.fees + fees,
      lpFees: row.lpFees + lpFees,
      positionCount: row.positionCount + positions,
      closeCount: row.closeCount + closes,
      uniqueUsers: row.uniqueUsers + 1,
    }));
}

// ── Factory: new market ─────────────────────────────────────────────────────

ponder.on("EXNIHILOFactory:MarketCreated", async ({ event, context }) => {
  const ts = BigInt(event.block.timestamp);
  const { pool, creator, lpNftId } = event.args;

  // Track LP ownership
  await context.db.insert(lpOwnership).values({
    nftId: lpNftId,
    pool,
    owner: creator,
  });

  await updateProtocolMetrics(context, ts, { newPool: true });
  await trackUser(context, creator, ts, {});
});

// ── Pool: position opened ───────────────────────────────────────────────────

ponder.on("EXNIHILOPool:PositionOpened", async ({ event, context }) => {
  const pool = event.log.address;
  const ts = BigInt(event.block.timestamp);
  const { nftId, holder, isLong } = event.args;

  // Read full position data from the NFT contract
  const posData = await context.client.readContract({
    abi: positionNftAbi,
    address: POSITION_NFT,
    functionName: "getPosition",
    args: [nftId],
  });

  const volume = posData.usdcIn;
  const totalFee = posData.feesPaid;
  const lpFee = (totalFee * LP_FEE_BPS) / TOTAL_FEE_BPS;
  const protocolFee = totalFee - lpFee;

  // Store position
  await context.db.insert(position).values({
    nftId,
    pool,
    holder,
    isLong,
    lockedToken: posData.lockedToken,
    lockedAmount: posData.lockedAmount,
    usdcIn: posData.usdcIn,
    airUsdMinted: posData.airUsdMinted,
    airTokenMinted: posData.airTokenMinted,
    feesPaid: posData.feesPaid,
    openedAt: posData.openedAt,
    deadline: posData.deadline,
    status: "open",
    payout: 0n,
    closedAt: 0n,
  });

  await snapshotPrices(context, pool, event, "positionOpened");

  await updatePoolMetrics(context, pool, ts, {
    positionVolume: volume,
    totalFees: totalFee,
    lpFees: lpFee,
    protocolFees: protocolFee,
    longCount: isLong ? 1 : 0,
    shortCount: isLong ? 0 : 1,
  });

  await updateProtocolMetrics(context, ts, {
    positionVolume: volume,
    fees: totalFee,
    lpFees: lpFee,
    protocolFees: protocolFee,
    positions: 1,
  });

  await trackUser(context, holder, ts, {
    longCount: isLong ? 1 : 0,
    shortCount: isLong ? 0 : 1,
    volume,
    feesPaid: totalFee,
  });

  await updateDaily(context, pool, ts, volume, totalFee, 1, 0, lpFee);
});

// ── Pool: position closed (by holder) ───────────────────────────────────────

ponder.on("EXNIHILOPool:PositionClosed", async ({ event, context }) => {
  const pool = event.log.address;
  const ts = BigInt(event.block.timestamp);
  const { nftId, holder, payout } = event.args;

  await context.db.update(position, { nftId }).set({
    status: "closed",
    payout,
    closedAt: ts,
  });

  await snapshotPrices(context, pool, event, "positionClosed");
  await updatePoolMetrics(context, pool, ts, { closeCount: 1, totalPayout: payout });
  await updateProtocolMetrics(context, ts, { closes: 1, totalPayout: payout });
  await trackUser(context, holder, ts, { closeCount: 1, totalPayout: payout });
  await updateDaily(context, pool, ts, 0n, 0n, 0, 1);
});

// ── Pool: position closed after deadline (by anyone) ────────────────────────

ponder.on("EXNIHILOPool:PositionClosedAfterDeadline", async ({ event, context }) => {
  const pool = event.log.address;
  const ts = BigInt(event.block.timestamp);
  const { nftId, caller, payout } = event.args;

  await context.db.update(position, { nftId }).set({
    status: "expired",
    payout,
    closedAt: ts,
  });

  await snapshotPrices(context, pool, event, "positionExpired");
  await updatePoolMetrics(context, pool, ts, { closeCount: 1, totalPayout: payout });
  await updateProtocolMetrics(context, ts, { closes: 1, totalPayout: payout });
  await trackUser(context, caller, ts, { closeCount: 1, totalPayout: payout });
  await updateDaily(context, pool, ts, 0n, 0n, 0, 1);
});

// ── Pool: pool closed ───────────────────────────────────────────────────────

ponder.on("EXNIHILOPool:PoolClosed", async ({ event, context }) => {
  const pool = event.log.address;
  const ts = BigInt(event.block.timestamp);

  await snapshotPrices(context, pool, event, "poolClosed");
  await trackUser(context, event.args.closedBy, ts, {});
});

// ── PositionNFT: transfers (ownership changes only) ─────────────────────────

ponder.on("PositionNFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;

  // Skip mints (handled by PositionOpened) and burns (handled by PositionClosed)
  if (from === ZERO_ADDR || to === ZERO_ADDR) return;

  await context.db.update(position, { nftId: tokenId }).set({
    holder: to,
  });
});

// ── LpNFT: transfers (ownership changes only) ──────────────────────────────

ponder.on("LpNFT:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;

  // Skip mints (handled by MarketCreated) and burns
  if (from === ZERO_ADDR || to === ZERO_ADDR) return;

  // Read pool from contract in case record doesn't exist yet
  const pool = await context.client.readContract({
    abi: lpNftAbi,
    address: LP_NFT,
    functionName: "poolOf",
    args: [tokenId],
  });

  await context.db
    .insert(lpOwnership)
    .values({ nftId: tokenId, pool, owner: to })
    .onConflictDoUpdate(() => ({ owner: to }));
});
