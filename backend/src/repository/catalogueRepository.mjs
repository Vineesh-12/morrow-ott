/**
 * Morrow OTT Platform — Catalogue Repository Boundary & Factory
 * Defines the abstract catalogue data access interface and provides
 * factory resolution based on the explicit DATA_SOURCE configuration.
 *
 * Phase 4 uses FixtureCatalogueRepository (DATA_SOURCE=fixture).
 * Phase 5 will introduce DynamoDbCatalogueRepository without modifying route logic.
 */

import { FixtureCatalogueRepository } from './fixtureRepository.mjs';
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
    // Explicit Phase 5 Boundary Guard: Fail loudly and safely.
    // Do not silently fall back to fixture data.
    throw new DataSourceUnavailableError(
      'DynamoDB data source is planned for Phase 5 and is not yet configured. ' +
      'Set DATA_SOURCE=fixture for the Phase 4 development adapter.'
    );
  }

  // Any other unsupported data source
  throw new DataSourceUnavailableError(
    `Unsupported or unconfigured DATA_SOURCE: '${dataSource}'. Valid Phase 4 option is 'fixture'.`
  );
}

/**
 * Helper to reset the singleton (for testing).
 */
export function resetRepositoryInstance() {
  repositoryInstance = null;
}
