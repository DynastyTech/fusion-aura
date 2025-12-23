import { MeiliSearch } from 'meilisearch';
import { config } from '../config';
import { Product } from '@prisma/client';

let client: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch | null {
  if (!config.meilisearch.host) {
    return null;
  }

  if (!client) {
    try {
      client = new MeiliSearch({
        host: config.meilisearch.host,
        apiKey: config.meilisearch.masterKey || undefined,
      });
    } catch (error) {
      console.error('Failed to initialize Meilisearch client:', error);
      return null;
    }
  }

  return client;
}

export async function initMeilisearchIndex() {
  const client = getMeilisearchClient();
  if (!client) {
    console.warn('Meilisearch not configured, skipping index initialization');
    return;
  }

  try {
    const index = client.index('products');
    
    // Configure searchable attributes and filters
    await index.updateSearchableAttributes([
      'name',
      'description',
      'shortDescription',
      'categoryName',
    ]);

    await index.updateFilterableAttributes([
      'categoryId',
      'isActive',
      'isFeatured',
      'price',
    ]);

    await index.updateSortableAttributes(['price', 'createdAt']);

    console.log('✅ Meilisearch index configured');
  } catch (error: any) {
    // Index might not exist yet, create it
    if (error.errorCode === 'index_not_found') {
      try {
        await client.createIndex('products', { primaryKey: 'id' });
        await initMeilisearchIndex(); // Retry configuration
      } catch (createError) {
        console.error('Failed to create Meilisearch index:', createError);
      }
    } else {
      console.error('Failed to configure Meilisearch index:', error);
    }
  }
}

export async function indexProduct(product: Product & { category?: { name: string } }) {
  const client = getMeilisearchClient();
  if (!client) {
    return;
  }

  try {
    const index = client.index('products');
    await index.addDocuments([
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        images: product.images,
        categoryId: product.categoryId,
        categoryName: product.category?.name || '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt.toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Failed to index product:', error);
  }
}

export async function deleteProductFromIndex(productId: string) {
  const client = getMeilisearchClient();
  if (!client) {
    return;
  }

  try {
    const index = client.index('products');
    await index.deleteDocument(productId);
  } catch (error) {
    console.error('Failed to delete product from index:', error);
  }
}

export async function searchProducts(
  query: string,
  filters?: {
    categoryId?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  },
  options?: {
    limit?: number;
    offset?: number;
    sort?: string[];
  }
) {
  const client = getMeilisearchClient();
  if (!client) {
    return null;
  }

  try {
    const index = client.index('products');
    
    const filterArray: string[] = [];
    if (filters?.categoryId) {
      filterArray.push(`categoryId = ${filters.categoryId}`);
    }
    if (filters?.isFeatured !== undefined) {
      filterArray.push(`isFeatured = ${filters.isFeatured}`);
    }
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      const priceFilter: string[] = [];
      if (filters.minPrice !== undefined) {
        priceFilter.push(`price >= ${filters.minPrice}`);
      }
      if (filters.maxPrice !== undefined) {
        priceFilter.push(`price <= ${filters.maxPrice}`);
      }
      filterArray.push(priceFilter.join(' AND '));
    }

    const result = await index.search(query, {
      filter: filterArray.length > 0 ? filterArray.join(' AND ') : undefined,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      sort: options?.sort || ['createdAt:desc'],
    });

    return result;
  } catch (error) {
    console.error('Meilisearch search error:', error);
    return null;
  }
}

