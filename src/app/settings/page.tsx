import type { Metadata } from "next";
import { SettingsForm } from "./SettingsForm";
export const metadata: Metadata = { title: "设置" };
export default function SettingsPage() {
  return <SettingsForm />;
}
