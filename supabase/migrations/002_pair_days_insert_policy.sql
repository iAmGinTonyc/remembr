-- Любой участник пары может создать запись дня (с чьим бы ходом он ни был) —
-- иначе если партнёр-«сюрприз» открывает приложение первым, для него страница
-- зависает без записи дня, потому что только выбирающий мог её создать.
drop policy if exists "День пары создаёт выбирающий" on pair_days;

create policy "День пары создаёт любой участник пары" on pair_days
  for insert with check (
    exists (
      select 1 from pair_links pl
      where pl.id = pair_id and (auth.uid() = pl.user_a or auth.uid() = pl.user_b)
    )
  );
