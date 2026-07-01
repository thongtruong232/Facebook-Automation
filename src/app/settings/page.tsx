import { SettingsScreen } from "@/components/screens/settings-screen";
import { env } from "@/server/env";

export default function SettingsPage() {
  const settings: Array<[string, string]> = [
    ["APP_ENV", env.APP_ENV],
    ["DRY_RUN", String(env.DRY_RUN)],
    ["META_GRAPH_VERSION", env.META_GRAPH_VERSION],
    ["STORAGE_DRIVER", env.STORAGE_DRIVER],
    ["UPLOAD_DIR", env.UPLOAD_DIR],
    ["DEFAULT_TIMEZONE", env.DEFAULT_TIMEZONE],
    ["MAX_POSTS_PER_RUN", String(env.MAX_POSTS_PER_RUN)],
    ["MAX_RETRY", String(env.MAX_RETRY)]
  ];

  return <SettingsScreen settings={settings} dryRun={env.DRY_RUN} />;
}
