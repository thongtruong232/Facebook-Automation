import { Badge } from "../ui/badge";
import { Card, CardHeader } from "../ui/card";
import { DataTable, TableWrap } from "../ui/table";

export function SettingsScreen({ settings, dryRun }: { settings: Array<[string, string]>; dryRun: boolean }) {
  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Production settings are not implemented yet. Secrets are intentionally hidden.</p>
        </div>
        <Badge tone={dryRun ? "amber" : "green"}>{dryRun ? "DRY RUN" : "LIVE"}</Badge>
      </div>

      <Card>
        <CardHeader title="Current environment" description="Read-only values safe to show in the admin console." />
        <TableWrap>
          <DataTable>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {settings.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableWrap>
      </Card>
    </div>
  );
}
