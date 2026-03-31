/**
 * Image Processor
 * 写真のリサイズ・WebP変換・軽量化を自動処理
 *
 * 使い方:
 *   import { processImages } from './image-processor.js';
 *   await processImages('./input-images', './output', config.images);
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif'];

/**
 * 画像ディレクトリを一括処理
 */
export async function processImages(inputDir, outputDir, options = {}) {
  const {
    sizes = {},
    formats = ['webp', 'jpg'],
    quality = 82,
    max_width = 1920,
  } = options;

  // 入力画像を取得
  const files = await glob('**/*', {
    cwd: inputDir,
    nodir: true,
    absolute: true,
  });

  const imageFiles = files.filter(f =>
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );

  if (imageFiles.length === 0) {
    console.log('  処理対象の画像がありません');
    return [];
  }

  console.log(`  ${imageFiles.length}枚の画像を処理します...`);

  const results = [];

  for (const filePath of imageFiles) {
    const relativePath = path.relative(inputDir, filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const subDir = path.dirname(relativePath);

    try {
      const result = await processSingleImage(filePath, {
        outputDir: path.join(outputDir, subDir),
        baseName,
        sizes,
        formats,
        quality,
        max_width,
      });
      results.push({ input: relativePath, outputs: result });
      console.log(`  ✓ ${relativePath}`);
    } catch (err) {
      console.error(`  ✗ ${relativePath}: ${err.message}`);
      results.push({ input: relativePath, error: err.message });
    }
  }

  return results;
}

/**
 * 単一画像を処理
 */
async function processSingleImage(filePath, options) {
  const { outputDir, baseName, sizes, formats, quality, max_width } = options;

  await fs.mkdir(outputDir, { recursive: true });

  const image = sharp(filePath);
  const metadata = await image.metadata();
  const outputs = [];

  // 1. オリジナルサイズ（最大幅制限 + フォーマット変換）
  for (const fmt of formats) {
    const outPath = path.join(outputDir, `${baseName}.${fmt}`);
    let pipeline = sharp(filePath);

    // 最大幅を超える場合はリサイズ
    if (metadata.width > max_width) {
      pipeline = pipeline.resize(max_width, null, { withoutEnlargement: true });
    }

    pipeline = applyFormat(pipeline, fmt, quality);
    await pipeline.toFile(outPath);

    const stat = await fs.stat(outPath);
    outputs.push({
      path: outPath,
      format: fmt,
      size: stat.size,
      variant: 'original',
    });
  }

  // 2. 名前付きサイズ（hero, card, staff等）
  for (const [sizeName, dims] of Object.entries(sizes)) {
    for (const fmt of formats) {
      const outPath = path.join(outputDir, `${baseName}-${sizeName}.${fmt}`);

      let pipeline = sharp(filePath)
        .resize(dims.width, dims.height, {
          fit: 'cover',
          position: 'centre',
          withoutEnlargement: true,
        });

      pipeline = applyFormat(pipeline, fmt, quality);
      await pipeline.toFile(outPath);

      const stat = await fs.stat(outPath);
      outputs.push({
        path: outPath,
        format: fmt,
        size: stat.size,
        variant: sizeName,
        width: dims.width,
        height: dims.height,
      });
    }
  }

  return outputs;
}

/**
 * フォーマット変換を適用
 */
function applyFormat(pipeline, format, quality) {
  switch (format) {
    case 'webp':
      return pipeline.webp({ quality, effort: 4 });
    case 'jpg':
    case 'jpeg':
      return pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
    case 'png':
      return pipeline.png({ quality, compressionLevel: 9 });
    case 'avif':
      return pipeline.avif({ quality, effort: 4 });
    default:
      return pipeline.webp({ quality });
  }
}

/**
 * 処理結果のサマリーを出力
 */
export function printSummary(results) {
  let totalInput = 0;
  let totalOutput = 0;
  let fileCount = 0;

  for (const r of results) {
    if (r.error) continue;
    for (const o of r.outputs) {
      totalOutput += o.size;
      fileCount++;
    }
  }

  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.filter(r => r.error).length;

  console.log('\n  === 画像処理サマリー ===');
  console.log(`  処理: ${successCount}枚 / エラー: ${errorCount}枚`);
  console.log(`  出力ファイル: ${fileCount}個`);
  console.log(`  合計サイズ: ${(totalOutput / 1024 / 1024).toFixed(1)}MB`);
}
