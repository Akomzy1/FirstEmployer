import { loadAccountSettings } from "@/lib/data/account";
import { AccountSettings } from "@/components/app/account/AccountSettings";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const props = await loadAccountSettings();
  return <AccountSettings {...props} tab="account" />;
}
