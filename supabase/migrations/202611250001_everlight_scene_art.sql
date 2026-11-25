insert into storage.buckets (id, name, public)
values ('everlight-scene-art', 'everlight-scene-art', false)
on conflict (id) do nothing;
