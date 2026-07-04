import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verifies the caller's JWT and confirms they are an admin. Returns their user id or null.
async function requireAdmin(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const asCaller = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await asCaller.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await asCaller
    .from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

const service = () => createClient(URL, SERVICE, { auth: { persistSession: false } });

export async function POST(req) {
  const adminId = await requireAdmin(req);
  if (!adminId) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || password.length < 8)
    return NextResponse.json({ error: "Name, email, and a password of 8+ characters are required." }, { status: 400 });
  if (!["admin", "manager", "viewer"].includes(role))
    return NextResponse.json({ error: "Role must be admin, manager, or viewer." }, { status: 400 });

  const { data, error } = await service().auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no confirmation email needed; admin hands out credentials
    user_metadata: { name, role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.user.id });
}

export async function PATCH(req) {
  const adminId = await requireAdmin(req);
  if (!adminId) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { id, role } = await req.json();
  if (!id || !["admin", "manager", "viewer"].includes(role))
    return NextResponse.json({ error: "A user id and a valid role are required." }, { status: 400 });
  if (id === adminId)
    return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });

  const { error } = await service().from("profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const adminId = await requireAdmin(req);
  if (!adminId) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "A user id is required." }, { status: 400 });
  if (id === adminId)
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });

  const { error } = await service().auth.admin.deleteUser(id); // cascades to profiles
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
