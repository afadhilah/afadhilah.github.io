import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  Article,
  Briefcase,
  Plus,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  MagnifyingGlass,
  Moon,
  Sun,
  DotsThreeVertical,
  CircleNotch,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "./App";

type ContentItem = {
  slug: string;
  metadata: {
    title?: string;
    publishedAt?: string;
    summary?: string;
  };
};

const AdminDashboard = () => {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const [postsData, projectsData] = await Promise.all([
      fetch("/api/posts").then((r) => r.json()).catch(() => []),
      fetch("/api/projects").then((r) => r.json()).catch(() => []),
    ]);
    setPosts(Array.isArray(postsData) ? postsData : []);
    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (
    type: "posts" | "projects",
    slug: string,
    title: string
  ) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/${type}/${slug}`, { method: "DELETE" });
    fetchData();
  };

  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const filtered = (items: ContentItem[]) =>
    search
      ? items.filter((i) =>
          (i.metadata.title || i.slug)
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      : items;

  const NavItem = ({
    icon: Icon,
    label,
    tab,
    active,
  }: {
    icon: React.ElementType;
    label: string;
    tab?: string;
    active?: boolean;
  }) => (
    <button
      onClick={() => tab && setActiveTab(tab)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  const ContentTable = ({ type }: { type: "posts" | "projects" }) => {
    const items = filtered(type === "posts" ? posts : projects);

    if (loading) {
      return (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-36">Published</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2, 3].map((i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell>
                    <Skeleton className="h-3.5 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-24" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider w-36">Published</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  {search
                    ? `No ${type} match "${search}"`
                    : `No ${type} yet — create one.`}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.slug} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm py-3">
                    {item.metadata.title || item.slug}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground py-3">
                    {fmt(item.metadata.publishedAt)}
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <DotsThreeVertical size={15} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="gap-2 text-sm cursor-pointer"
                          onClick={() =>
                            navigate(`/admin/edit/${type}/${item.slug}`)
                          }
                        >
                          <PencilSimple size={14} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive"
                          onClick={() =>
                            handleDelete(
                              type,
                              item.slug,
                              item.metadata.title || item.slug
                            )
                          }
                        >
                          <Trash size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
          <div className="h-6 w-6 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
            <SquaresFour size={14} weight="fill" className="text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            Portfolio CMS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavItem
            icon={SquaresFour}
            label="Overview"
            tab="posts"
            active={false}
          />
          <NavItem
            icon={Article}
            label="Blog Posts"
            tab="posts"
            active={activeTab === "posts"}
          />
          <NavItem
            icon={Briefcase}
            label="Projects"
            tab="projects"
            active={activeTab === "projects"}
          />
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
          >
            <ArrowSquareOut size={14} />
            View Portfolio
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6 bg-background">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8 h-8 w-56 text-sm bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <Plus size={14} weight="bold" />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="gap-2 text-sm cursor-pointer"
                  onClick={() => navigate("/admin/create?type=posts")}
                >
                  <Article size={14} />
                  Blog Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-sm cursor-pointer"
                  onClick={() => navigate("/admin/create?type=projects")}
                >
                  <Briefcase size={14} />
                  Work Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats row */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Blog Posts
              </p>
              {loading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-3xl font-semibold tabular-nums">{posts.length}</p>
              )}
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Projects
              </p>
              {loading ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-3xl font-semibold tabular-nums">{projects.length}</p>
              )}
            </div>
            {loading && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <CircleNotch size={12} className="animate-spin" />
                Loading…
              </div>
            )}
          </div>

          {/* Table with tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="posts" className="h-7 text-xs gap-1.5 px-3">
                  Blog Posts
                  {!loading && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] h-4 ml-0.5"
                    >
                      {posts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="projects" className="h-7 text-xs gap-1.5 px-3">
                  Projects
                  {!loading && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] h-4 ml-0.5"
                    >
                      {projects.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    <Plus size={13} weight="bold" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="gap-2 text-sm cursor-pointer"
                    onClick={() => navigate("/admin/create?type=posts")}
                  >
                    <Article size={14} />
                    Blog Post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-sm cursor-pointer"
                    onClick={() => navigate("/admin/create?type=projects")}
                  >
                    <Briefcase size={14} />
                    Work Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value="posts" className="mt-0">
              <ContentTable type="posts" />
            </TabsContent>
            <TabsContent value="projects" className="mt-0">
              <ContentTable type="projects" />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
