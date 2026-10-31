-- Promotion date/product overlap is not checked across separate campaigns.
-- Time-slot overlap validation belongs only to the daily slots inside one campaign.
DROP TRIGGER IF EXISTS trg_prevent_overlapping_product_promotions
  ON public.promotion_products;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_promotion_date_updates
  ON public.promotions;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_promotion_activation
  ON public.promotions;
