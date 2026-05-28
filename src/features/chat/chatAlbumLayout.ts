/** Раскладка альбома вложений (как в Telegram). */

export const CHAT_ALBUM_MAX_WIDTH = 280;
export const CHAT_ALBUM_MAX_HEIGHT = 360;
export const CHAT_ALBUM_GAP = 2;

export type AlbumPhotoSize = { width: number; height: number };

export type AlbumLayoutRect = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AlbumLayout = {
  width: number;
  height: number;
  rects: AlbumLayoutRect[];
};

function ratio(size: AlbumPhotoSize): number {
  return size.width / size.height;
}

export function resolveAlbumPhotoSizes(
  attachments: { width?: number; height?: number }[],
): AlbumPhotoSize[] {
  return attachments.map((a) => {
    if (a.width != null && a.height != null && a.width > 0 && a.height > 0) {
      return { width: a.width, height: a.height };
    }
    return { width: 4, height: 3 };
  });
}

export function computeChatAlbumLayout(sizes: AlbumPhotoSize[]): AlbumLayout {
  const n = sizes.length;
  if (n === 0) return { width: 0, height: 0, rects: [] };
  const ratios = sizes.map(ratio);
  if (n === 1) return layoutOne(ratios[0]);
  if (n === 2) return layoutTwo(ratios);
  if (n === 3) return layoutThree(ratios);
  if (n === 4) return layoutFour();
  return layoutGrid(ratios);
}

function layoutOne(r: number): AlbumLayout {
  let w = CHAT_ALBUM_MAX_WIDTH;
  let h = w / r;
  if (h > CHAT_ALBUM_MAX_HEIGHT) {
    h = CHAT_ALBUM_MAX_HEIGHT;
    w = h * r;
  }
  return { width: w, height: h, rects: [{ index: 0, x: 0, y: 0, width: w, height: h }] };
}

function layoutTwo(ratios: number[]): AlbumLayout {
  const [r1, r2] = ratios;
  const gap = CHAT_ALBUM_GAP;

  const hRow = Math.min(CHAT_ALBUM_MAX_HEIGHT, (CHAT_ALBUM_MAX_WIDTH - gap) / (r1 + r2));
  const rowW = hRow * (r1 + r2) + gap;
  const rowArea = rowW * hRow;

  const wCol = Math.min(CHAT_ALBUM_MAX_WIDTH, (CHAT_ALBUM_MAX_HEIGHT - gap) / (1 / r1 + 1 / r2));
  const hTop = wCol / r1;
  const hBottom = wCol / r2;
  const colH = hTop + gap + hBottom;
  const colArea = wCol * colH;

  if (rowArea >= colArea) {
    const w1 = hRow * r1;
    return {
      width: rowW,
      height: hRow,
      rects: [
        { index: 0, x: 0, y: 0, width: w1, height: hRow },
        { index: 1, x: w1 + gap, y: 0, width: hRow * r2, height: hRow },
      ],
    };
  }

  return {
    width: wCol,
    height: colH,
    rects: [
      { index: 0, x: 0, y: 0, width: wCol, height: hTop },
      { index: 1, x: 0, y: hTop + gap, width: wCol, height: hBottom },
    ],
  };
}

function layoutRow(ratios: number[]): AlbumLayout {
  const gap = CHAT_ALBUM_GAP;
  const sum = ratios.reduce((a, b) => a + b, 0);
  const h = Math.min(CHAT_ALBUM_MAX_HEIGHT, (CHAT_ALBUM_MAX_WIDTH - (ratios.length - 1) * gap) / sum);
  let x = 0;
  const rects: AlbumLayoutRect[] = ratios.map((r, index) => {
    const w = h * r;
    const rect = { index, x, y: 0, width: w, height: h };
    x += w + gap;
    return rect;
  });
  return { width: x - gap, height: h, rects };
}

function layoutThree(ratios: number[]): AlbumLayout {
  const gap = CHAT_ALBUM_GAP;
  const allWide = ratios.every((r) => r >= 1.05);
  if (allWide) return layoutRow(ratios);

  const [r0, r1, r2] = ratios;
  let h = CHAT_ALBUM_MAX_HEIGHT;
  let leftW = h * r0;
  const rightCellH = (h - gap) / 2;
  let rightW = Math.max(rightCellH * r1, rightCellH * r2);
  let totalW = leftW + gap + rightW;

  if (totalW > CHAT_ALBUM_MAX_WIDTH) {
    const scale = CHAT_ALBUM_MAX_WIDTH / totalW;
    h *= scale;
    leftW *= scale;
    rightW *= scale;
    totalW = CHAT_ALBUM_MAX_WIDTH;
  }

  const scaledRightCellH = (h - gap) / 2;

  return {
    width: totalW,
    height: h,
    rects: [
      { index: 0, x: 0, y: 0, width: leftW, height: h },
      { index: 1, x: leftW + gap, y: 0, width: rightW, height: scaledRightCellH },
      { index: 2, x: leftW + gap, y: scaledRightCellH + gap, width: rightW, height: scaledRightCellH },
    ],
  };
}

function layoutFour(): AlbumLayout {
  const gap = CHAT_ALBUM_GAP;
  const cellW = (CHAT_ALBUM_MAX_WIDTH - gap) / 2;
  const cellH = cellW;
  const height = cellH * 2 + gap;

  return {
    width: CHAT_ALBUM_MAX_WIDTH,
    height,
    rects: [
      { index: 0, x: 0, y: 0, width: cellW, height: cellH },
      { index: 1, x: cellW + gap, y: 0, width: cellW, height: cellH },
      { index: 2, x: 0, y: cellH + gap, width: cellW, height: cellH },
      { index: 3, x: cellW + gap, y: cellH + gap, width: cellW, height: cellH },
    ],
  };
}

function layoutGrid(ratios: number[]): AlbumLayout {
  const gap = CHAT_ALBUM_GAP;
  const rects: AlbumLayoutRect[] = [];
  let y = 0;
  let maxW = 0;

  for (let i = 0; i < ratios.length; ) {
    const left = ratios.length - i;
    const inRow = left === 1 ? 1 : 2;
    const rowRatios = ratios.slice(i, i + inRow);
    const sum = rowRatios.reduce((a, b) => a + b, 0);
    const h = Math.min(180, (CHAT_ALBUM_MAX_WIDTH - (inRow - 1) * gap) / sum);
    let x = 0;

    for (let j = 0; j < inRow; j++) {
      const w = h * rowRatios[j];
      rects.push({ index: i + j, x, y, width: w, height: h });
      x += w + gap;
    }

    maxW = Math.max(maxW, x - gap);
    y += h + gap;
    i += inRow;
  }

  return {
    width: Math.min(CHAT_ALBUM_MAX_WIDTH, maxW),
    height: Math.min(CHAT_ALBUM_MAX_HEIGHT, y - gap),
    rects,
  };
}
