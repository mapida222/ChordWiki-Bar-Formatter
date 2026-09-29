function nonNegativeCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function normalizeStoredMusicXmlResult(saved) {
  const result = saved?.result;
  if (!result || typeof result !== 'object') return null;
  if (typeof result.chordWiki !== 'string' || result.chordWiki.length === 0) return null;
  if (!Array.isArray(result.measures)) return null;

  return {
    result: {
      title: typeof result.title === 'string' ? result.title : '',
      partName: typeof result.partName === 'string' ? result.partName : '',
      bpm: typeof result.bpm === 'string' ? result.bpm : '',
      timeSignature: typeof result.timeSignature === 'string' ? result.timeSignature : '',
      measures: result.measures,
      harmonyCount: nonNegativeCount(result.harmonyCount),
      lyricCount: nonNegativeCount(result.lyricCount),
      warnings: Array.isArray(result.warnings)
        ? result.warnings.filter((warning) => typeof warning === 'string')
        : [],
      chordWiki: result.chordWiki,
    },
    fileName: typeof saved.fileName === 'string' ? saved.fileName : '',
    fileSize: Number.isFinite(saved.fileSize) && saved.fileSize >= 0 ? saved.fileSize : 0,
  };
}
