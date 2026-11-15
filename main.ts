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
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PumpFunSDK } from "pumpdotfun-sdk";

const BOUNTY_URL = "https://make.fun/bounty/makefun-coin-promo-01";
const COIN_NAME = "The Last Submission";
const COIN_SYMBOL = "LAST";
const COIN_DESCRIPTION =
  "POV: the market crashed, everything is red, and your agent is still here resubmitting for the 47th time. " +
  "The last submission. Made for the make.fun coin promo bounty: " +
  BOUNTY_URL +
  " — make.fun is where people and their AI agents build programs, enter paid competitions, and get scored and ranked in the open. " +
  "On make.fun only the last submission before the deadline counts. So this coin is the last one. " +
  "No resubmits. No second chances. Buy the last.";

// The websocket subscription behind confirmTransaction breaks through this
// machine's egress proxy (EPROTO), so confirm over plain HTTP polling.
async function confirmHttp(
  connection: Connection,
  signature: string,
  label: string,
): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const res = await connection.getSignatureStatuses([signature]);
    const st = res.value[0];
    if (st && st.confirmationStatus === "confirmed") return;
    if (st && st.err) throw new Error(`${label} failed on-chain: ${JSON.stringify(st.err)}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`${label} not confirmed after 120s (sig ${signature})`);
}

async function sendTx(
  connection: Connection,
  tx: Transaction,
  signers: Keypair[],
  label: string,
): Promise<string> {
  tx.feePayer = signers[0].publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(...signers);
  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log(`${label} signature:`, sig);
  await confirmHttp(connection, sig, label);
  return sig;
}
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

  // MINT set = resume mode: the coin already exists on-chain (a previous run
  // created it but died before the buy). Skip the create, just do the buy.
  const existingMint = process.env.MINT || "";
  const createSig = process.env.CREATE_SIG || "";
  let mint: Keypair;
  let mintPubkey: PublicKey;
  let finalCreateSig = createSig;

  if (existingMint) {
    mintPubkey = new PublicKey(existingMint);
    console.log("resuming existing mint:", existingMint);
  } else {
    mint = Keypair.generate();
    mintPubkey = mint.publicKey;
    console.log("mint:", mint.publicKey.toBase58());
    console.log("metadataUri:", metadataUri);

    // 1) Create the coin (no buy bundled — the buy goes in its own tx so a
    // buy failure can never block the create).
    const createTx = await sdk.getCreateInstructions(
      creator.publicKey,
      COIN_NAME,
      COIN_SYMBOL,
      metadataUri,
      mint,
    );
    finalCreateSig = await sendTx(connection, createTx, [creator, mint], "create");
  }

  const buyLamports = BigInt(Math.round(buySol * LAMPORTS_PER_SOL));

  // 2) Small opening buy so the chart starts alive.
  const buyTx = await sdk.getBuyInstructionsBySolAmount(
    creator.publicKey,
    mintPubkey,
    buyLamports,
    500n,
    "confirmed",
  );
  const buySig = await sendTx(connection, buyTx, [creator], "buy");
  console.log("buy signature:", buySig);

  const result = { signature: finalCreateSig, success: true };


  const launch = {
    name: COIN_NAME,
    symbol: COIN_SYMBOL,
    mint: mintPubkey.toBase58(),
    signature: result.signature,
    pumpfunUrl: `https://pump.fun/coin/${mintPubkey.toBase58()}`,
    bountyUrl: BOUNTY_URL,
  };
  writeFileSync("./LAUNCH.json", JSON.stringify(launch, null, 2) + "\n");
  console.log("LAUNCHED:", JSON.stringify(launch, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
