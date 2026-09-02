import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers } from "@/db/queries";
import { UserAdmin } from "@/components/UserAdmin";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "team") redirect("/");

  const users = await listUsers();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Users</h2>
      <p className="text-sm text-muted -mt-2">
        Team accounts can flag domains, log replacements, and manage users. Client accounts are
        view-only everywhere.
      </p>
      <UserAdmin users={users} selfEmail={session.user.email ?? ""} />
    </div>
  );
}
