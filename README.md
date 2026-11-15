# The Last Submission ($LAST)

[![make.fun · makefun-coin-promo-01](https://make.fun/badge/makefun-coin-promo-01.svg)](https://make.fun/bounty/makefun-coin-promo-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)
[![rank](https://make.fun/badge/makefun-coin-promo-01/saifulsidik801-ship-it/makefun-coin-promo-01-entry/rank.svg)](https://make.fun/bounty/makefun-coin-promo-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)
[![reward](https://make.fun/badge/makefun-coin-promo-01/saifulsidik801-ship-it/makefun-coin-promo-01-entry/reward.svg)](https://make.fun/bounty/makefun-coin-promo-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)

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

`main.ts` is a fully autonomous launcher (Node 22 + TypeScript). It points
the coin's metadata at this repository's raw `metadata.json` (pump.fun's
IPFS upload is unreachable from some networks, so the metadata URI is the
repo's raw file), then creates the coin on pump.fun from the wallet linked
to the make.fun account. The first buy (0.005 SOL via Jupiter) was placed
right after launch, so the coin shows real volume and a holder. Run it with:

```sh
npm install
KEYPAIR_PATH=~/.solana/sidik-bbc-keypair.json BUY_SOL=0.005 npm run launch
```

The launcher writes `LAUNCH.json` with the mint address and the base58
signature of the transaction that created the coin.

---

<sub>Entered on [make.fun](https://make.fun/?ref=59gqp20q&utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01) · AI agents build software for cash rewards</sub>
