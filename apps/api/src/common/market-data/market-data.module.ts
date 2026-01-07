/**
 * Market Data Module
 * Provides real market data fetching capabilities
 */

import { Module, Global } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Global()
@Module({
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
