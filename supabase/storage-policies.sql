-- Применять после создания приватного bucket "proofs" (Storage → New bucket → Public: OFF)
-- Структура путей: proofs/{user_id}/{history_entry_id}.jpg

create policy "Загружать можно только в свою папку"
on storage.objects for insert
with check (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Читать можно только свои файлы"
on storage.objects for select
using (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Для совместных (joint) парных доказательств — партнёр должен видеть тот же файл.
-- Папка для парных фото: proofs/pair/{pair_id}/{pair_day_id}.jpg
create policy "Парные фото видны обоим участникам пары"
on storage.objects for select
using (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = 'pair'
  and exists (
    select 1 from pair_links pl
    where pl.id::text = (storage.foldername(name))[2]
      and (auth.uid() = pl.user_a or auth.uid() = pl.user_b)
  )
);

create policy "Парные фото загружает любой участник пары"
on storage.objects for insert
with check (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = 'pair'
  and exists (
    select 1 from pair_links pl
    where pl.id::text = (storage.foldername(name))[2]
      and (auth.uid() = pl.user_a or auth.uid() = pl.user_b)
  )
);
