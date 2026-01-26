"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Palette,
  Type,
  Layout,
  Code,
  Check,
  X,
  ChevronRight,
  Star,
  Heart,
  Settings,
  User,
  Mail,
  Bell,
  Search,
  Download,
} from "lucide-react";

export default function DesignSystemPage() {
  const [codeVisible, setCodeVisible] = useState<Record<string, boolean>>({});

  const toggleCode = (section: string) => {
    setCodeVisible((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const CodeBlock = ({ code, section }: { code: string; section: string }) => (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleCode(section)}
        className="mb-2"
      >
        <Code className="w-4 h-4 mr-2" />
        {codeVisible[section] ? "Hide" : "Show"} Code
      </Button>
      {codeVisible[section] && (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Sirius Design System</h1>
                <p className="text-muted-foreground mt-1">
                  Componentes, padrões e tokens para construir interfaces consistentes
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge>v1.0.0</Badge>
              <Badge variant="secondary">22 Componentes</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="colors" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="colors">
              <Palette className="w-4 h-4 mr-2" />
              Cores
            </TabsTrigger>
            <TabsTrigger value="typography">
              <Type className="w-4 h-4 mr-2" />
              Tipografia
            </TabsTrigger>
            <TabsTrigger value="components">
              <Layout className="w-4 h-4 mr-2" />
              Componentes
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <Code className="w-4 h-4 mr-2" />
              Padrões
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Paleta de Cores</h2>
              <p className="text-muted-foreground">
                Sistema de cores baseado em tokens CSS para suportar temas claro e escuro
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cores Principais</CardTitle>
                <CardDescription>
                  Cores primárias usadas em toda a aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Primary", class: "bg-primary text-primary-foreground" },
                  { name: "Secondary", class: "bg-secondary text-secondary-foreground" },
                  { name: "Accent", class: "bg-accent text-accent-foreground" },
                  { name: "Muted", class: "bg-muted text-muted-foreground" },
                  { name: "Destructive", class: "bg-destructive text-destructive-foreground" },
                  { name: "Background", class: "bg-background text-foreground border" },
                  { name: "Card", class: "bg-card text-card-foreground border" },
                  { name: "Popover", class: "bg-popover text-popover-foreground border" },
                ].map((color) => (
                  <div key={color.name} className="space-y-2">
                    <div
                      className={`h-24 rounded-lg flex items-center justify-center font-medium ${color.class}`}
                    >
                      {color.name}
                    </div>
                    <p className="text-sm text-muted-foreground">{color.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Colors</CardTitle>
                <CardDescription>
                  Cores para feedback e estados da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Success", class: "bg-green-500 text-white" },
                  { name: "Warning", class: "bg-yellow-500 text-white" },
                  { name: "Error", class: "bg-red-500 text-white" },
                  { name: "Info", class: "bg-blue-500 text-white" },
                ].map((color) => (
                  <div key={color.name} className="space-y-2">
                    <div
                      className={`h-24 rounded-lg flex items-center justify-center font-medium ${color.class}`}
                    >
                      {color.name}
                    </div>
                    <p className="text-sm text-muted-foreground">{color.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Tipografia</h2>
              <p className="text-muted-foreground">
                Hierarquia e estilos de texto para uma leitura consistente
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Headings</CardTitle>
                <CardDescription>Títulos e cabeçalhos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold">Heading 1</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-4xl font-bold
                  </p>
                </div>
                <Separator />
                <div>
                  <h2 className="text-3xl font-bold">Heading 2</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-3xl font-bold
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-2xl font-semibold">Heading 3</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-2xl font-semibold
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xl font-semibold">Heading 4</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-xl font-semibold
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Body Text</CardTitle>
                <CardDescription>Parágrafos e texto corrente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-base">
                    Body text (default) - Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                    dolore magna aliqua.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">text-base</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm">
                    Small text - Lorem ipsum dolor sit amet, consectetur adipiscing
                    elit.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">text-sm</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs">
                    Extra small text - Lorem ipsum dolor sit amet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">text-xs</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">
                    Muted text - Secondary information or descriptions
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-muted-foreground
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Componentes UI</h2>
              <p className="text-muted-foreground">
                Biblioteca completa de componentes reutilizáveis
              </p>
            </div>

            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Botões com diferentes variantes e tamanhos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">With Icons</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CodeBlock
                section="buttons"
                code={`<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>`}
              />
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Badges para status, contadores e labels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
              <CodeBlock
                section="badges"
                code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>`}
              />
            </Card>

            {/* Form Components */}
            <Card>
              <CardHeader>
                <CardTitle>Form Components</CardTitle>
                <CardDescription>
                  Inputs, selects e outros elementos de formulário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="input-demo">Input</Label>
                  <Input id="input-demo" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textarea-demo">Textarea</Label>
                  <Textarea id="textarea-demo" placeholder="Enter description..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select-demo">Select</Label>
                  <Select>
                    <SelectTrigger id="select-demo">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Option 1</SelectItem>
                      <SelectItem value="2">Option 2</SelectItem>
                      <SelectItem value="3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch-demo" />
                  <Label htmlFor="switch-demo">Enable notifications</Label>
                </div>
              </CardContent>
              <CodeBlock
                section="forms"
                code={`<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email..." />
</div>

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>`}
              />
            </Card>

            {/* Card Component */}
            <Card>
              <CardHeader>
                <CardTitle>Card Component</CardTitle>
                <CardDescription>
                  Container versátil para conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      This is the card content area where you can place any
                      elements.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Continue</Button>
                  </CardFooter>
                </Card>
              </CardContent>
              <CodeBlock
                section="card"
                code={`<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>`}
              />
            </Card>

            {/* Dialog */}
            <Card>
              <CardHeader>
                <CardTitle>Dialog / Modal</CardTitle>
                <CardDescription>
                  Diálogos modais para interações focadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog Title</DialogTitle>
                      <DialogDescription>
                        This is a dialog description explaining what the user should
                        do.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm">Dialog content goes here.</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Dropdown Menu */}
            <Card>
              <CardHeader>
                <CardTitle>Dropdown Menu</CardTitle>
                <CardDescription>
                  Menus contextuais e de ações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Open Menu
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            {/* Tooltip */}
            <Card>
              <CardHeader>
                <CardTitle>Tooltip</CardTitle>
                <CardDescription>
                  Dicas e informações adicionais ao passar o mouse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a tooltip</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>

            {/* Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loader</CardTitle>
                <CardDescription>
                  Estados de carregamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Padrões de Design</h2>
              <p className="text-muted-foreground">
                Padrões comuns e melhores práticas de implementação
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Form Pattern</CardTitle>
                <CardDescription>
                  Padrão completo de formulário com validação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Your message..." rows={4} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="terms" />
                    <Label htmlFor="terms">I agree to the terms and conditions</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empty State Pattern</CardTitle>
                <CardDescription>
                  Estado vazio com call-to-action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground max-w-sm mb-4">
                    We couldn't find any items matching your search. Try adjusting
                    your filters or search terms.
                  </p>
                  <Button>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Create New Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Indicators</CardTitle>
                <CardDescription>
                  Padrões para mostrar status e estados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Success State</p>
                      <p className="text-sm text-muted-foreground">
                        Operation completed successfully
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                      <Bell className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">Warning State</p>
                      <p className="text-sm text-muted-foreground">
                        Action required soon
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500">Pending</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                      <X className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">Error State</p>
                      <p className="text-sm text-muted-foreground">
                        Something went wrong
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Sirius Design System • Built with{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              shadcn/ui
            </a>{" "}
            and{" "}
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Tailwind CSS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
