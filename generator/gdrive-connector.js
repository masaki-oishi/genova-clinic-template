/**
 * Google Drive Connector
 * DriveフォルダのURLを渡すだけで、原稿と画像を自動取得してサイト生成する
 *
 * フォルダ構成（推奨）:
 *   📁 【クリニック名】サイト制作/
 *   ├── 📄 クリニック情報（Google Docs — テーブル形式）
 *   ├── 📁 原稿/
 *   │   ├── 📄 医院紹介.gdoc
 *   │   ├── 📄 診療案内.gdoc
 *   │   └── ...
 *   └── 📁 写真/
 *       ├── director.jpg
 *       ├── exterior.jpg
 *       └── ...
 *
 * サブフォルダがなくても、フォルダ直下にファイルがあれば自動検出する。
 */

import { getDriveClient, getDocsClient } from './auth.js';
import { parseGoogleDoc } from './gdocs-parser.js';
import fs from 'fs/promises';
import path from 'path';

const MIME = {
  FOLDER: 'application/vnd.google-apps.folder',
  GDOC: 'application/vnd.google-apps.document',
};

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic'];

/**
 * メインエントリ: DriveフォルダIDから全データを取得
 */
export async function connectDriveFolder(folderId, options = {}) {
  const { tempDir = path.join(process.cwd(), '.tmp-drive') } = options;

  console.log('  フォルダ構造を解析中...');
  const structure = await discoverFolderStructure(folderId);

  // 1. クリニック情報
  let clinicInfo = null;
  if (structure.clinicInfoDocId) {
    console.log('  クリニック情報を取得中...');
    clinicInfo = await fetchClinicInfo(structure.clinicInfoDocId);
    console.log(`    ✓ ${clinicInfo.name || '(名称未設定)'}`);
  }

  // 2. 原稿
  console.log('  原稿を取得中...');
  const docs = await fetchPageDocs(structure.docsFolder, structure.looseDocs);
  console.log(`    ✓ ${Object.keys(docs).length}ページ分の原稿を取得`);

  // 3. 画像
  let imagesDir = null;
  const allImages = [...structure.looseImages];
  if (structure.imagesFolder) {
    const imgFolderContents = await listFolderContents(structure.imagesFolder);
    allImages.push(...imgFolderContents.filter(f => IMAGE_MIMES.includes(f.mimeType)));
  }

  if (allImages.length > 0) {
    console.log(`  写真をダウンロード中... (${allImages.length}枚)`);
    imagesDir = path.join(tempDir, 'images');
    await downloadImages(allImages, imagesDir);
    console.log(`    ✓ ${allImages.length}枚ダウンロード完了`);
  }

  return { clinicInfo, docs, imagesDir };
}

/**
 * フォルダ構造を自動検出
 */
async function discoverFolderStructure(folderId) {
  const contents = await listFolderContents(folderId);

  const result = {
    clinicInfoDocId: null,
    docsFolder: null,
    imagesFolder: null,
    looseDocs: [],
    looseImages: [],
  };

  for (const item of contents) {
    // サブフォルダ
    if (item.mimeType === MIME.FOLDER) {
      if (item.name.match(/原稿|テキスト|文章|docs|text/i)) {
        result.docsFolder = item.id;
      }
      if (item.name.match(/写真|画像|photo|image|img/i)) {
        result.imagesFolder = item.id;
      }
      continue;
    }

    // Google Docs
    if (item.mimeType === MIME.GDOC) {
      if (item.name.match(/クリニック情報|基本情報|clinic.info|医院情報/i)) {
        result.clinicInfoDocId = item.id;
      } else {
        result.looseDocs.push(item);
      }
      continue;
    }

    // 画像
    if (IMAGE_MIMES.includes(item.mimeType)) {
      result.looseImages.push(item);
    }
  }

  return result;
}

/**
 * Drive APIでフォルダ内ファイル一覧を取得
 */
async function listFolderContents(folderId) {
  const drive = await getDriveClient();
  const items = [];
  let pageToken = null;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size)',
      pageSize: 100,
      pageToken,
    });
    items.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return items;
}

/**
 * クリニック情報ドキュメント（テーブル形式）をパース
 */
