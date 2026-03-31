'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Loader2, Check, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Organization {
  id: string
  name: string
  tier: string
  _count: { users: number }
}

export function CreateUserModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
  const [tier, setTier] = useState<'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'>('FREE')
  const [organizationMode, setOrganizationMode] = useState<'existing' | 'new'>('new')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [createdUser, setCreatedUser] = useState<any>(null)

  // Fetch organizations when modal opens
  useEffect(() => {
    if (open) {
      fetchOrganizations()
    }
  }, [open])

  const fetchOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (err) {
      console.error('Error fetching organizations:', err)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setCreatedUser(null)

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        tier,
      }

      if (organizationMode === 'existing' && selectedOrgId) {
        payload.organizationId = selectedOrgId
      } else if (organizationMode === 'new' && newOrgName) {
        payload.newOrganizationName = newOrgName
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      setSuccess(true)
      setCreatedUser(data.user)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        if (!open) return
        // Don't close automatically, let user see the success
      }, 100)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (success) {
      // Reset form
      setName('')
      setEmail('')
      setPassword('')
      setRole('USER')
      setTier('FREE')
      setOrganizationMode('new')
      setSelectedOrgId('')
      setNewOrgName('')
      setSuccess(false)
      setCreatedUser(null)
      setError(null)
    }
    setOpen(false)
    // Refresh page to show new user
    if (success) {
      window.location.reload()
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let pass = ''
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl text-zinc-100">Criar Novo Usuário</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Crie um usuário e organização diretamente sem passar pelo registro.
          </DialogDescription>
        </DialogHeader>

        {success && createdUser ? (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-900/30 border-green-700">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                Usuário criado com sucesso!
              </AlertDescription>
            </Alert>
            
            <div className="bg-zinc-950 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Nome:</span>
                <span className="text-zinc-200">{createdUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-200">{createdUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Role:</span>
                <span className="text-zinc-200">{createdUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Organização:</span>
                <span className="text-zinc-200">{createdUser.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tier:</span>
                <span className="text-zinc-200">{createdUser.tier}</span>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {error && (
              <Alert className="bg-red-900/30 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@empresa.com"
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Senha</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 whitespace-nowrap"
                >
                  Gerar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-300">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'USER' | 'ADMIN')}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="USER">Usuário</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier" className="text-zinc-300">Tier</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as any)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="STARTER">STARTER</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                    <SelectItem value="BUSINESS">BUSINESS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-zinc-300">Organização</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={organizationMode === 'existing'}
                    onCheckedChange={(checked) => setOrganizationMode(checked ? 'existing' : 'new')}
                  />
                  <span className="text-sm text-zinc-400">Usar existente</span>
                </div>
              </div>

              {organizationMode === 'existing' ? (
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[200px]">
                    {loadingOrgs ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : organizations.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhuma organização</SelectItem>
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} ({org.tier}) - {org._count.users} users
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Nome da nova organização"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
