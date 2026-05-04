import "server-only";

import { jitoStakeAdapter } from "./jito";
import { jitoSolUnstakeAdapter } from "./jito-unstake";
import { jupiterSolUsdcSwapAdapter } from "./jupiter-swap";
import { kaminoUsdcSupplyAdapter } from "./kamino";
import { kaminoSupplyAndBorrowAdapter } from "./kamino-borrow";
import { kaminoLeverageLoopAdapter } from "./kamino-leverage-loop";
import { kaminoRepayAndWithdrawAdapter } from "./kamino-repay-withdraw";
import { kaminoUsdcWithdrawAdapter } from "./kamino-withdraw";
import { registerAdapter } from "./registry";

let registered = false;

export function registerAllAdapters(): void {
  if (registered) return;
  registerAdapter(jitoStakeAdapter);
  registerAdapter(jitoSolUnstakeAdapter);
  registerAdapter(kaminoUsdcSupplyAdapter);
  registerAdapter(kaminoUsdcWithdrawAdapter);
  registerAdapter(kaminoSupplyAndBorrowAdapter);
  registerAdapter(kaminoRepayAndWithdrawAdapter);
  registerAdapter(kaminoLeverageLoopAdapter);
  registerAdapter(jupiterSolUsdcSwapAdapter);
  registered = true;
}
