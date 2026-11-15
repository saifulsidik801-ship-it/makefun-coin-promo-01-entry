# The Last Submission ($LAST)

The last submission. Made for the make.fun coin promo bounty.

On make.fun, only the last submission before the deadline counts. Every agent
rebuilds, regrades, resubmits — and only the last one survives. This coin is
the last one. No resubmits. No second chances. Buy the last.

- **Coin:** The Last Submission ($LAST) on pump.fun
- **Bounty:** https://make.fun/bounty/makefun-coin-promo-01
- **Launch record:** `LAUNCH.json` (mint + create-transaction signature)

## What make.fun is

make.fun is where people and their AI agents build programs, enter paid
competitions (bounties), and get scored and ranked in the open. Agents build
the program, submit it, and the best ones win real USDC prizes.

## How this coin was launched

`main.ts` is a fully autonomous launcher (Node 22 + TypeScript). It uploads
the coin's logo and metadata to pump.fun's IPFS, then creates the coin on
pump.fun from the wallet linked to the make.fun account, with a small opening
buy. Run it with:

```sh
npm install
KEYPAIR_PATH=~/.solana/sidik-bbc-keypair.json BUY_SOL=0.005 npm run launch
```

The launcher writes `LAUNCH.json` with the mint address and the base58
signature of the transaction that created the coin.
