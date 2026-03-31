/**
 * Google Docs Parser
 * Google ドキュメントの原稿を構造化データに変換
 *
 * 原稿のフォーマット規約:
 *   # 見出し1  → セクションタイトル
 *   ## 見出し2 → サブセクションタイトル
 *   ### 見出し3 → 項目タイトル
 *   通常テキスト → 本文
 *   [画像]     → Google Docs内の画像を抽出
 *   ---        → セクション区切り
 *   - リスト   → リストアイテム
 *   | テーブル → テーブルデータ
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

/**
 * Google Docs APIクライアント初期化
 */
async function getDocsClient() {
  // サービスアカウントキーまたはOAuth2で認証
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(process.cwd(), 'credentials.json');

  let auth;
  try {
    const keyFile = JSON.parse(await fs.readFile(keyPath, 'utf-8'));

    if (keyFile.type === 'service_account') {
      auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/documents.readonly',
                 'https://www.googleapis.com/auth/drive.readonly'],
      });
    } else {
      // OAuth2 client
      const { client_id, client_secret, redirect_uris } = keyFile.installed || keyFile.web;
      const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      const tokenPath = path.join(path.dirname(keyPath), 'token.json');
      const token = JSON.parse(await fs.readFile(tokenPath, 'utf-8'));
      oauth2.setCredentials(token);
      auth = oauth2;
    }
  } catch {
    throw new Error(
      'Google認証情報が見つかりません。\n' +
      'credentials.json をgeneratorディレクトリに配置するか、\n' +
      'GOOGLE_APPLICATION_CREDENTIALS 環境変数を設定してください。'
    );
  }

  return google.docs({ version: 'v1', auth });
}

/**
 * Google Docsドキュメントを取得して構造化データに変換
 */
export async function parseGoogleDoc(docId) {
  const docs = await getDocsClient();
  const { data } = await docs.documents.get({ documentId: docId });

  return extractContent(data);
}

/**
 * ドキュメント構造からコンテンツを抽出
 */
function extractContent(doc) {
  const result = {
    title: doc.title,
    sections: [],
    images: [],
    tables: [],
    meta: {},
  };

  let currentSection = null;

  for (const element of doc.body.content) {
    if (element.paragraph) {
      const para = element.paragraph;
      const style = para.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
      const text = extractText(para);

      // メタデータ行（key: value 形式）
      if (text.match(/^[a-zA-Z_]+:\s*.+$/)) {
        const [key, ...rest] = text.split(':');
        result.meta[key.trim()] = rest.join(':').trim();
        continue;
      }

      // セクション区切り
      if (text.trim() === '---') {
        currentSection = null;
        continue;
      }

      // 見出し
      if (style.startsWith('HEADING_')) {
        const level = parseInt(style.replace('HEADING_', ''));
        if (level === 1) {
          currentSection = { title: text, en: '', content: [], subsections: [] };
          result.sections.push(currentSection);
        } else if (level === 2 && currentSection) {
          const sub = { title: text, content: [] };
          currentSection.subsections.push(sub);
        } else if (level === 3 && currentSection) {
          // 英語ラベルとして使う（小見出し）
          if (currentSection.subsections.length > 0) {
            const lastSub = currentSection.subsections[currentSection.subsections.length - 1];
            lastSub.subtitle = text;
          } else {
            currentSection.en = text;
          }
        }
        continue;
      }

      // リスト
      if (para.bullet) {
        const target = getActiveTarget(currentSection);
        if (target) {
          if (!target._lastList) {
            target._lastList = [];
            target.content.push({ type: 'list', items: target._lastList });
          }
          target._lastList.push(text);
        }
        continue;
      }

      // 通常テキスト
      if (text.trim()) {
        const target = getActiveTarget(currentSection);
        if (target) {
          target._lastList = null; // リスト終了
          target.content.push({ type: 'text', value: text });
        }
      }

      // 画像
      for (const el of para.elements || []) {
        if (el.inlineObjectElement) {
          const objId = el.inlineObjectElement.inlineObjectId;
          const obj = doc.inlineObjects?.[objId];
          if (obj) {
            const imgProps = obj.inlineObjectProperties?.embeddedObject;
            if (imgProps?.imageProperties?.contentUri) {
              const imgData = {
                url: imgProps.imageProperties.contentUri,
                alt: imgProps.title || imgProps.description || '',
                width: imgProps.size?.width?.magnitude,
                height: imgProps.size?.height?.magnitude,
              };
              result.images.push(imgData);
              const target = getActiveTarget(currentSection);
              if (target) {
                target.content.push({ type: 'image', ...imgData });
              }
            }
          }
        }
      }
    }

    // テーブル
    if (element.table) {
      const tableData = extractTable(element.table);
      result.tables.push(tableData);
      const target = getActiveTarget(currentSection);
      if (target) {
        target.content.push({ type: 'table', data: tableData });
      }
    }
  }

  // クリーンアップ
  cleanupSections(result.sections);

  return result;
}

