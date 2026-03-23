"use client";

import React from 'react';
import { ChainNode, ExternalProcurementChain, InternalProcurementChain } from '@/types';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface ChainStepperProps {
  chainType: 'external' | 'internal';
  chain: ExternalProcurementChain | InternalProcurementChain | null;
  onNodeClick?: (docType: string, id: number, number: string) => void;
  loading?: boolean;
}

const EXTERNAL_STEPS = [
  { key: 'smr',  label: 'SMR', single: true  },
  { key: 'lpos', label: 'LPO', single: false },
  { key: 'grns', label: 'GRN', single: false },
  { key: 'tvs',  label: 'TV',  single: false },
  { key: 'dns',  label: 'DN',  single: false },
];

const INTERNAL_STEPS = [
  { key: 'simr',         label: 'SIMR',       single: true  },
  { key: 'gins',         label: 'GIN',        single: false },
  { key: 'grns',         label: 'GRN',        single: false },
  { key: 'tvs',          label: 'TV',         single: false },
  { key: 'dns',          label: 'DN',         single: false },
];

function getNodes(chain: any, key: string, single: boolean): ChainNode[] {
  if (!chain) return [];
  const val = chain[key];
  if (!val) return [];
  if (single) return [val];
  return Array.isArray(val) ? val : [];
}

function statusColor(status: string): string {
  if (['approved', 'issued', 'fulfilled', 'completed', 'delivered', 'signed', 'passed'].includes(status))
    return 'border-green-400 bg-green-50 text-green-800';
  if (['rejected', 'failed', 'cancelled'].includes(status))
    return 'border-red-400 bg-red-50 text-red-700';
  if (['pending_fm_approval', 'pending', 'pending_approval', 'draft'].includes(status))
    return 'border-yellow-400 bg-yellow-50 text-yellow-800';
  return 'border-gray-300 bg-gray-50 text-gray-700';
}

interface StepColumnProps {
  label: string;
  nodes: ChainNode[];
  isLast: boolean;
  onNodeClick?: (docType: string, id: number, number: string) => void;
}

function StepColumn({ label, nodes, isLast, onNodeClick }: StepColumnProps) {
  return (
    <div className="flex items-start gap-0 flex-shrink-0">
      <div className="flex flex-col items-center gap-1 min-w-[90px]">
        <span className="text-xs font-semibold text-muted-foreground mb-1">{label}</span>
        {nodes.length === 0 ? (
          <div className="w-20 h-9 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs">
            —
          </div>
        ) : (
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onNodeClick?.(node.doc_type, node.id, node.number)}
              className={`w-20 px-1 py-1 rounded border text-xs font-mono truncate text-center hover:opacity-80 transition-opacity ${statusColor(node.status)}`}
              title={`${node.number} — ${node.status}`}
            >
              {node.number}
            </button>
          ))
        )}
      </div>
      {!isLast && (
        <div className="flex items-center self-stretch mt-6">
          <div className="w-5 h-px bg-gray-300" />
          <svg className="w-2 h-2 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 6 6">
            <polygon points="0,0 6,3 0,6" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function ChainStepper({ chainType, chain, onNodeClick, loading }: ChainStepperProps) {
  const steps = chainType === 'external' ? EXTERNAL_STEPS : INTERNAL_STEPS;

  if (loading) {
    return <div className="text-sm text-muted-foreground py-2">Loading chain…</div>;
  }

  if (!chain) {
    return <div className="text-sm text-muted-foreground py-2">No chain data available.</div>;
  }

  const triggeredSmr = chainType === 'internal' ? (chain as InternalProcurementChain).triggered_smr : null;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start gap-0 w-max">
        {steps.map((step, i) => {
          const nodes = getNodes(chain, step.key, step.single);
          return (
            <StepColumn
              key={step.key}
              label={step.label}
              nodes={nodes}
              isLast={i === steps.length - 1 && !triggeredSmr}
              onNodeClick={onNodeClick}
            />
          );
        })}

        {triggeredSmr && (
          <>
            <div className="flex items-center self-stretch mt-6">
              <div className="w-5 h-px bg-amber-300" />
              <svg className="w-2 h-2 text-amber-300 flex-shrink-0" fill="currentColor" viewBox="0 0 6 6">
                <polygon points="0,0 6,3 0,6" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[90px]">
              <span className="text-xs font-semibold text-amber-600 mb-1">→ SMR</span>
              <button
                type="button"
                onClick={() => onNodeClick?.(triggeredSmr.doc_type, triggeredSmr.id, triggeredSmr.number)}
                className={`w-20 px-1 py-1 rounded border text-xs font-mono truncate text-center hover:opacity-80 transition-opacity ${statusColor(triggeredSmr.status)}`}
                title={`${triggeredSmr.number} — ${triggeredSmr.status}`}
              >
                {triggeredSmr.number}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
