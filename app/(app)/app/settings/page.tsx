import { loadAccountSettings } from "@/lib/data/account";
import { AccountSettings } from "@/components/app/account/AccountSettings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const props = await loadAccountSettings();
  return <AccountSettings {...props} tab="settings" />;
}