/**
 * パラグラフからテキストを抽出
 */
function extractText(paragraph) {
  return (paragraph.elements || [])
    .map(el => el.textRun?.content || '')
    .join('')
    .trim();
}

/**
 * テーブルを配列に変換
 */
function extractTable(table) {
  return (table.tableRows || []).map(row =>
    (row.tableCells || []).map(cell =>
      (cell.content || [])
        .map(c => c.paragraph ? extractText(c.paragraph) : '')
        .join('\n')
        .trim()
    )
  );
}

/**
 * コンテンツ追加先を取得
 */
function getActiveTarget(section) {
  if (!section) return null;
  if (section.subsections.length > 0) {
    return section.subsections[section.subsections.length - 1];
  }
  return section;
}

/**
 * 内部プロパティを削除
 */
function cleanupSections(sections) {
  for (const sec of sections) {
    delete sec._lastList;
    for (const sub of sec.subsections || []) {
      delete sub._lastList;
    }
  }
}

/**
 * ローカルMarkdownファイルをパース（Google Docs API不要の代替手段）
 */
export async function parseMarkdownFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseMarkdown(content);
}

/**
 * Markdownテキストをパース
 */
export function parseMarkdown(text) {
  const lines = text.split('\n');
  const result = {
    title: '',
    sections: [],
    images: [],
    tables: [],
    meta: {},
  };

  let currentSection = null;

  for (const line of lines) {
    // メタデータ（YAML frontmatter風）
    if (line.match(/^[a-z_]+:\s*.+$/i) && result.sections.length === 0) {
      const [key, ...rest] = line.split(':');
      result.meta[key.trim()] = rest.join(':').trim();
      continue;
    }

    // 見出し1
    if (line.startsWith('# ')) {
      const title = line.replace(/^# /, '').trim();
      if (!result.title) result.title = title;
      currentSection = { title, en: '', content: [], subsections: [] };
      result.sections.push(currentSection);
      continue;
    }

    // 見出し2
    if (line.startsWith('## ')) {
      if (currentSection) {
        currentSection.subsections.push({
          title: line.replace(/^## /, '').trim(),
          content: [],
        });
      }
      continue;
    }

    // 見出し3
    if (line.startsWith('### ')) {
      if (currentSection) currentSection.en = line.replace(/^### /, '').trim();
      continue;
    }

    // 区切り
    if (line.trim() === '---') {
      currentSection = null;
      continue;
    }

    // リスト
    if (line.match(/^[-*]\s/)) {
      const target = getActiveTarget(currentSection);
      if (target) {
        if (!target._lastList) {
          target._lastList = [];
          target.content.push({ type: 'list', items: target._lastList });
        }
        target._lastList.push(line.replace(/^[-*]\s/, '').trim());
      }
      continue;
    }

    // 画像
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      const imgData = { alt: imgMatch[1], url: imgMatch[2] };
      result.images.push(imgData);
      const target = getActiveTarget(currentSection);
      if (target) {
        target._lastList = null;
        target.content.push({ type: 'image', ...imgData });
      }
      continue;
    }

    // 通常テキスト
    if (line.trim()) {
      const target = getActiveTarget(currentSection);
      if (target) {
        target._lastList = null;
        target.content.push({ type: 'text', value: line.trim() });
      }
    }
  }

  cleanupSections(result.sections);
  return result;
}
