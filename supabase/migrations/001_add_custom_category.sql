-- Выполнить в SQL Editor: добавляет категорию "custom" для челленджей,
-- которые пользователь вписывает сам, без привязки к стандартной категории.
alter type challenge_category add value if not exists 'custom';
