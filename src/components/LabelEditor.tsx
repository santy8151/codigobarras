import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Plus, Type, Barcode as BarcodeIcon, Printer, Save, Upload, Rows3 } from "lucide-react";
import { LabelCanvas } from "./LabelCanvas";
import {
  inToPx,
  newId,
  interpolate,
  cmToIn,
  inToCm,
  type LabelDesign,
  type LabelElement,
} from "@/lib/label-types";
import { loadDesigns, saveDesigns } from "@/lib/label-store";

// Default: 5cm x 3cm thermal label (DigitalPOS) — 1 etiqueta por hoja
const DEFAULT_DESIGN = (): LabelDesign => ({
  id: newId(),
  name: "Mi Etiqueta",
  widthIn: cmToIn(5),
  heightIn: cmToIn(3),
  columnsPerPage: 1,
  updatedAt: Date.now(),
  elements: [
    {
      id: newId(),
      type: "text",
      x: 6,
      y: 4,
      width: 177,
      height: 14,
      value: "{PRODUCTO}",
      fontSize: 10,
      bold: false,
      align: "left",
    },
    {
      id: newId(),
      type: "barcode",
      x: 10,
      y: 22,
      width: 169,
      height: 64,
      value: "{CODIGO}",
      barcodeFormat: "CODE128",
      displayValue: true,
    },
    {
      id: newId(),
      type: "text",
      x: 6,
      y: 92,
      width: 95,
      height: 14,
      value: "MI EMPRESA",
      fontSize: 8,
      bold: true,
    },
    {
      id: newId(),
      type: "text",
      x: 100,
      y: 90,
      width: 83,
      height: 16,
      value: "{PRECIO}",
      fontSize: 11,
      bold: true,
      align: "right",
    },
  ],
});


