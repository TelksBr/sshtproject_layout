export function openExternalUrl(uri: string) {
  if (typeof window?.DtStartWebViewActivity?.execute === 'function') {
    return window.DtStartWebViewActivity.execute(uri);
  }
  console.error('DtStartWebViewActivity is not available');
}