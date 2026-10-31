-- Block re-activating a campaign when one of its products is already
-- reserved by another active campaign of the same type in an overlapping period.

CREATE OR REPLACE FUNCTION public.prevent_overlapping_promotion_activation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  conflict_name text;
  conflict_product text;
BEGIN
  IF OLD.is_active IS TRUE OR NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT other.name, product.name
    INTO conflict_name, conflict_product
  FROM public.promotion_products current_link
  JOIN public.products product
    ON product.id = current_link.product_id
  JOIN public.promotion_products other_link
    ON other_link.product_id = current_link.product_id
   AND other_link.promotion_id <> NEW.id
  JOIN public.promotions other
    ON other.id = other_link.promotion_id
  WHERE current_link.promotion_id = NEW.id
    AND other.is_active IS TRUE
    AND other.start_at <= NEW.end_at
    AND other.end_at >= NEW.start_at
    AND COALESCE(other.campaign_type, 'regular') = COALESCE(NEW.campaign_type, 'regular')
  LIMIT 1;

  IF conflict_name IS NOT NULL THEN
    RAISE EXCEPTION 'Không thể bật chương trình: sản phẩm "%" đang thuộc chương trình đang chạy "%" có thời gian hiệu lực bị chồng lấn.',
      conflict_product, conflict_name
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_promotion_activation
  ON public.promotions;

CREATE TRIGGER trg_prevent_overlapping_promotion_activation
BEFORE UPDATE OF is_active ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlapping_promotion_activation();