export function LabelEditor() {
  const [designs, setDesigns] = useState<LabelDesign[]>([]);
  const [design, setDesign] = useState<LabelDesign>(DEFAULT_DESIGN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [copies, setCopies] = useState(1);
  const [previewRowIdx, setPreviewRowIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = loadDesigns();
    setDesigns(list);
    if (list.length > 0) setDesign(list[0]);
  }, []);

  const selected = design.elements.find((e) => e.id === selectedId) || null;
  const previewRow = rows[previewRowIdx] || sampleRow(headers);

  const updateEl = (el: LabelElement) =>
    setDesign((d) => ({
      ...d,
      elements: d.elements.map((e) => (e.id === el.id ? el : e)),
      updatedAt: Date.now(),
    }));

  const addElement = (type: "text" | "barcode") => {
    const el: LabelElement =
      type === "text"
        ? {
            id: newId(),
            type: "text",
            x: 20,
            y: 20,
            width: 160,
            height: 28,
            value: "Texto",
            fontSize: 14,
            align: "left",
          }
        : {
            id: newId(),
            type: "barcode",
            x: 20,
            y: 50,
            width: 220,
            height: 70,
            value: "123456",
            barcodeFormat: "CODE128",
            displayValue: true,
          };
    setDesign((d) => ({ ...d, elements: [...d.elements, el] }));
    setSelectedId(el.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setDesign((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== selected.id) }));
    setSelectedId(null);
  };

  const handleSave = () => {
    const list = [design, ...designs.filter((d) => d.id !== design.id)];
    setDesigns(list);
    saveDesigns(list);
    toast.success("Diseño guardado");
  };

  const handleNew = () => {
    const d = DEFAULT_DESIGN();
    setDesign(d);
    setSelectedId(null);
  };

  const handleImportCSV = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => Object.values(r).some((v) => v));
        setRows(data);
        setHeaders(res.meta.fields || []);
        setSelectedRows(new Set(data.map((_, i) => i)));
        setPreviewRowIdx(0);
        toast.success(`${data.length} filas importadas`);
      },
      error: () => toast.error("Error al leer CSV"),
    });
  };

  const printRows = useMemo(() => {
    const list = Array.from(selectedRows).sort((a, b) => a - b).map((i) => rows[i]).filter(Boolean);
    if (list.length === 0 && rows.length === 0) {
      // print preview row only
      return Array.from({ length: copies }, () => previewRow);
    }
    const out: Record<string, string>[] = [];
    for (const r of list) for (let i = 0; i < copies; i++) out.push(r);
    return out;
  }, [selectedRows, rows, copies, previewRow]);

  const handlePrint = () => {
    document.body.classList.add("printing");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("printing"), 500);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <header className="no-print border-b bg-background px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            L
          </div>
          <Input
            value={design.name}
            onChange={(e) => setDesign({ ...design, name: e.target.value })}
            className="w-56 h-9 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNew}>
            Nuevo
          </Button>
          <Select
            onValueChange={(v) => {
              const d = designs.find((x) => x.id === v);
              if (d) setDesign(d);
            }}
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Abrir diseño" />
            </SelectTrigger>
            <SelectContent>
              {designs.length === 0 && (
                <SelectItem value="none" disabled>
                  Sin diseños guardados
                </SelectItem>
              )}
              {designs.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="size-4" /> Guardar
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="no-print flex-1 flex flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="flex flex-col items-center gap-4">
          <div className="text-xs text-muted-foreground">
              {inToCm(design.widthIn).toFixed(1)} × {inToCm(design.heightIn).toFixed(1)} cm — Vista previa
            </div>

            <LabelCanvas
              design={design}
              row={previewRow}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateEl}
              editable
              scale={1.5}
            />
            {rows.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewRowIdx((i) => Math.max(0, i - 1))}
                >
                  ←
                </Button>
                <span className="text-muted-foreground">
                  Fila {previewRowIdx + 1} de {rows.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewRowIdx((i) => Math.min(rows.length - 1, i + 1))}
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-full lg:w-[360px] border-l bg-background">
          <Tabs defaultValue="label" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 m-3">
              <TabsTrigger value="label">Etiqueta</TabsTrigger>
              <TabsTrigger value="design">Diseño</TabsTrigger>
              <TabsTrigger value="data">Datos</TabsTrigger>
              <TabsTrigger value="print">Imprimir</TabsTrigger>
            </TabsList>

            <TabsContent value="label" className="px-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ancho (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inToCm(design.widthIn).toFixed(2)}
                    onChange={(e) =>
                      setDesign({ ...design, widthIn: cmToIn(parseFloat(e.target.value) || 1) })
                    }
                  />
                </div>
                <div>
                  <Label>Alto (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inToCm(design.heightIn).toFixed(2)}
                    onChange={(e) =>
                      setDesign({ ...design, heightIn: cmToIn(parseFloat(e.target.value) || 1) })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Columnas por hoja</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={design.columnsPerPage ?? 1}
                    onChange={(e) =>
                      setDesign({
                        ...design,
                        columnsPerPage: Math.max(1, Math.min(6, parseInt(e.target.value) || 1)),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa <strong>1</strong> para impresoras térmicas DigitalPOS (una etiqueta por hoja). Usa 2+ solo si imprimes en hoja A4/Carta.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa <code>{"{NOMBRE_VARIABLE}"}</code> en cualquier texto o código de barras para
                rellenar desde la columna del CSV.
              </p>
            </TabsContent>


            <TabsContent value="design" className="px-4 space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addElement("text")}>
                  <Type className="size-4" /> Texto
                </Button>
                <Button size="sm" variant="outline" onClick={() => addElement("barcode")}>
                  <BarcodeIcon className="size-4" /> Código
                </Button>
              </div>

              <div>
                <Label className="text-xs">Objetos</Label>
                <div className="border rounded-md divide-y mt-1 max-h-48 overflow-auto">
                  {design.elements.map((el) => (
                    <button
                      key={el.id}
                      onClick={() => setSelectedId(el.id)}
                      className={
                        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 " +
                        (selectedId === el.id ? "bg-accent" : "hover:bg-muted")
                      }
                    >
                      {el.type === "text" ? (
                        <Type className="size-3.5" />
                      ) : (
                        <BarcodeIcon className="size-3.5" />
                      )}
                      <span className="truncate">{el.value || "(vacío)"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selected && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <Label>Contenido</Label>
                    <Input
                      value={selected.value}
                      onChange={(e) => updateEl({ ...selected, value: e.target.value })}
                    />
                  </div>
                  {selected.type === "text" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tamaño</Label>
                          <Input
                            type="number"
                            value={selected.fontSize ?? 14}
                            onChange={(e) =>
                              updateEl({ ...selected, fontSize: parseInt(e.target.value) || 14 })
                            }
                          />
                        </div>
                        <div>
                          <Label>Alineación</Label>
                          <Select
                            value={selected.align ?? "left"}
                            onValueChange={(v: any) => updateEl({ ...selected, align: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="center">Centro</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!selected.bold}
                          onCheckedChange={(v) => updateEl({ ...selected, bold: !!v })}
                        />
                        Negrita
                      </label>
                    </>
                  )}
                  {selected.type === "barcode" && (
                    <>
                      <div>
                        <Label>Formato</Label>
                        <Select
                          value={selected.barcodeFormat ?? "CODE128"}
                          onValueChange={(v) => updateEl({ ...selected, barcodeFormat: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["CODE128", "CODE39", "EAN13", "EAN8", "UPC", "ITF14"].map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.displayValue !== false}
                          onCheckedChange={(v) => updateEl({ ...selected, displayValue: !!v })}
                        />
                        Mostrar texto del código
                      </label>
                    </>
                  )}
                  <Button variant="destructive" size="sm" onClick={removeSelected}>
                    <Trash2 className="size-4" /> Eliminar
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="px-4 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportCSV(f);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => fileRef.current?.click()} className="w-full">
                <Upload className="size-4" /> Importar CSV
              </Button>
              {headers.length > 0 && (
                <div>
                  <Label className="text-xs">Variables disponibles</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {headers.map((h) => (
                      <span
                        key={h}
                        className="text-xs bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200 px-2 py-0.5 rounded font-mono cursor-pointer"
                        onClick={() => {
                          navigator.clipboard?.writeText(`{${h}}`);
                          toast.success(`{${h}} copiado`);
                        }}
                      >
                        {`{${h}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Toca un chip para copiar y pégalo en un texto del diseño.
                  </p>
                </div>
              )}
              {rows.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {rows.length} filas cargadas · {selectedRows.size} seleccionadas
                </div>
              )}
            </TabsContent>

            <TabsContent value="print" className="px-4 space-y-3">
              <div>
                <Label>Filas a imprimir</Label>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Rows3 className="size-4" />
                      {rows.length === 0
                        ? "Sin datos — se imprime vista previa"
                        : `${selectedRows.size} / ${rows.length} filas`}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Selecciona las filas a imprimir</SheetTitle>
                    </SheetHeader>
                    {rows.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-6">
                        Importa un CSV en la pestaña Datos.
                      </p>
                    ) : (
                      <div className="mt-4">
                        <div className="flex gap-2 mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRows(new Set(rows.map((_, i) => i)))}
                          >
                            Todas
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRows(new Set())}
                          >
                            Ninguna
                          </Button>
                        </div>
                        <div className="border rounded-md max-h-[70vh] overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead className="w-10"></TableHead>
                                {headers.map((h) => (
                                  <TableHead key={h}>{h}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((r, i) => (
                                <TableRow
                                  key={i}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const next = new Set(selectedRows);
                                    if (next.has(i)) next.delete(i);
                                    else next.add(i);
                                    setSelectedRows(next);
                                    setPreviewRowIdx(i);
                                  }}
                                >
                                  <TableCell>
                                    <Checkbox checked={selectedRows.has(i)} />
                                  </TableCell>
                                  {headers.map((h) => (
                                    <TableCell key={h} className="text-xs">
                                      {r[h]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>

              <div>
                <Label>Copias por fila</Label>
                <Input
                  type="number"
                  min={1}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Total a imprimir: <span className="font-medium text-foreground">{printRows.length}</span>{" "}
                etiqueta{printRows.length === 1 ? "" : "s"}
              </div>

              <Button className="w-full" onClick={handlePrint}>
                <Printer className="size-4" /> Imprimir
              </Button>
              <p className="text-xs text-muted-foreground">
                En el diálogo de impresión, configura tamaño de papel personalizado igual al de la
                etiqueta para impresoras térmicas, o usa hoja A4 / Carta para imprimir varias.
              </p>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Print area */}
      <PrintArea design={design} printRows={printRows} />
    </div>
  );
}

function PrintArea({
  design,
  printRows,
}: {
  design: LabelDesign;
  printRows: Record<string, string>[];
}) {
  const cols = Math.max(1, design.columnsPerPage ?? 1);
  const pageWidthIn = design.widthIn * cols;
  const pageHeightIn = design.heightIn;

  // Group rows into pages of `cols`
  const pages: Record<string, string>[][] = [];
  for (let i = 0; i < printRows.length; i += cols) {
    pages.push(printRows.slice(i, i + cols));
  }

  const pageCss = `@media print { @page { size: ${pageWidthIn}in ${pageHeightIn}in; margin: 0; } }`;

  return (
    <div className="print-only">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />
      {pages.map((page, i) => (
        <div
          key={i}
          className="print-label"
          style={{
            width: `${pageWidthIn}in`,
            height: `${pageHeightIn}in`,
            display: "flex",
            flexDirection: "row",
          }}
        >
          {page.map((r, j) => (
            <div
              key={j}
              style={{
                width: `${design.widthIn}in`,
                height: `${design.heightIn}in`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <LabelCanvas design={design} row={r} scale={1} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function sampleRow(headers: string[]): Record<string, string> {
  const r: Record<string, string> = {
    PRODUCTO: "Resistencia Velocidades Chevrolet Dmax",
    CODIGO: "RE6257480301",
    PRECIO: "$160.000",
    FECHA: "",
  };
  for (const h of headers) if (!(h in r)) r[h] = h;
  return r;
}

