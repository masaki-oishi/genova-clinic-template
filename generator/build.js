#!/usr/bin/env node

/**
 * Clinic Template Generator
 *
 * Google Docs（またはMarkdown）の原稿 + 写真 → WordPress PHP ファイルを自動生成
 *
 * 使い方:
 *   node build.js                              # config.json に基づいて全ページ生成
 *   node build.js --gdoc=DOCUMENT_ID           # 特定のGoogle Docから生成
 *   node build.js --markdown=./原稿.md          # Markdownファイルから生成
 *   node build.js --images=./photos            # 画像処理のみ
 *   node build.js --page=about                 # 特定ページのみ生成
 *   node build.js --init                       # 新規クリニック用config生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseGoogleDoc, parseMarkdownFile, parseMarkdown } from './gdocs-parser.js';
import { processImages, printSummary } from './image-processor.js';
import { connectDriveFolder, extractFolderId, cleanup } from './gdrive-connector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI引数パース ───
const args = Object.fromEntries(
  process.argv.slice(2)
    .map(a => {
      if (a.startsWith('--')) {
        const [key, ...val] = a.slice(2).split('=');
        return [key, val.join('=') || true];
      }
      return null;
    })
    .filter(Boolean)
);

async function main() {
  console.log('\n🏥 Clinic Template Generator\n');

  // config読み込み
  const configPath = args.config || path.join(__dirname, 'config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  // --init: 新規config生成
  if (args.init) {
    await initConfig();
    return;
  }

  // 出力ディレクトリ
  const outputDir = path.resolve(__dirname, config.output_dir || '../output');
  await fs.mkdir(outputDir, { recursive: true });

  // ── Google Driveモード ──
  let driveData = null;
  const tempDir = path.join(__dirname, '.tmp-drive');

  if (args.drive) {
    const folderId = extractFolderId(args.drive);
    console.log(`📁 Google Drive フォルダを読み込み中... (${folderId})\n`);

    driveData = await connectDriveFolder(folderId, { tempDir });

    // クリニック情報をconfigに上書き
    if (driveData.clinicInfo) {
      Object.assign(config.clinic, driveData.clinicInfo);
      console.log(`\n✓ クリニック情報: ${config.clinic.name || '(未設定)'}`);
    }

    // 画像処理
    if (driveData.imagesDir) {
      console.log('\n📷 画像処理中...');
      const imgOutput = path.resolve(__dirname, config.images.output_dir);
      const results = await processImages(driveData.imagesDir, imgOutput, config.images);
      printSummary(results);
    }

    console.log('');
  }

  // ── 画像処理（ローカルモード） ──
  if (!args.drive && (args.images || !args.page)) {
    const imgInput = args.images
      ? path.resolve(args.images)
      : path.resolve(__dirname, config.images.input_dir);

    const imgOutput = path.resolve(__dirname, config.images.output_dir);

    try {
      await fs.access(imgInput);
      console.log('📷 画像処理中...');
      const results = await processImages(imgInput, imgOutput, config.images);
      printSummary(results);
    } catch {
      if (args.images) {
        console.error(`❌ 画像ディレクトリが見つかりません: ${imgInput}`);
      } else {
        console.log('📷 画像入力ディレクトリなし — スキップ');
      }
    }
  }

  // ── ページ生成 ──
  if (args.images && !args.gdoc && !args.markdown && !args.page && !args.drive) {
    // 画像処理のみ
    console.log('\n✅ 画像処理完了\n');
    return;
  }

  // 対象ページを決定
  const pages = args.page
    ? { [args.page]: config.pages[args.page] }
    : config.pages;

  if (args.page && !config.pages[args.page]) {
    console.error(`❌ ページ "${args.page}" が見つかりません`);
    console.log('利用可能:', Object.keys(config.pages).join(', '));
    process.exit(1);
  }

  // 原稿データを取得
  let docData = null;

  if (args.gdoc) {
    console.log(`📄 Google Docs を取得中... (${args.gdoc})`);
    docData = await parseGoogleDoc(args.gdoc);
    console.log(`  タイトル: ${docData.title}`);
    console.log(`  セクション: ${docData.sections.length}個`);
  } else if (args.markdown) {
    console.log(`📄 Markdownファイルを読み込み中... (${args.markdown})`);
    docData = await parseMarkdownFile(path.resolve(args.markdown));
    console.log(`  タイトル: ${docData.title}`);
    console.log(`  セクション: ${docData.sections.length}個`);
  }

  // 各ページのPHPを生成
  console.log('\n📝 PHPファイル生成中...');

  for (const [pageKey, pageConfig] of Object.entries(pages)) {
    if (!pageConfig) continue;

    // Driveモード: driveDataから原稿を取得
    // 個別ページのGDoc IDがある場合はそちらを使う
    let pageData = driveData?.docs?.[pageKey] || docData;
    if (!pageData && pageConfig.gdoc_id) {
      console.log(`  📄 ${pageKey}: Google Docs を取得中...`);
      pageData = await parseGoogleDoc(pageConfig.gdoc_id);
    }

    // テンプレートPHPを読み込み
    const templatePath = path.resolve(__dirname, `../templates/${pageConfig.template}.php`);
    let templateContent;
    try {
      templateContent = await fs.readFile(templatePath, 'utf-8');
    } catch {
      console.error(`  ✗ テンプレートが見つかりません: ${templatePath}`);
      continue;
    }

    // PHPにクリニック情報と原稿データを注入
    const outputContent = injectContent(templateContent, config.clinic, pageData, pageConfig);

    // 出力
    const outputPath = path.join(outputDir, `${pageConfig.template}.php`);
    await fs.writeFile(outputPath, outputContent, 'utf-8');
    console.log(`  ✓ ${pageKey} → ${path.relative(process.cwd(), outputPath)}`);
  }

  // WordPress用の設定ファイルも出力
  await generateWpConfig(outputDir, config.clinic);

  // Driveモード: 一時ファイルのクリーンアップ
  if (args.drive) {
    await cleanup(tempDir);
  }

  console.log('\n✅ 生成完了!\n');
  console.log(`出力先: ${outputDir}`);
  console.log('WordPress管理画面 > 外観 > カスタマイズ でクリニック情報を設定してください\n');
}

/**
 * テンプレートPHPにコンテンツを注入
 */
