-- Initial schema for the multi-tenant restaurant ordering platform
-- Money is stored as cents (int)
-- Primary keys use UUIDv7 so tenant data can move between shared and dedicated databases without ID remapping, while keeping inserts mostly time-ordered

CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS citext;

-- Timezone validation uses PostgreSQL's timezone catalog.
CREATE FUNCTION public.is_valid_timezone(tz TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_catalog.pg_timezone_names
    WHERE name = tz
  );
END;
$$;

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  domain VARCHAR(63) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  icon_key VARCHAR(512),
  theme_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- LOCATION ----------

-- Group locations for same pricing on items
CREATE TABLE public.pricing_groups (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,   -- "Metro", "Regional", "CBD"
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pricing_group_id UUID REFERENCES public.pricing_groups(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  timezone VARCHAR(50) NOT NULL DEFAULT 'Australia/Melbourne',
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  dinein_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_valid_timezone
    CHECK (public.is_valid_timezone(timezone))
);
CREATE INDEX idx_locations_tenant ON public.locations (tenant_id);

-- ---------- USERS ----------

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  email CITEXT UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ   -- NULL = active
);

CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users (tenant_id);
CREATE INDEX idx_tenant_users_user ON public.tenant_users (user_id);
CREATE UNIQUE INDEX idx_tenant_users_active_unique
  ON public.tenant_users (tenant_id, user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE public.tenant_invites (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('owner', 'admin', 'staff')),
  invited_by UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenant_invites_tenant ON public.tenant_invites (tenant_id);
CREATE INDEX idx_tenant_invites_email_pending ON public.tenant_invites (email)
  WHERE accepted_at IS NULL;
CREATE INDEX idx_tenant_invites_invited_by ON public.tenant_invites (invited_by);
CREATE UNIQUE INDEX idx_tenant_invites_pending_unique
  ON public.tenant_invites (tenant_id, email)
  WHERE accepted_at IS NULL;

-- 1 user can belong to multiple locations
CREATE TABLE public.user_location_assignments (
  tenant_user_id UUID NOT NULL REFERENCES public.tenant_users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  PRIMARY KEY (tenant_user_id, location_id)
);

CREATE TABLE public.refresh_token_families (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_families_user ON public.refresh_token_families (user_id);

CREATE TABLE public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  selected_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  family_id UUID NOT NULL REFERENCES public.refresh_token_families(id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_selected_tenant_user ON public.refresh_tokens (selected_tenant_user_id);
CREATE INDEX idx_refresh_tokens_family ON public.refresh_tokens (family_id);

-- ---------- MENU ----------

-- parent_category_id allows for subcategories
-- parent_category_id = null for top level
-- e.g. parent_category_id = null, name = 'Burgers' + parent_category_id = burger id, name = 'Beef'
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,   -- For sub
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, parent_category_id, name)
);
CREATE INDEX idx_menu_categories_tenant ON public.menu_categories (tenant_id);


CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_key VARCHAR(512),
  base_price_cents INT NOT NULL,    -- fallback if no pricing_group override exists
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_menu_items_tenant ON public.menu_items (tenant_id);
CREATE INDEX idx_menu_items_category ON public.menu_items (category_id);

CREATE TABLE public.menu_item_pricing_overrides (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  pricing_group_id UUID NOT NULL REFERENCES public.pricing_groups(id) ON DELETE CASCADE,
  price_cents INT NOT NULL,
  PRIMARY KEY (menu_item_id, pricing_group_id)
);

-- Per location menu availability
CREATE TABLE public.location_menu_items (
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  is_offered BOOLEAN NOT NULL DEFAULT true,
  is_available_now BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (location_id, menu_item_id)
);

-- ---------- MODIFIERS ----------

CREATE TABLE public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,                           -- e.g. "Size", "Toppings"
  selection_type VARCHAR(20) NOT NULL
    CHECK (selection_type IN ('single', 'multiple')),   -- single for radio button to select 1 in group
  min_select INT NOT NULL DEFAULT 0,
  max_select INT,
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.modifier_options (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,                     -- "Large", "Extra cheese"
  price_delta_cents INT NOT NULL DEFAULT 0,
  default_enabled BOOLEAN NOT NULL DEFAULT true   -- is this normally available on items using the group
);

CREATE TABLE public.menu_item_modifier_groups (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- Per item exceptions to default option
CREATE TABLE public.menu_item_modifier_option_overrides (
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_option_id UUID NOT NULL REFERENCES public.modifier_options(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  PRIMARY KEY (menu_item_id, modifier_option_id)
);

-- ---------- ORDERS ----------

-- Sisplay numbers reset per location and business date
CREATE TABLE public.location_order_counters (
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  business_date DATE NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (location_id, business_date)
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_code VARCHAR(12) UNIQUE NOT NULL,   -- permanent tracking code
  business_date DATE NOT NULL,              -- local operating day, independent of UTC date
  display_number INT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  fulfillment_type VARCHAR(20) NOT NULL
    CHECK (fulfillment_type IN ('pickup', 'delivery', 'dinein')),
  contact_phone VARCHAR(32),
  table_number VARCHAR(20),
  delivery_address VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed', 'preparing', 'ready', 'completed', 'cancelled')),
  total_amount_cents INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_delivery_contact_phone_required CHECK (
    fulfillment_type <> 'delivery'
    OR NULLIF(BTRIM(contact_phone), '') IS NOT NULL   -- need phone for emergency contact for deliveries
  )
);
CREATE INDEX idx_orders_tenant ON public.orders (tenant_id);
CREATE INDEX idx_orders_location ON public.orders (location_id);
CREATE UNIQUE INDEX idx_orders_display_number_daily
  ON public.orders (location_id, business_date, display_number);

CREATE FUNCTION public.set_order_business_date_and_display_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  loc_tz TEXT;
  next_number INT;
BEGIN
  SELECT l.timezone
  INTO loc_tz
  FROM public.locations l
  WHERE l.id = NEW.location_id;

  NEW.business_date := (NEW.created_at AT TIME ZONE loc_tz)::date;

  INSERT INTO public.location_order_counters AS counter (
    location_id,
    business_date,
    last_number
  )
  VALUES (NEW.location_id, NEW.business_date, 1)
  ON CONFLICT (location_id, business_date)
  DO UPDATE SET last_number = counter.last_number + 1
  RETURNING last_number INTO next_number;

  NEW.display_number := next_number;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_business_date_and_display_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_business_date_and_display_number();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price_cents INT NOT NULL,    -- snapshot of price + modifiers at time or order
  notes VARCHAR(500)
);

CREATE INDEX idx_order_items_order ON public.order_items (order_id);

CREATE TABLE public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES public.modifier_options(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,       -- snapshot of item name
  price_delta_cents INT NOT NULL    -- snapshot of modifier price delta
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PAYMENT ----------

CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'mock',
  status VARCHAR(20) NOT NULL
    CHECK (status IN ('success', 'failed')),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_logs_order ON public.payment_logs (order_id);
