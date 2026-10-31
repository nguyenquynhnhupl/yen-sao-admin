-- Special-day campaigns may overlap a regular campaign for the same product.
-- Two regular campaigns or two special campaigns may not overlap.

CREATE OR REPLACE FUNCTION public.prevent_overlapping_product_promotions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_start timestamptz;
  new_end timestamptz;
  new_kind text;
  conflict_name text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.product_id::text));

  SELECT start_at, end_at, COALESCE(campaign_type, 'regular')
    INTO new_start, new_end, new_kind
  FROM public.promotions
  WHERE id = NEW.promotion_id;

  SELECT p.name INTO conflict_name
  FROM public.promotion_products pp
  JOIN public.promotions p ON p.id = pp.promotion_id
  WHERE pp.product_id = NEW.product_id
    AND pp.promotion_id <> NEW.promotion_id
    AND p.start_at <= new_end
    AND p.end_at >= new_start
    AND COALESCE(p.campaign_type, 'regular') = new_kind
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Sản phẩm đã thuộc chương trình cùng loại "%" có thời gian hiệu lực bị chồng lấn.', conflict_name
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

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
    AND COALESCE(other.campaign_type, 'regular') = COALESCE(NEW.campaign_type, 'regular')
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Không thể đổi thời gian: sản phẩm đang bị trùng lịch với chương trình cùng loại "%".', conflict_name
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
