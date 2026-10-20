'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
} from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableSegmentFilter<T> {
  id: string;
  label: string;
  count?: number;
  filterFn: (item: T) => boolean;
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  searchFields?: (keyof T | string)[];
  searchPlaceholder?: string;
  segments?: DataTableSegmentFilter<T>[];
  onCreate?: () => void;
  createLabel?: string;
  defaultPageSize?: number;
  actions?: (item: T) => React.ReactNode;
  rowKey: (item: T) => string;
}

export function DataTable<T>({
  title,
  subtitle,
  data,
  columns,
  searchFields = [],
  searchPlaceholder = 'Buscar...',
  segments = [],
  onCreate,
  createLabel = 'Crear Nuevo',
  defaultPageSize = 5,
  actions,
  rowKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>(
    segments.length > 0 ? segments[0].id : 'all'
  );
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // 1. Filtrar por búsqueda y segmento
  const filteredData = useMemo(() => {
    let result = [...data];

    // Aplicar segmento
    if (selectedSegment !== 'all') {
      const activeSegment = segments.find((s) => s.id === selectedSegment);
      if (activeSegment) {
        result = result.filter(activeSegment.filterFn);
      }
    }

    // Aplicar búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = (item as any)[field];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          });
        }
        // Buscar en todos los valores del objeto si no se especificaron campos
        return Object.values(item as any).some(
          (val) => val !== undefined && val !== null && String(val).toLowerCase().includes(q)
        );
      });
    }

    // Aplicar ordenación
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        let valA = col?.accessor ? col.accessor(a) : (a as any)[sortKey];
        let valB = col?.accessor ? col.accessor(b) : (b as any)[sortKey];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, selectedSegment, searchQuery, sortKey, sortDirection, segments, searchFields, columns]);

  // 2. Paginación
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Manejar cambio de ordenación
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Encabezado y Barra de Herramientas */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {(title || subtitle) && (
            <div>
              {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          )}

          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{createLabel}</span>
            </button>
          )}
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Segmentos / Pestañas de Filtro */}
          {segments.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {segments.map((seg) => {
                const count = seg.id === 'all' ? data.length : data.filter(seg.filterFn).length;
                const active = selectedSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => {
                      setSelectedSegment(seg.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
                    }`}
                  >
                    <span>{seg.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Campo de Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`py-3.5 px-4 font-semibold ${
                    col.sortable ? 'cursor-pointer hover:text-white' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-500">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="py-3.5 px-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-12 text-center text-slate-500 text-xs"
                >
                  No se encontraron registros que coincidan con la búsqueda o filtro.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={rowKey(item)} className="hover:bg-slate-900/40 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`py-3.5 px-4 ${col.className || ''}`}>
                      {col.render
                        ? col.render(item, idx)
                        : col.accessor
                        ? col.accessor(item)
                        : (item as any)[col.key]}
                    </td>
                  ))}
                  {actions && <td className="py-3.5 px-4 text-right">{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de Tabla / Paginación */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            de <span className="text-white font-semibold">{filteredData.length}</span> resultados
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            Página <span className="text-white font-semibold">{currentPage}</span> de{' '}
            <span className="text-white font-semibold">{totalPages}</span>
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
