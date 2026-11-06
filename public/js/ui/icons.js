const paths={
  home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  settings:'m9 3-1 3-3 1-2 3 2 3v4l3 1 1 3h5l1-3 3-1 2-3-2-3V7l-3-1-1-3Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  demo:'M7 7h10c4 0 7 13 3 13l-5-4H9l-5 4C0 20 3 7 7 7Zm-2 5h6m-3-3v6m8-4h.01m3 3h.01',
  logs:'M6 3h9l4 4v14H5V3Zm8 0v5h5M8 12h8m-8 4h5',
  backup:'M20 6c0 2-16 2-16 0s16-2 16 0Zm0 0v12c0 4-16 4-16 0V6m0 6c0 3 16 3 16 0',
  external:'M14 3h7v7m0-7L10 14M10 5H4v16h16v-6',
  arrow:'M5 12h14m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',collapse:'m14 5-7 7 7 7',menu:'M4 6h16M4 12h16M4 18h16',
  sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  users:'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-5a3 3 0 0 1 0 6M3 20v-3c0-6 12-6 12 0v3Zm14-6c4 0 5 2 5 6',
  swords:'m4 3 14 14m-5 0 5-5m-3 7 4-4m-3 3 4 4M20 3 6 17m5 0-5-5m3 7-4-4m3 3-4 4',
  monitor:'M3 4h18v13H3ZM8 21h8m-4-4v4',clock:'M12 3a9 9 0 1 0 9 9M12 3v9l5 3m0-12h4v4',
  flag:'M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0',lotus:'M12 21C5 15 7 6 12 2c5 4 7 13 0 19Zm0 0C3 20 1 12 2 8c7 1 10 6 10 13Zm0 0c9-1 11-9 10-13-7 1-10 6-10 13Z',
  bolt:'m14 2-10 12h7l-1 8 10-12h-7Z',gift:'M3 8h18v4H3Zm2 4v10h14V12M12 8v14m0-14c-7 0-8-6-4-6 3 0 4 6 4 6Zm0 0c7 0 8-6 4-6-3 0-4 6-4 6Z',
  music:'M9 18V5l11-2v13M9 5l11-2M9 18c0 4-7 4-7 0s7-4 7 0Zm11-2c0 4-7 4-7 0s7-4 7 0Z',
  play:'m7 3 15 9-15 9Z',pause:'M8 4v16M16 4v16',stop:'M5 5h14v14H5Z',
  volume:'m3 9 5 0 5-5v16l-5-5H3Zm14-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16',
  check:'m4 12 5 5L20 6',error:'M12 3 2 21h20ZM12 9v5m0 3v1',search:'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-2 5 7 7',
  refresh:'M3 10a9 9 0 0 1 16-5l2 2M21 2v5h-5m5 7a9 9 0 0 1-16 5l-2-2m0 5v-5h5',copy:'M8 8h13v13H8ZM3 16V3h13'
};
export function icon(name,cls=''){return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]??paths.logs}"/></svg>`;}
