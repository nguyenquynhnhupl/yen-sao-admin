-- Allow a product to join multiple promotions only when their effective date ranges do not overlap.
-- Keep one link per product per promotion; remove the old global UNIQUE(product_id).

ALTER TABLE public.promotion_products
  DROP CONSTRAINT IF EXISTS promotion_products_product_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.promotion_products'::regclass
      AND conname = 'promotion_products_promotion_id_product_id_key'
  ) THEN
    ALTER TABLE public.promotion_products
      ADD CONSTRAINT promotion_products_promotion_id_product_id_key
      UNIQUE (promotion_id, product_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_overlapping_product_promotions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_start timestamptz;
  new_end timestamptz;
  conflict_name text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.product_id::text));

  SELECT start_at, end_at INTO new_start, new_end
  FROM public.promotions
  WHERE id = NEW.promotion_id;

  SELECT p.name INTO conflict_name
  FROM public.promotion_products pp
  JOIN public.promotions p ON p.id = pp.promotion_id
  WHERE pp.product_id = NEW.product_id
    AND pp.promotion_id <> NEW.promotion_id
    AND p.start_at <= new_end
    AND p.end_at >= new_start
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Sản phẩm đã thuộc chương trình "%" có thời gian hiệu lực bị chồng lấn.', conflict_name
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_product_promotions
  ON public.promotion_products;

CREATE TRIGGER trg_prevent_overlapping_product_promotions
BEFORE INSERT OR UPDATE OF promotion_id, product_id
ON public.promotion_products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_product_promotions();

-- Also prevent changing a promotion's dates so that its existing products overlap another program.
CREATE OR REPLACE FUNCTION public.prevent_overlapping_promotion_date_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  conflict_name text;
BEGIN
  IF NEW.start_at IS NOT DISTINCT FROM OLD.start_at
     AND NEW.end_at IS NOT DISTINCT FROM OLD.end_at THEN
    RETURN NEW;
  END IF;

  SELECT other.name INTO conflict_name
  FROM public.promotion_products current_link
  JOIN public.promotion_products other_link
    ON other_link.product_id = current_link.product_id
   AND other_link.promotion_id <> NEW.id
  JOIN public.promotions other ON other.id = other_link.promotion_id
  WHERE current_link.promotion_id = NEW.id
    AND other.start_at <= NEW.end_at
    AND other.end_at >= NEW.start_at
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Không thể đổi thời gian: sản phẩm đang bị trùng lịch với chương trình "%".', conflict_name
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_promotion_date_updates
  ON public.promotions;

CREATE TRIGGER trg_prevent_overlapping_promotion_date_updates
BEFORE UPDATE OF start_at, end_at
ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_promotion_date_updates();
