"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SunIcon,
  MoonIcon,
} from "lucide-react";

function buildApiUrl(config: {
  owner: string;
  repo: string;
  workflow: string;
  branch: string;
  limit: number;
  theme: string;
  width: number;
  token: string;
}) {
  const params = new URLSearchParams();
  if (config.branch) params.set("branch", config.branch);
  if (config.limit !== 10) params.set("limit", String(config.limit));
  if (config.theme !== "light") params.set("theme", config.theme);
  if (config.width !== 800) params.set("width", String(config.width));
  if (config.token) params.set("token", config.token);
  const qs = params.toString();
  const base = `/api/${config.owner}/${config.repo}/${config.workflow}`;
  return qs ? `${base}?${qs}` : base;
}

export default function Home() {
  const { theme: siteTheme, setTheme: setSiteTheme } = useTheme();
  const isDark = siteTheme === "dark";

  const [owner, setOwner] = useState("vercel");
  const [repo, setRepo] = useState("satori");
  const [workflow, setWorkflow] = useState("all");
  const [branch, setBranch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cardTheme, setCardTheme] = useState<"light" | "dark">("light");
  const [width, setWidth] = useState(800);
  const [token, setToken] = useState("");

  const apiUrl = useMemo(
    () =>
      buildApiUrl({
        owner,
        repo,
        workflow,
        branch,
        limit,
        theme: cardTheme,
        width,
        token,
      }),
    [owner, repo, workflow, branch, limit, cardTheme, width, token],
  );

  const fullUrl = `https://actpic.vercel.app${apiUrl}`;
  const markdownCode = `![ActPic](${fullUrl})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownCode);
  };

  const toggleSiteTheme = () => {
    setSiteTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-6">
          <Badge variant="secondary" className="text-xs font-mono">
            ActPic
          </Badge>
          <h1 className="text-sm font-medium text-muted-foreground">
            GitHub Actions History Card Generator
          </h1>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={toggleSiteTheme}>
            {isDark ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-6">
        <div className="flex w-[380px] shrink-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Repository</CardTitle>
              <CardDescription>
                Target GitHub repository and workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="vercel"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="repo">Repo</Label>
                  <Input
                    id="repo"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="satori"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workflow-file">Workflow Filename</Label>
                <Input
                  id="workflow-file"
                  value={workflow === "all" ? "" : workflow}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setWorkflow(v || "all");
                  }}
                  placeholder="ci.yml (leave empty for all)"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for all workflows, or enter a filename like{" "}
                  <code className="font-mono text-xs">ci.yml</code>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>
                Customize the card appearance and content
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="All branches"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Limit</Label>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {limit}
                  </Badge>
                </div>
                <Slider
                  value={[limit]}
                  onValueChange={(v) => setLimit(Array.isArray(v) ? v[0] : v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Width</Label>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {width}px
                  </Badge>
                </div>
                <Slider
                  value={[width]}
                  onValueChange={(v) => setWidth(Array.isArray(v) ? v[0] : v)}
                  min={400}
                  max={1200}
                  step={50}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="card-theme-switch">Card Dark Theme</Label>
                <Switch
                  id="card-theme-switch"
                  checked={cardTheme === "dark"}
                  onCheckedChange={(checked) =>
                    setCardTheme(checked ? "dark" : "light")
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Optional token for higher API rate limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="token">GitHub Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxx (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  Increases API limit from 60 to 5000 requests/hour
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Live preview of the generated card
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start justify-center">
              <a href={apiUrl} target="_blank" rel="noreferrer">
                <img
                  src={apiUrl}
                  alt="ActPic Preview"
                  className="max-w-full rounded-md border ring-1 ring-foreground/5"
                  style={{ width: Math.min(width, 760) }}
                />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy and paste into your README.md
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
                  {markdownCode}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  Copy
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                API URL:{" "}
                <code className="font-mono text-xs">{fullUrl}</code>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
