-- Схема базы данных «День-приключение»
-- Применять в Supabase SQL Editor (Project → SQL Editor → New query)

-- ───────────────────────── Профили ─────────────────────────
create type user_mode as enum ('single', 'pair', 'friends');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Без имени',
  avatar_emoji text not null default '🌿',
  mode user_mode not null default 'single',
  birth_date date,
  level int not null default 1,
  is_subscribed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Профиль виден только себе" on profiles
  for select using (auth.uid() = id);

create policy "Профиль редактируется только собой" on profiles
  for update using (auth.uid() = id);

create policy "Профиль создаётся только собой" on profiles
  for insert with check (auth.uid() = id);

-- Автосоздание профиля при регистрации
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Без имени'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ───────────────────────── Челленджи ─────────────────────────
create type challenge_category as enum (
  'photo', 'walk', 'creativity', 'home', 'new-experience',
  'self-care', 'communication', 'pair', 'friends', 'good-deeds'
);
create type challenge_difficulty as enum ('easy', 'medium', 'hard');
create type proof_type as enum ('photo', 'text', 'voice', 'checkbox');
create type challenge_for_mode as enum ('single', 'pair', 'friends');
create type pair_submission_type as enum ('joint', 'separate');
create type challenge_status as enum ('pending_review', 'published', 'rejected');

create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category challenge_category not null,
  difficulty challenge_difficulty not null,
  proof_type proof_type not null,
  for_mode challenge_for_mode not null default 'single',
  pair_submission_type pair_submission_type,
  is_custom boolean not null default false,
  is_public boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  status challenge_status not null default 'published',
  created_at timestamptz not null default now()
);

alter table challenges enable row level security;

create policy "Опубликованные челленджи видны всем" on challenges
  for select using (status = 'published' and is_public = true);

create policy "Свои челленджи видны автору всегда" on challenges
  for select using (auth.uid() = created_by);

create policy "Пользователь может создать свой челлендж" on challenges
  for insert with check (auth.uid() = created_by);

-- ───────────────────────── История выполнения ─────────────────────────
create table history_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete set null,
  challenge_title text not null, -- снимок названия на момент выполнения
  category challenge_category not null,
  difficulty challenge_difficulty not null,
  proof_type proof_type not null,
  proof_text text,
  proof_photo_path text, -- путь в Storage bucket "proofs"
  photo_expires_at timestamptz, -- null = хранится навсегда (подписка)
  completed_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, completed_at) -- один челлендж в зачёт на день
);

alter table history_entries enable row level security;

create policy "История видна только себе" on history_entries
  for select using (auth.uid() = user_id);

create policy "Запись истории создаёт только сам пользователь" on history_entries
  for insert with check (auth.uid() = user_id);

-- ───────────────────────── Парный режим ─────────────────────────
create table pair_links (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  referral_code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

alter table pair_links enable row level security;

create policy "Связка видна обоим участникам" on pair_links
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Связку создаёт инициатор" on pair_links
  for insert with check (auth.uid() = user_a);

create policy "Подключиться может только второй участник по ссылке" on pair_links
  for update using (user_b is null);

create table pair_days (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pair_links(id) on delete cascade,
  date date not null default current_date,
  chooser_user_id uuid not null references profiles(id),
  challenge_id uuid references challenges(id),
  created_at timestamptz not null default now(),
  unique (pair_id, date)
);

alter table pair_days enable row level security;

create policy "День пары виден обоим" on pair_days
  for select using (
    exists (
      select 1 from pair_links pl
      where pl.id = pair_id and (auth.uid() = pl.user_a or auth.uid() = pl.user_b)
    )
  );

create policy "День пары создаёт выбирающий" on pair_days
  for insert with check (auth.uid() = chooser_user_id);

-- Решения к парному челленджу. Ключевое правило безопасности:
-- партнёр видит решение другого ТОЛЬКО если уже отправил своё (commit-reveal).
create table pair_solutions (
  id uuid primary key default gen_random_uuid(),
  pair_day_id uuid not null references pair_days(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  solution_text text,
  solution_photo_path text,
  submitted_at timestamptz not null default now(),
  unique (pair_day_id, user_id)
);

alter table pair_solutions enable row level security;

create policy "Своё решение видно всегда" on pair_solutions
  for select using (auth.uid() = user_id);

create policy "Решение партнёра видно только после отправки своего" on pair_solutions
  for select using (
    auth.uid() <> user_id
    and exists (
      select 1 from pair_solutions mine
      where mine.pair_day_id = pair_solutions.pair_day_id
        and mine.user_id = auth.uid()
    )
  );

create policy "Решение создаёт только сам пользователь" on pair_solutions
  for insert with check (auth.uid() = user_id);

-- ───────────────────────── Жалобы ─────────────────────────
create table reports (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "Жалобу видит только автор" on reports
  for select using (auth.uid() = reporter_id);

create policy "Жалобу создаёт только сам пользователь" on reports
  for insert with check (auth.uid() = reporter_id);

-- ───────────────────────── Storage ─────────────────────────
-- Выполнить отдельно в Storage UI или через SQL:
-- 1. Создать bucket "proofs" (приватный, не публичный).
-- 2. Политики доступа к файлам — см. supabase/storage-policies.sql
