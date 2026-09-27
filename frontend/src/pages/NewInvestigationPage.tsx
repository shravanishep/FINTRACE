import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../components/Layout/AppLayout';
import { Button } from '../components/UI/Button';
import { investigationApi } from '../services/api';

export const NewInvestigationPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdInvId, setCreatedInvId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.toLowerCase().endsWith('.csv')) {
        setFile(selected);
        setError(null);
      } else {
        setError('Please select a valid CSV dataset file (e.g. HI-Small_Trans.csv).');
      }
    }
  };

  const handleCreateAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Investigation name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep(2);

    try {
      setStatusMessage('Creating workspace...');
      const newInv = await investigationApi.create(name, description);
      setCreatedInvId(newInv.id);

      if (file) {
        setStatusMessage('Ingesting & running detection pipeline (Upload → Validate → Analyze → Detect → Connect → Create Cases)...');
        await investigationApi.uploadDataset(newInv.id, file);
      }

      setStatusMessage('Analysis complete!');
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create workspace or execute pipeline.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 font-sans">
        
        {/* Page Header */}
        <div className="border-b border-fin-border pb-3">
          <h1 className="text-base font-bold text-fin-text flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-fin-accent" />
            New Investigation Workflow
          </h1>
          <p className="text-xs text-fin-subtext mt-0.5">
            Create an investigation workspace and execute detection analysis on financial transaction datasets
          </p>
        </div>

        {/* Pipeline Workflow Visualization */}
        <div className="fin-panel p-3.5 bg-white text-xs space-y-2">
          <span className="text-2xs font-semibold text-fin-subtext uppercase tracking-wider block">Detection Pipeline Architecture:</span>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-fin-subtext pt-1">
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-fin-text font-semibold">1. UPLOAD</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-fin-text font-semibold">2. VALIDATE</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-fin-text font-semibold">3. ANALYZE</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold">4. DETECT</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">5. CONNECT</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">6. CREATE CASES</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 01 FORM */}
        {step === 1 && (
          <form onSubmit={handleCreateAndUpload} className="space-y-4">
            <div className="fin-panel p-5 bg-white space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fin-text mb-1">
                  Investigation Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Investigation 01 — Q3 High-Risk Account Flow"
                  className="w-full bg-white border border-fin-border rounded px-3 py-2 text-xs text-fin-text focus:border-fin-accent focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fin-text mb-1">
                  Scope / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Key suspect entities, time bounds, or specific banking channels under review..."
                  className="w-full bg-white border border-fin-border rounded px-3 py-2 text-xs text-fin-text focus:border-fin-accent focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fin-text mb-1">
                  Transaction Dataset (.csv)
                </label>
                <div className="border-2 border-dashed border-fin-border hover:border-fin-accent rounded-lg p-6 text-center bg-slate-50 transition-colors">
                  <UploadCloud className="h-7 w-7 text-fin-accent mx-auto mb-1 opacity-80" />
                  <p className="text-xs font-semibold text-fin-text">
                    Select Transaction Dataset (.csv)
                  </p>
                  <p className="text-xs text-fin-subtext mt-0.5 mb-2">
                    Format: IBM AML dataset (HI-Small_Trans.csv or compatible)
                  </p>

                  <label className="cursor-pointer inline-block">
                    <span className="px-3 py-1.5 rounded bg-white border border-fin-border text-xs text-fin-text font-medium hover:bg-slate-100 shadow-sm">
                      Browse File
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <div className="mt-4 p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between max-w-sm mx-auto">
                      <span className="flex items-center gap-1.5 truncate font-medium">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-fin-accent" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <span className="text-fin-subtext shrink-0 ml-2 font-mono text-[11px]">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Size Disclaimer Notice */}
              <div className="p-3 rounded bg-slate-50 border border-fin-border text-2xs text-fin-subtext leading-relaxed">
                <strong className="text-fin-text font-semibold">Dataset Processing Scope Notice:</strong> If an uploaded dataset contains millions of records (e.g. 5,071,058 rows in HI-Small_Trans.csv), a representative 5,000-transaction sample is processed for rapid detection analysis and graph visualization.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="gap-1.5"
                isLoading={isSubmitting}
              >
                Start Ingestion & Analysis
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 02: ANALYSIS PROGRESS */}
        {step === 2 && (
          <div className="fin-panel p-10 text-center space-y-4 bg-white">
            <svg className="animate-spin h-8 w-8 text-fin-accent mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 className="text-xs font-semibold text-fin-text">{statusMessage}</h3>
            <p className="text-xs text-fin-subtext max-w-sm mx-auto">Running Rule Engine detection, Isolation Forest ML anomaly scoring, entity graph construction, and signal correlation...</p>
          </div>
        )}

        {/* STEP 03: READY */}
        {step === 3 && createdInvId && (
          <div className="fin-panel p-8 text-center space-y-4 bg-white">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-fin-text">Investigation Workspace Created</h3>
              <p className="text-xs text-fin-subtext">The dataset has been ingested and detection engines executed successfully.</p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="gap-1.5"
                onClick={() => navigate(`/investigations/${createdInvId}`)}
              >
                Open Investigation Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};
