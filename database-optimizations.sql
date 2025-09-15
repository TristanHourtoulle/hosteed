-- ================================
-- HOSTEED DATABASE PERFORMANCE OPTIMIZATIONS
-- Date: December 2024
-- Purpose: Add missing indexes and optimize query performance
-- ================================

-- CRITICAL MISSING INDEXES
-- Based on performance audit findings

-- 1. IMAGES TABLE OPTIMIZATION
-- Problem: N+1 queries for product images
CREATE INDEX IF NOT EXISTS "idx_images_product_lookup" ON "Images"("productId") WHERE "productId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_images_active" ON "Images"("productId", "createdAt") WHERE "productId" IS NOT NULL;

-- 2. SPECIAL PRICES OPTIMIZATION  
-- Problem: Slow lookups for active special prices
CREATE INDEX IF NOT EXISTS "idx_special_prices_active_lookup" ON "SpecialPrices"("productId", "activate") WHERE "activate" = true;
CREATE INDEX IF NOT EXISTS "idx_special_prices_date_range" ON "SpecialPrices"("productId", "startDate", "endDate", "activate") WHERE "activate" = true;

-- 3. RENT AVAILABILITY OPTIMIZATION
-- Problem: Slow availability checking queries  
CREATE INDEX IF NOT EXISTS "idx_rent_availability_check" ON "Rent"("productId", "arrivingDate", "leavingDate", "status");
CREATE INDEX IF NOT EXISTS "idx_rent_date_range" ON "Rent"("arrivingDate", "leavingDate", "status") WHERE "status" != 'CANCELLED';

-- 4. USER MANAGEMENT OPTIMIZATION
-- Problem: Slow user verification and management queries
CREATE INDEX IF NOT EXISTS "idx_user_verification_status" ON "User"("isVerifiedTraveler", "isAccountConfirmed", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_user_role_active" ON "User"("role", "createdAt") WHERE "deletedAt" IS NULL;

-- 5. PRODUCT SEARCH OPTIMIZATION
-- Problem: Slow full-text search and filtering
CREATE INDEX IF NOT EXISTS "idx_product_search_text" ON "Product" USING gin(to_tsvector('french', "name" || ' ' || "description" || ' ' || "address"));
CREATE INDEX IF NOT EXISTS "idx_product_location_search" ON "Product"("latitude", "longitude", "validate") WHERE "validate" = 'Approve';
CREATE INDEX IF NOT EXISTS "idx_product_price_range" ON "Product"("basePrice", "validate", "certified") WHERE "validate" = 'Approve';

-- 6. VALIDATION WORKFLOW OPTIMIZATION
-- Problem: Slow admin validation queries
CREATE INDEX IF NOT EXISTS "idx_validation_comments_status" ON "ValidationComment"("productId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_rejection_resolved" ON "RentRejection"("resolved", "createdAt");

-- 7. REVIEW AND RATING OPTIMIZATION
-- Problem: Slow review aggregation queries
CREATE INDEX IF NOT EXISTS "idx_user_ratings_product" ON "UserRating"("productId", "rating", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_user_ratings_user" ON "UserRating"("userId", "rating", "createdAt");

-- 8. SESSION AND AUTH OPTIMIZATION
-- Problem: Slow session lookups
CREATE INDEX IF NOT EXISTS "idx_sessions_user_expires" ON "Session"("userId", "expires") WHERE "expires" > NOW();
CREATE INDEX IF NOT EXISTS "idx_accounts_provider" ON "Account"("userId", "provider", "providerAccountId");

-- 9. NOTIFICATION OPTIMIZATION  
-- Problem: Slow notification queries
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "Notification"("userId", "read", "createdAt");

-- 10. BLOG AND POSTS OPTIMIZATION
-- Problem: Slow blog post queries
CREATE INDEX IF NOT EXISTS "idx_posts_published" ON "Post"("published", "publishedAt") WHERE "published" = true;
CREATE INDEX IF NOT EXISTS "idx_posts_search" ON "Post" USING gin(to_tsvector('french', "title" || ' ' || "content"));

-- ================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ================================

-- Product search with multiple filters (most common query)
CREATE INDEX IF NOT EXISTS "idx_product_complex_search" ON "Product"(
  "validate", "certified", "typeId", "basePrice", "maxPeople", "latitude", "longitude"
) WHERE "validate" = 'Approve';

-- Host dashboard - products by user with validation status
CREATE INDEX IF NOT EXISTS "idx_product_host_dashboard" ON "Product"(
  "userManager", "validate", "isDraft", "createdAt"
);

-- Admin dashboard - validation workflow
CREATE INDEX IF NOT EXISTS "idx_product_admin_validation" ON "Product"(
  "validate", "certified", "createdAt", "updatedAt"
) WHERE "validate" IN ('NotVerified', 'RecheckRequest');

-- Booking system - availability and pricing
CREATE INDEX IF NOT EXISTS "idx_booking_system" ON "Product"(
  "id", "validate", "certified", "basePrice"
) WHERE "validate" = 'Approve';

-- ================================
-- PERFORMANCE STATISTICS UPDATE  
-- ================================

-- Refresh statistics for better query planning
ANALYZE "Product";
ANALYZE "Images";
ANALYZE "Rent";
ANALYZE "User";
ANALYZE "SpecialPrices";

-- ================================
-- QUERY OPTIMIZATION EXAMPLES
-- ================================

/*
-- BEFORE: Slow product search (N+1 queries)
SELECT * FROM "Product" WHERE "validate" = 'Approve';
-- Then N queries: SELECT * FROM "Images" WHERE "productId" = ?

-- AFTER: Optimized single query with joins
SELECT 
  p.id, p.name, p.description, p.address, p.basePrice,
  i.id as image_id, i.img as image_data
FROM "Product" p
LEFT JOIN LATERAL (
  SELECT id, img FROM "Images" 
  WHERE "productId" = p.id 
  ORDER BY "createdAt" ASC 
  LIMIT 1
) i ON true
WHERE p.validate = 'Approve'
ORDER BY p.createdAt DESC;

-- BEFORE: Slow availability check
SELECT * FROM "Rent" 
WHERE "productId" = ? 
AND "arrivingDate" <= ? 
AND "leavingDate" >= ?;

-- AFTER: Optimized with index usage
SELECT COUNT(*) FROM "Rent" 
WHERE "productId" = ? 
AND "status" != 'CANCELLED'
AND daterange("arrivingDate", "leavingDate", '[]') && daterange(?, ?, '[]');
*/

-- ================================
-- MAINTENANCE COMMANDS
-- ================================

-- Run these commands periodically for optimal performance:
-- VACUUM ANALYZE "Product";
-- VACUUM ANALYZE "Images";  
-- VACUUM ANALYZE "Rent";
-- REINDEX INDEX CONCURRENTLY "idx_product_complex_search";