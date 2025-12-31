// src/utils/file.ts

export const downloadFileFromUrl = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const sanitizeFilename = (name: string, fallback: string, maxLength: number = 50): string => {
  const sanitized = name.replace(/[/\\:*?"<>|]/g, '_').substring(0, maxLength).trim();
  return sanitized || fallback;
};
