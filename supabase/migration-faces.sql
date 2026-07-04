-- Migration: track each elevation (North / East / South / West) separately per floor.
-- Run once in Supabase > SQL Editor. Existing statuses are copied to all four faces.

create table public.floor_status_new (
  floor_id int not null references public.floors(id) on delete cascade,
  face text not null check (face in ('North','East','South','West')),
  trade text not null check (trade in ('Cladding','Windows','Mastic','Granite')),
  status text not null default 'pending' check (status in ('pending','progress','done')),
  updated_at timestamptz not null default now(),
  primary key (floor_id, face, trade)
);

insert into public.floor_status_new (floor_id, face, trade, status)
select fs.floor_id, f.face, fs.trade, fs.status
from public.floor_status fs
cross join (values ('North'),('East'),('South'),('West')) as f(face);

drop table public.floor_status;
alter table public.floor_status_new rename to floor_status;

alter table public.floor_status enable row level security;
create policy "floor_status: read" on public.floor_status
  for select to authenticated using (true);
create policy "floor_status: insert" on public.floor_status
  for insert to authenticated with check (public.get_role() in ('admin','manager'));
create policy "floor_status: update" on public.floor_status
  for update to authenticated using (public.get_role() in ('admin','manager'));
create policy "floor_status: delete" on public.floor_status
  for delete to authenticated using (public.get_role() in ('admin','manager'));