function injectContent(template, clinic, docData, pageConfig) {
  let output = template;

  // テンプレート内のプレースホルダーテキストを原稿データで置換
  if (docData) {
    // 各セクションのコンテンツをPHP変数として注入
    const sections = docData.sections;

    for (const section of sections) {
      const sectionTitle = section.title;
      const sectionContent = section.content
        .map(c => {
          if (c.type === 'text') return `<p>${escapeHtml(c.value)}</p>`;
          if (c.type === 'list') return `<ul>${c.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
          if (c.type === 'image') return `<!-- IMAGE: ${c.url} alt="${c.alt}" -->`;
          return '';
        })
        .join('\n');

      // セクションタイトルに基づいてプレースホルダーを置換
      output = replaceSectionContent(output, sectionTitle, sectionContent, section);
    }

    // メタデータの注入
    if (docData.meta) {
      for (const [key, value] of Object.entries(docData.meta)) {
        output = output.replace(new RegExp(`%%${key}%%`, 'g'), escapeHtml(value));
      }
    }
  }

  // クリニック情報の直接注入（プレビュー用）
  const replacements = {
    '○○歯科クリニック': clinic.name,
    '○○ Dental Clinic': clinic.name_en,
    '000-000-0000': clinic.tel,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value) {
      output = output.replaceAll(placeholder, value);
    }
  }

  return output;
}

/**
 * セクションコンテンツを適切な場所に挿入
 */
function replaceSectionContent(template, title, content, section) {
  // 原稿のセクションタイトルとテンプレートのマッチング
  const patterns = {
    '理念': 'philosophy',
    '想い': 'philosophy',
    'コンセプト': 'philosophy',
    '特徴': 'features',
    '院長': 'message',
    'メッセージ': 'message',
    '挨拶': 'message',
    '診療': 'treatment',
    '料金': 'price',
    'スタッフ': 'staff',
    'アクセス': 'access',
    '概要': 'info',
  };

  // マッチするセクションを探す
  for (const [keyword, sectionId] of Object.entries(patterns)) {
    if (title.includes(keyword)) {
      // コメントマーカーで置換位置を特定
      const marker = `<!-- CONTENT:${sectionId} -->`;
      if (template.includes(marker)) {
        return template.replace(marker, content);
      }
    }
  }

  return template;
}

/**
 * WordPress Customizer用の初期設定を出力
 */
async function generateWpConfig(outputDir, clinic) {
  const wpConfig = {
    theme_mods: {
      clinic_name: clinic.name,
      clinic_name_en: clinic.name_en,
      clinic_catchcopy: clinic.catchcopy,
      clinic_tel: clinic.tel,
      clinic_address: clinic.address,
      clinic_hours: clinic.hours,
      clinic_closed: clinic.closed,
      clinic_gmap_embed: clinic.gmap_embed,
      clinic_line_url: clinic.line_url,
      clinic_web_yoyaku: clinic.web_yoyaku,
    },
    _note: 'このJSONをWordPressのwp_optionsに theme_mods_genova-clinic として登録するか、カスタマイザーから手動設定してください',
  };

  await fs.writeFile(
    path.join(outputDir, 'wp-customizer-settings.json'),
    JSON.stringify(wpConfig, null, 2),
    'utf-8'
  );
}

/**
 * 新規プロジェクト用のconfig.jsonを対話的に生成
 */
async function initConfig() {
  const template = {
    clinic: {
      name: '',
      name_en: '',
      catchcopy: '',
      tel: '',
      address: '',
      hours: '',
      closed: '',
      gmap_embed: '',
      line_url: '',
      web_yoyaku: '',
    },
    pages: {
      about:     { gdoc_id: '', template: 'page-about',     title: '医院紹介',     slug: 'about' },
      treatment: { gdoc_id: '', template: 'page-treatment', title: '診療案内',     slug: 'treatment' },
      staff:     { gdoc_id: '', template: 'page-staff',     title: 'スタッフ紹介', slug: 'staff' },
      access:    { gdoc_id: '', template: 'page-access',    title: 'アクセス',     slug: 'access' },
      price:     { gdoc_id: '', template: 'page-price',     title: '料金表',       slug: 'price' },
    },
    images: {
      input_dir: './images-input',
      output_dir: '../assets/images',
      sizes: {
        hero:      { width: 1920, height: 800 },
        card:      { width: 640,  height: 480 },
        staff:     { width: 480,  height: 480 },
        thumbnail: { width: 800,  height: 600 },
      },
      formats: ['webp', 'jpg'],
      quality: 82,
      max_width: 1920,
    },
    output_dir: '../output',
  };

  const outPath = path.join(process.cwd(), 'config-new.json');
  await fs.writeFile(outPath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`✅ config-new.json を生成しました`);
  console.log('クリニック情報と Google Docs ID を記入してから build.js を再実行してください');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 実行 ───
main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
