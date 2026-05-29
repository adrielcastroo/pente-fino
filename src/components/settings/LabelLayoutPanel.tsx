import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QrCode, Type, Maximize, Layout, Save, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_FIELDS = [
  { id: 'item', label: 'Código do Item' },
  { id: 'lote', label: 'Número do Lote' },
  { id: 'endereco', label: 'Endereço de Estocagem' },
  { id: 'm_linear', label: 'Metragem Linear' },
  { id: 'largura', label: 'Largura' },
  { id: 'm2', label: 'Metragem Quadrada (M²)' },
  { id: 'data', label: 'Data de Conferência' },
  { id: 'conferente', label: 'Nome do Conferente' },
];

export default function LabelLayoutPanel() {
  const { labelSettings, setLabelSettings } = useAppStore();

  const handleToggleField = (fieldId: string) => {
    const currentFields = [...labelSettings.fields];
    if (currentFields.includes(fieldId)) {
      setLabelSettings({ fields: currentFields.filter(f => f !== fieldId) });
    } else {
      setLabelSettings({ fields: [...currentFields, fieldId] });
    }
  };

  const handleSave = () => {
    toast.success('Configurações de etiqueta salvas localmente!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="border-border/30 bg-background/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">Dimensões (mm)</CardTitle>
              </div>
              <CardDescription>Defina o tamanho físico da sua etiqueta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-width" className="text-xs font-bold">Largura</Label>
                  <Input 
                    id="label-width"
                    type="number"
                    value={labelSettings.width}
                    onChange={(e) => setLabelSettings({ width: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-height" className="text-xs font-bold">Altura</Label>
                  <Input 
                    id="label-height"
                    type="number"
                    value={labelSettings.height}
                    onChange={(e) => setLabelSettings({ height: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold">Orientação</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={labelSettings.orientation === 'landscape' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 font-bold text-xs"
                    onClick={() => setLabelSettings({ orientation: 'landscape' })}
                  >
                    Paisagem
                  </Button>
                  <Button 
                    variant={labelSettings.orientation === 'portrait' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 font-bold text-xs"
                    onClick={() => setLabelSettings({ orientation: 'portrait' })}
                  >
                    Retrato
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">Conteúdo</CardTitle>
              </div>
              <CardDescription>Selecione as informações que aparecerão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center justify-between gap-2">
                    <Label htmlFor={`field-${field.id}`} className="text-xs font-medium cursor-pointer">
                      {field.label}
                    </Label>
                    <Switch 
                      id={`field-${field.id}`}
                      checked={labelSettings.fields.includes(field.id)}
                      onCheckedChange={() => handleToggleField(field.id)}
                    />
                  </div>
                ))}
              </div>

              <Separator className="my-2" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="show-qr" className="text-xs font-bold flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5" />
                    Mostrar QR Code
                  </Label>
                  <Switch 
                    id="show-qr"
                    checked={labelSettings.showQRCode}
                    onCheckedChange={(val) => setLabelSettings({ showQRCode: val })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="show-logo" className="text-xs font-bold flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5" />
                    Mostrar Logotipo
                  </Label>
                  <Switch 
                    id="show-logo"
                    checked={labelSettings.showLogo}
                    onCheckedChange={(val) => setLabelSettings({ showLogo: val })}
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="font-size" className="text-xs font-bold flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" />
                    Tamanho da Fonte (pt)
                  </Label>
                  <Input 
                    id="font-size"
                    type="number"
                    value={labelSettings.fontSize}
                    onChange={(e) => setLabelSettings({ fontSize: Number(e.target.value) })}
                    className="h-9 w-24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Label Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest opacity-60">Pré-visualização da Etiqueta</Label>
          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-3xl border-2 border-dashed border-border/30 min-h-[350px]">
            <div 
              style={{
                width: `${labelSettings.orientation === 'landscape' ? labelSettings.width * 2.5 : labelSettings.height * 2.5}px`,
                height: `${labelSettings.orientation === 'landscape' ? labelSettings.height * 2.5 : labelSettings.width * 2.5}px`,
                fontSize: `${labelSettings.fontSize}px`,
              }}
              className="bg-white text-black shadow-2xl rounded-sm p-4 flex flex-col justify-between border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  {labelSettings.showLogo && (
                    <div className="font-black text-xs border-b border-black/10 pb-1 mb-2">LOVABLE SYSTEMS</div>
                  )}
                  {labelSettings.fields.includes('item') && (
                    <div className="font-black leading-tight break-all">CELULAR HC-45 WHITE</div>
                  )}
                  {labelSettings.fields.includes('lote') && (
                    <div className="font-bold opacity-80">LOTE: 20240529-001</div>
                  )}
                </div>
                {labelSettings.showQRCode && (
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center border border-gray-200">
                    <QrCode className="w-10 h-10 opacity-40" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-auto">
                {labelSettings.fields.includes('endereco') && (
                  <div className="col-span-2 text-lg font-black bg-black text-white px-2 py-0.5 rounded-sm inline-block w-fit">
                    TEC01.G.N01
                  </div>
                )}
                <div className="space-y-0.5">
                  {labelSettings.fields.includes('m_linear') && (
                    <div className="text-[0.8em] font-medium flex justify-between">
                      <span className="opacity-60">Linear:</span>
                      <span className="font-bold">12.50m</span>
                    </div>
                  )}
                  {labelSettings.fields.includes('largura') && (
                    <div className="text-[0.8em] font-medium flex justify-between">
                      <span className="opacity-60">Largura:</span>
                      <span className="font-bold">3.66m</span>
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  {labelSettings.fields.includes('m2') && (
                    <div className="text-[0.8em] font-medium flex justify-between">
                      <span className="opacity-60">M²:</span>
                      <span className="font-bold">45.75</span>
                    </div>
                  )}
                  {labelSettings.fields.includes('data') && (
                    <div className="text-[0.8em] font-medium flex justify-between">
                      <span className="opacity-60">Data:</span>
                      <span className="font-bold">29/05/2024</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
            <Layout className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] leading-tight text-primary/80 font-medium">
              A pré-visualização é uma aproximação do layout final. O tamanho real dependerá da sua impressora térmica.
            </p>
          </div>
          
          <Button onClick={handleSave} className="w-full gap-2 font-bold shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            Salvar Preferências de Etiqueta
          </Button>
        </div>
      </div>
    </div>
  );
}