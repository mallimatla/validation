/**
 * Integrations Module
 * External data source integrations for enhanced validation accuracy
 */

import { Module, Global } from '@nestjs/common';
import { CrunchbaseService } from './crunchbase.service';
import { LinkedInService } from './linkedin.service';
import { MarketDataService } from './market-data.service';
import { NewsService } from './news.service';
import { IntegrationsService } from './integrations.service';

@Global()
@Module({
  providers: [
    CrunchbaseService,
    LinkedInService,
    MarketDataService,
    NewsService,
    IntegrationsService,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
