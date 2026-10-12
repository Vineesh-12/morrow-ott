/**
 * Morrow OTT Platform — Catalogue Repository Boundary & Factory
 * Defines the abstract catalogue data access interface and provides
 * factory resolution based on the explicit DATA_SOURCE configuration.
 *
 * Supported DATA_SOURCE values:
 * - 'fixture': Phase 4 development fixture repository (backed by local JSON)
 * - 'dynamodb': Phase 5 production repository (backed by Amazon DynamoDB 'MorrowVideos')
 */

import { FixtureCatalogueRepository } from './fixtureRepository.mjs';
import { DynamoDbCatalogueRepository } from './dynamoDbRepository.mjs';
import { BaseCatalogueRepository, DataSourceUnavailableError } from './baseRepository.mjs';

export { BaseCatalogueRepository, DataSourceUnavailableError };

// Cached singleton repository instance
let repositoryInstance = null;

/**
 * Factory function to retrieve the configured repository.
 * Enforces explicit configuration and guards against silent fallbacks.
 *
 * @param {string} [overrideSource] - Optional override for testing
 * @returns {BaseCatalogueRepository}
 */
export function getCatalogueRepository(overrideSource) {
  const dataSource = (overrideSource || process.env.DATA_SOURCE || 'fixture').toLowerCase().trim();

  if (dataSource === 'fixture') {
    if (!repositoryInstance || overrideSource) {
      repositoryInstance = new FixtureCatalogueRepository();
    }
    return repositoryInstance;
  }

  if (dataSource === 'dynamodb') {
    if (!repositoryInstance || overrideSource) {
      repositoryInstance = new DynamoDbCatalogueRepository();
    }
    return repositoryInstance;
  }

  // Any other unsupported data source
  throw new DataSourceUnavailableError(
    `Unsupported or unconfigured DATA_SOURCE: '${dataSource}'. Valid options are 'fixture' and 'dynamodb'.`
  );
}

/**
 * Helper to reset the singleton (for testing).
 */
export function resetRepositoryInstance() {
  repositoryInstance = null;
}
