export function openUrl(url: string) {
  if (typeof window?.DtStartWebViewActivity?.execute === 'function') {
    return window.DtStartWebViewActivity.execute(url);
  }
}

export function openExternalUrl(uri: string) {
  if (typeof window?.DtStartWebViewActivity?.execute === 'function') {
    return window.DtStartWebViewActivity.execute(uri);
  }
}