async function fetchClinicInfo(docId) {
  const docData = await parseGoogleDoc(docId);

  // テーブルの最初のものをkey-valueとして解釈
  const mapping = {
    '医院名': 'name', 'クリニック名': 'name', '名前': 'name',
    '英語名': 'name_en', 'English': 'name_en',
    '略称': 'name_short',
    'キャッチコピー': 'catchcopy', 'コンセプト': 'catchcopy',
    '電話番号': 'tel', 'TEL': 'tel', '電話': 'tel',
    '住所': 'address', '所在地': 'address',
    '郵便番号': 'zip', '〒': 'zip',
    '診療時間': 'hours_weekday', '平日診療時間': 'hours_weekday',
    '土曜診療': 'hours_sat', '土曜': 'hours_sat',
    '休診日': 'closed', '休診': 'closed',
    '院長名': 'director_name', '院長': 'director_name',
    '院長名ふりがな': 'director_name_kana', 'ふりがな': 'director_name_kana',
    'Google Maps': 'gmap_embed', '地図': 'gmap_embed',
    'LINE': 'line_url', 'LINE予約': 'line_url',
    'Web予約': 'web_yoyaku', '予約URL': 'web_yoyaku',
  };

  const clinic = {};

  if (docData.tables && docData.tables.length > 0) {
    for (const row of docData.tables[0]) {
      if (row.length >= 2) {
        const key = row[0].trim();
        const value = row[1].trim();
        for (const [jpKey, enKey] of Object.entries(mapping)) {
          if (key.includes(jpKey)) {
            clinic[enKey] = value;
            break;
          }
        }
      }
    }
  }

  // テーブルがない場合、メタデータからも取得
  if (docData.meta) {
    for (const [key, value] of Object.entries(docData.meta)) {
      for (const [jpKey, enKey] of Object.entries(mapping)) {
        if (key.includes(jpKey)) {
          clinic[enKey] = value;
        }
      }
    }
  }

  return clinic;
}

/**
 * 原稿Google Docsを一括取得してページにマッピング
 */
async function fetchPageDocs(docsFolder, looseDocs) {
  let docFiles = [...looseDocs];

  if (docsFolder) {
    const folderDocs = await listFolderContents(docsFolder);
    docFiles.push(...folderDocs.filter(f => f.mimeType === MIME.GDOC));
  }

  const pageMapping = {
    '医院紹介': 'about', '当院について': 'about', 'About': 'about',
    '診療案内': 'treatment', '診療内容': 'treatment', 'Treatment': 'treatment',
    'スタッフ': 'staff', 'チーム': 'staff', 'Staff': 'staff',
    'アクセス': 'access', '交通案内': 'access', 'Access': 'access',
    '料金': 'price', '費用': 'price', 'Price': 'price',
    // 歯科詳細
    '一般歯科': 'general', '虫歯': 'general',
    '審美': 'aesthetic', 'ホワイトニング': 'aesthetic',
    '予防': 'preventive', 'メンテナンス': 'preventive',
    '小児歯科': 'pediatric', 'こども': 'pediatric',
    'インプラント': 'implant', 'Implant': 'implant',
    '矯正': 'ortho', '歯並び': 'ortho',
    // 医科詳細
    '内科': 'internal',
    '皮膚科': 'derma',
    '美容皮膚科': 'cosmetic', '美容': 'cosmetic',
    '整形外科': 'orthopedic',
    '眼科': 'eye',
    '小児科': 'pediatrics',
  };

  const results = {};

  for (const doc of docFiles) {
    const pageKey = matchPageKey(doc.name, pageMapping);
    if (pageKey) {
      try {
        results[pageKey] = await parseGoogleDoc(doc.id);
        console.log(`    ✓ ${doc.name} → ${pageKey}`);
      } catch (err) {
        console.error(`    ✗ ${doc.name}: ${err.message}`);
      }
    } else {
      console.log(`    ? ${doc.name} — ページマッピング不明（スキップ）`);
    }
  }

  return results;
}

/**
 * ドキュメント名からページキーを推定
 */
function matchPageKey(name, mapping) {
  for (const [keyword, key] of Object.entries(mapping)) {
    if (name.includes(keyword)) return key;
  }
  return null;
}

/**
 * 画像ファイルをGoogle Driveからダウンロード
 */
async function downloadImages(imageFiles, outputDir) {
  const drive = await getDriveClient();
  await fs.mkdir(outputDir, { recursive: true });

  for (const img of imageFiles) {
    try {
      const response = await drive.files.get(
        { fileId: img.id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      const ext = mimeToExt(img.mimeType);
      const safeName = sanitizeFilename(img.name, ext);
      const filePath = path.join(outputDir, safeName);

      await fs.writeFile(filePath, Buffer.from(response.data));
    } catch (err) {
      console.error(`    ✗ ${img.name}: ${err.message}`);
    }
  }
}

function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/tiff': 'tiff',
    'image/heic': 'heic',
  };
  return map[mime] || 'jpg';
}

function sanitizeFilename(name, fallbackExt) {
  // 拡張子があればそのまま、なければ付与
  const hasExt = /\.\w{2,4}$/.test(name);
  const base = hasExt ? name.replace(/\.\w{2,4}$/, '') : name;
  const ext = hasExt ? name.match(/\.(\w{2,4})$/)[1] : fallbackExt;

  return base
    .replace(/[^\w\u3000-\u9FFF\u30A0-\u30FF\u3040-\u309F._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    + '.' + ext;
}

/**
 * DriveフォルダURLからフォルダIDを抽出
 */
export function extractFolderId(urlOrId) {
  // フォルダURL: https://drive.google.com/drive/folders/FOLDER_ID
  const match = urlOrId.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // ドキュメントURL: https://docs.google.com/document/d/DOC_ID
  const docMatch = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) return docMatch[1];

  // IDそのまま
  return urlOrId;
}

/**
 * 一時ファイルをクリーンアップ
 */
export async function cleanup(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {}
}
