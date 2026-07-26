"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { downloadApi, fetchApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DbStatus {
  path: string;
  size: number;
  sizeFormatted: string;
  lastModified: string | null;
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalCategories: number;
  storageUsed: number;
  storageUsedFormatted: string;
  backupCount: number;
  backupsTotalSize: number;
  backupsTotalSizeFormatted: string;
}

interface BackupInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  modifiedAt: string;
}

interface AuditLog {
  id: number;
  admin_name: string;
  admin_email: string | null;
  ip_address: string | null;
  action: string;
  old_database_size: number | null;
  new_database_size: number | null;
  backup_name: string | null;
  success: number;
  error_message: string | null;
  created_at: string;
}

interface ValidationState {
  valid: boolean;
  tempId?: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  errors: string[];
  warnings: string[];
  stats?: {
    products: number;
    users: number;
    orders: number;
    categories: number;
    settings: number;
  };
}

const MAX_BYTES = 500 * 1024 * 1024;
const CONFIRM_PHRASE = 'REPLACE DATABASE';

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function DatabaseManagementPage() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<DbStatus | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restartRequired, setRestartRequired] = useState(false);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState<BackupInfo | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busyBackup, setBusyBackup] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [statusRes, backupsRes, auditRes] = await Promise.all([
        fetchApi('/admin/database/status'),
        fetchApi('/admin/database/backups'),
        fetchApi('/admin/database/audit-log'),
      ]);
      setStatus(statusRes.status);
      setBackups(backupsRes.backups || []);
      setAuditLogs(auditRes.logs || []);
      setForbidden(false);
    } catch (error: any) {
      if (error.status === 403) {
        setForbidden(true);
      } else {
        setErrorMessage(error.message || 'Failed to load database management data');
        toast.error(error.message || 'Failed to load database info');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    loadAll();
  }, [authLoading, isSuperAdmin, loadAll]);

  const resetUploadState = () => {
    setSelectedFile(null);
    setValidation(null);
    setUploadProgress(0);
    setConfirmText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const acceptFile = (file: File | null) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setRestartRequired(false);
    setValidation(null);

    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.db') && !lower.endsWith('.sqlite')) {
      setErrorMessage('Invalid file type. Only .db and .sqlite files are allowed.');
      toast.error('Only .db and .sqlite files are allowed');
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorMessage('File exceeds the 500 MB maximum size.');
      toast.error('File exceeds 500 MB limit');
      return;
    }

    setSelectedFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    acceptFile(file);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('database', selectedFile);

      const result = await uploadApi('/admin/database/validate', formData, setUploadProgress);

      setValidation({
        valid: true,
        tempId: result.tempId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileSizeFormatted: result.fileSizeFormatted,
        errors: [],
        warnings: result.warnings || [],
        stats: result.stats,
      });
      toast.success('Database validated successfully');
    } catch (error: any) {
      const data = error.data || {};
      setValidation({
        valid: false,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileSizeFormatted: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        errors: data.errors || [error.message || 'Validation failed'],
        warnings: data.warnings || [],
      });
      setErrorMessage(error.message || 'Validation failed');
      toast.error(error.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReplace = async () => {
    if (!validation?.tempId || confirmText !== CONFIRM_PHRASE) return;

    setIsReplacing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setRestartRequired(false);

    try {
      const result = await fetchApi('/admin/database/replace', {
        method: 'POST',
        body: JSON.stringify({
          tempId: validation.tempId,
          confirmation: CONFIRM_PHRASE,
        }),
      });

      setShowReplaceModal(false);
      setSuccessMessage(result.message || 'Database replaced successfully');
      toast.success('Database replaced successfully');
      resetUploadState();
      await loadAll();
    } catch (error: any) {
      const data = error.data || {};
      if (data.requiresRestart) {
        setRestartRequired(true);
      }
      setErrorMessage(error.message || 'Database replace failed');
      toast.error(error.message || 'Replace failed');
      setShowReplaceModal(false);
      await loadAll();
    } finally {
      setIsReplacing(false);
      setConfirmText('');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBusyBackup('__create__');
      const result = await fetchApi('/admin/database/backups', { method: 'POST' });
      toast.success(`Backup created: ${result.backup?.name}`);
      await loadAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create backup');
    } finally {
      setBusyBackup(null);
    }
  };

  const handleDownload = async (backup: BackupInfo) => {
    try {
      setBusyBackup(backup.name);
      await downloadApi(`/admin/database/backups/${encodeURIComponent(backup.name)}/download`, backup.name);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(error.message || 'Download failed');
    } finally {
      setBusyBackup(null);
    }
  };

  const handleDelete = async (backup: BackupInfo) => {
    if (!window.confirm(`Delete backup "${backup.name}"? This cannot be undone.`)) return;
    try {
      setBusyBackup(backup.name);
      await fetchApi(`/admin/database/backups/${encodeURIComponent(backup.name)}`, { method: 'DELETE' });
      toast.success('Backup deleted');
      await loadAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete backup');
    } finally {
      setBusyBackup(null);
    }
  };

  const handleRestore = async () => {
    if (!showRestoreModal || confirmText !== CONFIRM_PHRASE) return;

    setIsReplacing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setRestartRequired(false);

    try {
      const result = await fetchApi(
        `/admin/database/backups/${encodeURIComponent(showRestoreModal.name)}/restore`,
        {
          method: 'POST',
          body: JSON.stringify({ confirmation: CONFIRM_PHRASE }),
        }
      );
      setShowRestoreModal(null);
      setSuccessMessage(result.message || 'Database restored successfully');
      toast.success('Database restored');
      await loadAll();
    } catch (error: any) {
      const data = error.data || {};
      if (data.requiresRestart) setRestartRequired(true);
      setErrorMessage(error.message || 'Restore failed');
      toast.error(error.message || 'Restore failed');
      setShowRestoreModal(null);
      await loadAll();
    } finally {
      setIsReplacing(false);
      setConfirmText('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="glass-card p-10">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">403 Forbidden</h1>
          <p className="text-dark-300 mb-6">
            Only Super Admins can access Database Management.
          </p>
          <button onClick={() => router.push('/admin')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const storagePercent = status
    ? Math.min(100, Math.round((status.size / Math.max(status.storageUsed, 1)) * 100))
    : 0;

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-dark-400 mb-2">
            <Link href="/admin/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
            <span>/</span>
            <span className="text-dark-200">Database</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <Database className="w-7 h-7 text-primary-400" />
            Database Management
          </h1>
          <p className="text-dark-400">
            Backup, validate, and safely replace the application SQLite database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={busyBackup === '__create__'}
            className="btn-secondary"
          >
            {busyBackup === '__create__' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
            Create Backup
          </button>
          <button onClick={loadAll} className="btn-secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {restartRequired && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300">Backend restart may be required</div>
            <p className="text-sm text-amber-200/80 mt-1">
              The database file operation could not fully reconnect. Restart the API server, then verify
              the application. If needed, restore from the latest backup listed below.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-emerald-300">Success</div>
            <p className="text-sm text-emerald-200/80 mt-1">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400/70 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-rose-300">Error</div>
            <p className="text-sm text-rose-200/80 mt-1 whitespace-pre-wrap">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400/70 hover:text-rose-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status + Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
            <Database className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">Current Database Status</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatusRow label="Database Path" value={status?.path || '—'} mono />
            <StatusRow label="Database Size" value={status?.sizeFormatted || '—'} />
            <StatusRow label="Last Modified" value={formatDate(status?.lastModified)} />
            <StatusRow label="Total Products" value={String(status?.totalProducts ?? '—')} />
            <StatusRow label="Total Users" value={String(status?.totalUsers ?? '—')} />
            <StatusRow label="Total Orders" value={String(status?.totalOrders ?? '—')} />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-secondary-400" />
            <h2 className="text-lg font-bold text-white">Storage Usage</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-dark-300">Live DB share</span>
                <span className="text-white font-medium">{storagePercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
            <StatusRow label="Total Storage Used" value={status?.storageUsedFormatted || '—'} />
            <StatusRow label="Backups" value={`${status?.backupCount ?? 0} (${status?.backupsTotalSizeFormatted || '0 B'})`} />
            <StatusRow label="Categories" value={String(status?.totalCategories ?? '—')} />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
          <Upload className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Upload Database</h2>
        </div>
        <div className="p-6 space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver
                ? 'border-primary-400 bg-primary-500/10'
                : 'border-dark-700 bg-dark-900/40 hover:border-dark-500'
            }`}
          >
            <Upload className="w-10 h-10 text-dark-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Drag & drop a SQLite database here</p>
            <p className="text-sm text-dark-400">
              Accepted: .db, .sqlite · Max size: 500 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,application/x-sqlite3,application/octet-stream"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0] || null)}
            />
          </div>

          {selectedFile && (
            <div className="rounded-xl bg-dark-900/60 border border-dark-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-dark-400 mb-1">Selected filename</div>
                  <div className="text-white font-medium break-all">{selectedFile.name}</div>
                </div>
                <div>
                  <div className="text-dark-400 mb-1">Database size</div>
                  <div className="text-white font-medium">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div className="text-dark-400 mb-1">Validation result</div>
                  <div className="text-white font-medium">
                    {!validation && 'Not validated'}
                    {validation?.valid && <span className="text-emerald-400">Valid</span>}
                    {validation && !validation.valid && <span className="text-rose-400">Failed</span>}
                  </div>
                </div>
              </div>

              {(isValidating || uploadProgress > 0) && (
                <div>
                  <div className="flex justify-between text-xs text-dark-400 mb-1">
                    <span>{isValidating ? 'Uploading & validating…' : 'Upload progress'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {validation && !validation.valid && validation.errors.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  <div className="font-bold mb-1">Validation errors</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {validation.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation?.valid && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 space-y-2">
                  <div className="font-bold">Validation passed</div>
                  {validation.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <span>Products: {validation.stats.products}</span>
                      <span>Users: {validation.stats.users}</span>
                      <span>Orders: {validation.stats.orders}</span>
                      <span>Categories: {validation.stats.categories}</span>
                      <span>Settings: {validation.stats.settings}</span>
                    </div>
                  )}
                  {validation.warnings?.length > 0 && (
                    <ul className="list-disc pl-5 text-amber-200/90">
                      {validation.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleValidate}
                  disabled={isValidating || isReplacing}
                  className="btn-secondary"
                >
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Validate
                </button>
                <button
                  onClick={() => {
                    setConfirmText('');
                    setShowReplaceModal(true);
                  }}
                  disabled={!validation?.valid || isReplacing}
                  className="btn-primary disabled:opacity-40"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Replace Database
                </button>
                <button onClick={resetUploadState} className="btn-secondary" disabled={isValidating || isReplacing}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backups */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-secondary-400" />
          <h2 className="text-lg font-bold text-white">Recent Backups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 text-dark-400 text-sm border-b border-dark-800">
              <tr>
                <th className="px-6 py-4 font-medium">Backup Name</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-dark-400">
                    No backups yet. Create one before replacing the database.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.name} className="hover:bg-dark-800/40">
                    <td className="px-6 py-4 text-sm text-white font-medium break-all">{backup.name}</td>
                    <td className="px-6 py-4 text-sm text-dark-300">{formatDate(backup.modifiedAt)}</td>
                    <td className="px-6 py-4 text-sm text-dark-300">{backup.sizeFormatted}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup)}
                          disabled={busyBackup === backup.name}
                          className="px-3 py-1.5 rounded-lg bg-dark-800 text-xs font-bold text-dark-200 hover:text-white hover:bg-dark-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          onClick={() => {
                            setConfirmText('');
                            setShowRestoreModal(backup);
                          }}
                          disabled={isReplacing}
                          className="px-3 py-1.5 rounded-lg bg-primary-500/15 text-xs font-bold text-primary-300 hover:bg-primary-500/25 transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => handleDelete(backup)}
                          disabled={busyBackup === backup.name}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit log */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
          <History className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 text-dark-400 text-sm border-b border-dark-800">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Admin</th>
                <th className="px-6 py-4 font-medium">IP</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Sizes</th>
                <th className="px-6 py-4 font-medium">Backup</th>
                <th className="px-6 py-4 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-dark-400">
                    No database operations logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-800/40">
                    <td className="px-6 py-3 text-xs text-dark-300 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-3 text-sm text-white">
                      <div>{log.admin_name}</div>
                      <div className="text-xs text-dark-400">{log.admin_email}</div>
                    </td>
                    <td className="px-6 py-3 text-xs text-dark-300 font-mono">{log.ip_address || '—'}</td>
                    <td className="px-6 py-3 text-xs text-dark-200">{log.action}</td>
                    <td className="px-6 py-3 text-xs text-dark-300">
                      {log.old_database_size != null || log.new_database_size != null
                        ? `${log.old_database_size ?? '—'} → ${log.new_database_size ?? '—'}`
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-dark-300 break-all max-w-[180px]">
                      {log.backup_name || '—'}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {log.success ? (
                        <span className="text-emerald-400 font-bold">Success</span>
                      ) : (
                        <span className="text-rose-400 font-bold" title={log.error_message || ''}>
                          Failure
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replace confirmation modal */}
      {showReplaceModal && (
        <ConfirmModal
          title="Replace Database"
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          isBusy={isReplacing}
          onCancel={() => {
            setShowReplaceModal(false);
            setConfirmText('');
          }}
          onConfirm={handleReplace}
        >
          <p className="text-dark-200 mb-4">
            This will replace the current database.
          </p>
          <ul className="text-sm text-dark-300 list-disc pl-5 space-y-1 mb-4">
            <li>Products</li>
            <li>Orders</li>
            <li>Users</li>
            <li>Settings</li>
            <li>Inventory</li>
          </ul>
          <p className="text-sm text-dark-300 mb-2">
            will all be replaced.
          </p>
          <p className="text-sm text-amber-300/90">
            A backup will be created automatically before continuing.
          </p>
        </ConfirmModal>
      )}

      {/* Restore confirmation modal */}
      {showRestoreModal && (
        <ConfirmModal
          title="Replace Database"
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          isBusy={isReplacing}
          onCancel={() => {
            setShowRestoreModal(null);
            setConfirmText('');
          }}
          onConfirm={handleRestore}
        >
          <p className="text-dark-200 mb-3">
            Restore backup <span className="text-white font-semibold break-all">{showRestoreModal.name}</span>?
          </p>
          <p className="text-sm text-dark-300 mb-4">
            This will replace the current database. Products, Orders, Users, Settings, and Inventory
            will all be replaced. A safety backup of the current database will be created first.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

function StatusRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-dark-950/50 border border-dark-800/80 p-3">
      <div className="text-xs text-dark-400 mb-1">{label}</div>
      <div className={`text-sm text-white break-all ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  children,
  confirmText,
  setConfirmText,
  isBusy,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: React.ReactNode;
  confirmText: string;
  setConfirmText: (v: string) => void;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canConfirm = confirmText === CONFIRM_PHRASE && !isBusy;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-dark-800 bg-rose-500/10 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="p-6">
          {children}
          <label className="block text-sm font-medium text-dark-300 mt-6 mb-2">
            Type <span className="text-white font-mono">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="input-field font-mono"
            placeholder={CONFIRM_PHRASE}
            autoFocus
            disabled={isBusy}
          />
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} disabled={isBusy} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-40 hover:bg-rose-500 transition-colors inline-flex items-center gap-2"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Confirm Replace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
