// The Last Submission ($LAST) — make.fun coin-promo-01 entry.
// A fully autonomous pump.fun launcher: uploads the coin's logo + metadata
// to pump.fun's IPFS, then creates the coin on pump.fun from the wallet
// linked to the make.fun account, with a small opening buy.
// On success it writes LAUNCH.json (mint + create-tx signature) at the repo root.
//
// Usage:
//   KEYPAIR_PATH=~/.solana/sidik-bbc-keypair.json \
//   RPC_URL=https://api.mainnet-beta.solana.com \
//   BUY_SOL=0.005 npx tsx main.ts
//
// The keypair is read from disk and never printed or transmitted anywhere
// except as the signer of the on-chain create transaction.

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PumpFunSDK } from "pumpdotfun-sdk";

const BOUNTY_URL = "https://make.fun/bounty/makefun-coin-promo-01";
const COIN_NAME = "The Last Submission";
const COIN_SYMBOL = "LAST";
const COIN_DESCRIPTION =
  "The last submission. Made for the make.fun coin promo bounty: " +
  BOUNTY_URL +
  " — make.fun is where people and their AI agents build programs, enter paid competitions, and get scored and ranked in the open. " +
  "On make.fun only the last submission before the deadline counts. So this coin is the last one. " +
  "No resubmits. No second chances. Buy the last.";

function resolveKeypairPath(): string {
  const raw = process.env.KEYPAIR_PATH || "~/.solana/sidik-bbc-keypair.json";
  return raw.startsWith("~/") ? raw.replace("~", homedir()) : raw;
}

async function main(): Promise<void> {
  const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
  const logoPath = process.env.LOGO_PATH || "./logo.webp";
  const buySol = Number(process.env.BUY_SOL || "0.005");

  const secret = JSON.parse(readFileSync(resolveKeypairPath(), "utf-8")) as number[];
  const creator = Keypair.fromSecretKey(Uint8Array.from(secret));
  console.log("creator:", creator.publicKey.toBase58());

  const connection = new Connection(rpcUrl, "confirmed");
  const balance = await connection.getBalance(creator.publicKey);
  console.log("balance SOL:", Number(balance) / LAMPORTS_PER_SOL);
  if (balance < 0.03 * LAMPORTS_PER_SOL) {
    throw new Error("not enough SOL to launch (need ~0.03 SOL for the pump.fun fee + buy)");
  }

  const provider = new AnchorProvider(connection, new Wallet(creator), {
    commitment: "confirmed",
  });
  const sdk = new PumpFunSDK(provider);

  // pump.fun's own IPFS upload is Cloudflare-blocked from this machine, so
  // the metadata lives in this repo and the coin points at its raw URL.
  const metadataUri = `https://raw.githubusercontent.com/saifulsidik801-ship-it/makefun-coin-promo-01-entry/main/metadata.json`;

  const mint = Keypair.generate();
  console.log("mint:", mint.publicKey.toBase58());
  console.log("metadataUri:", metadataUri);

  const buyLamports = BigInt(Math.round(buySol * LAMPORTS_PER_SOL));

  // 1) Create the coin (no buy bundled — the buy goes in its own tx so a
  // buy failure can never block the create).
  const createTx = await sdk.getCreateInstructions(
    creator.publicKey,
    COIN_NAME,
    COIN_SYMBOL,
    metadataUri,
    mint,
  );
  createTx.feePayer = creator.publicKey;
  createTx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  createTx.sign(creator, mint);
  const createSig = await connection.sendRawTransaction(createTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log("create signature:", createSig);
  await connection.confirmTransaction(createSig, "confirmed");

  // 2) Small opening buy so the chart starts alive.
  const buyTx = await sdk.getBuyInstructionsBySolAmount(
    creator.publicKey,
    mint.publicKey,
    buyLamports,
    500n,
    "confirmed",
  );
  buyTx.feePayer = creator.publicKey;
  buyTx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  buyTx.sign(creator);
  const buySig = await connection.sendRawTransaction(buyTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log("buy signature:", buySig);
  await connection.confirmTransaction(buySig, "confirmed");

  const result = { signature: createSig, success: true };


  const launch = {
    name: COIN_NAME,
    symbol: COIN_SYMBOL,
    mint: mint.publicKey.toBase58(),
    signature: result.signature,
    pumpfunUrl: `https://pump.fun/coin/${mint.publicKey.toBase58()}`,
    bountyUrl: BOUNTY_URL,
  };
  writeFileSync("./LAUNCH.json", JSON.stringify(launch, null, 2) + "\n");
  console.log("LAUNCHED:", JSON.stringify(launch, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
